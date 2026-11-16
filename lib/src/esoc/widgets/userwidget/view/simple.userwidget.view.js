/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "nuc/lib/jquery", "csui/utils/url", "esoc/widgets/userwidget/model/extended.model", "esoc/widgets/userwidget/util", "esoc/widgets/userwidget/chat/view/presence.view", "esoc/widgets/userwidget/chat/chatfactory", "esoc/widgets/utils/chat/impl/util", "smart/controls/user/user.profile.view", "i18n!esoc/widgets/userwidget/nls/lang" ], function(_, Marionette, $, Url, UserExtendedInfoModel, Util, PresenceView, ChatFactory, ChatUtil, SmartUserProfile, Lang) {
  var SimpleUserWidgetView = SmartUserProfile.extend({
    constructor: function SimpleUserWidgetView(options) {
      options = options || {};
      options.chatEnabled = options.model.attributes.chatSettings && options.model.attributes.chatSettings.chatEnabled;
      var generalOptions = _.extend({}, options);
      generalOptions.model = new UserExtendedInfoModel(generalOptions);
      generalOptions.model.fetch({
        success: generalOptions.model.fetchSuccess,
        error: generalOptions.model.fetchError,
        async: false
      });
      SmartUserProfile.prototype.constructor.call(this, generalOptions);
      this.options.destroyCallBack = _.bind(function(e) {
        var deferred = $.Deferred(), context = this.context || this.options.context, parentView = this.parentView || this.options.parentView;
        if (context.cannotMoveOutOfSettingPage) {
          return parentView.leaveOrCancelAlert(e);
        } else if (context.canBeSavedDirectlyAlert) {
          return parentView.saveOrDeclineAlert(e);
        }
        return deferred.resolve({
          ok: true
        });
      }, this);
      this.options.switchTabCallBack = function(e) {
        var deferred = $.Deferred(), self = this;
        var hashTag, target, nextActiveTab = document.activeElement;
        if (!this.settingTab) {
          if (e.target.hash) {
            hashTag = e.target.hash;
            target = e.target;
          } else if (e.target.parentElement && e.target.parentElement.hash) {
            hashTag = e.target.parentElement.hash;
            target = e.target.parentElement;
          }
          if (hashTag === "#usersettings") {
            this.settingTab = target;
          }
        }
        var context = this.context || this.options.context;
        if (context.cannotMoveOutOfSettingPage) {
          e.preventDefault();
          return self.parentView.leaveOrCancelAlertOnTabSwitch(e, nextActiveTab);
        } else if (context.canBeSavedDirectlyAlert) {
          return self.parentView.saveOrDeclineAlertOnTabSwitch(e);
        }
        return deferred.resolve({
          switchTab: true
        });
      };
      this.listenTo(this, "update:ajax:call", function(options) {
        var v2url = this.options.connector.getConnectionUrl().getApiBase("v2"), ajaxParams = {
          itemview: this,
          url: Url.combine(v2url, options.upload ? Util.commonUtil.REST_URLS.updatePhotoUrl : Util.commonUtil.REST_URLS.deletePhotoUrl),
          type: options.upload ? "POST" : "DELETE",
          requestType: options.upload ? "updatePhoto" : "deletePhoto",
          targetElement: options.target,
          connector: this.options.connector
        };
        if (options.upload) {
          ajaxParams.data = options.formData;
        }
        Util.commonUtil.updateAjaxCall(ajaxParams);
      });
      this.listenTo(this, "set:profile:pic", function() {
        var userId = !!this.options.model.id ? this.options.model.id : this.options.userid, userProfilePicOptions = {
          userid: userId,
          context: this.options.context,
          photoElement: this.$el.find(".esoc-userprofile-img-" + Util.escapeSelector(userId)),
          defaultPhotElement: this.$el.find(".esoc-user-default-avatar-" + Util.escapeSelector(userId)),
          parentView: this,
          viewShownEvent: true
        };
        Util.commonUtil.setProfilePic(userProfilePicOptions);
      });
      this.listenTo(this, "launch:chat:window", function(params) {
        ChatUtil.launchChatWindow(this.options);
      });
      this.listenTo(this, "render:presenceView", function(params) {
        var presenceOptions = {
          id: this.model.attributes.id,
          context: this.options.context,
          username: this.model.attributes.name,
          subscribeEvent: true
        };
        var presenceRegion = new Marionette.Region({
          el: this.$el.find("#esoc-user-profile-presence-indicator")
        });
        ChatFactory.initializeApplication(this.options).promise().done(function() {
          var presenceView = new PresenceView(presenceOptions);
          presenceRegion.show(presenceView);
        });
      });
    },
    saveOrDeclineAlertOnTabSwitch: function(e) {
      var deferred = $.Deferred();
      var self = this;
      require([ "csui/dialogs/modal.alert/modal.alert" ], function(alertDialog) {
        alertDialog.confirmWarning(Lang.txtEnableContentMgt, Lang.hrdUnsaved, {
          buttons: {
            showYes: true,
            labelYes: Lang.lblSave,
            showNo: true,
            labelNo: Lang.lblDiscard
          }
        }).done(function(labelYes) {
          if (self.options.context.canBeSavedDirectlyMethod && typeof self.options.context.canBeSavedDirectlyMethod.saveContentMgtData === "function") {
            self.options.context.canBeSavedDirectlyMethod.saveContentMgtData(true);
          }
        }).fail(function() {
          self.options.context.canBeSavedDirectlyAlert = false;
          deferred.resolve({
            switchTab: true
          });
        });
      });
      return deferred.promise();
    },
    leaveOrCancelAlertOnTabSwitch: function(e, nextActiveTab) {
      var deferred = $.Deferred();
      var self = this;
      require([ "csui/dialogs/modal.alert/modal.alert" ], function(alertDialog) {
        self.dialog = alertDialog.confirmQuestion("", Lang.txtLeaveContentMgt, {
          buttons: {
            showYes: true,
            labelYes: Lang.lblLeave,
            showNo: false,
            showCancel: true,
            labelCancel: Lang.cancel
          }
        }).then(function(result) {
          self.options.context.cannotMoveOutOfSettingPage = false;
          if (self.settingTab) {
            var tabElm = self.settingTab.parentElement;
            if (tabElm) {
              $(tabElm).removeClass("binf-active");
            }
          }
          deferred.resolve({
            switchTab: true
          });
        }, function() {
          if (self.settingTab) {
            self.settingTab.focus();
            var tabElm = self.settingTab.parentElement;
            if (tabElm) {
              if (nextActiveTab) {
                $(nextActiveTab.parentElement).removeClass("binf-active");
              }
              $(tabElm).addClass("binf-active");
            }
          }
          deferred.resolve();
        });
      }, deferred.reject);
      return deferred.promise();
    },
    saveOrDeclineAlert: function(e) {
      var deferred = $.Deferred();
      var self = this;
      require([ "csui/dialogs/modal.alert/modal.alert" ], function(alertDialog) {
        alertDialog.confirmWarning(Lang.txtEnableContentMgt, Lang.hrdUnsaved, {
          buttons: {
            showYes: true,
            labelYes: Lang.lblSave,
            showNo: true,
            labelNo: Lang.lblDiscard
          }
        }).done(function() {
          if (self.options.context.canBeSavedDirectlyMethod && typeof self.options.context.canBeSavedDirectlyMethod.saveContentMgtData === "function") {
            self.options.context.canBeSavedDirectlyMethod.saveContentMgtData(true);
          }
          deferred.resolve({
            ok: true
          });
        }).fail(function() {
          self.options.context.canBeSavedDirectlyAlert = false;
          deferred.resolve({
            ok: true
          });
        });
      });
      return deferred.promise();
    },
    leaveOrCancelAlert: function(e) {
      var deferred = $.Deferred();
      var self = this;
      require([ "csui/dialogs/modal.alert/modal.alert" ], function(alertDialog) {
        self.dialog = alertDialog.confirmQuestion("", Lang.txtLeaveContentMgt, {
          buttons: {
            showYes: true,
            labelYes: Lang.lblLeave,
            showNo: false,
            showCancel: true,
            labelCancel: Lang.cancel
          }
        }).then(function(result) {
          self.options.context.cannotMoveOutOfSettingPage = false;
          deferred.resolve({
            ok: true
          });
        }, function() {
          deferred.resolve();
        });
      }, deferred.reject);
      return deferred.promise();
    }
  });
  return SimpleUserWidgetView;
});