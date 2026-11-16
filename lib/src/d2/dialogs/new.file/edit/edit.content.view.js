/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/backbone", "nuc/lib/underscore", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/commands/reserve", "d2/dialogs/new.file/edit/button.icon.layout.view", "d2/dialogs/new.file/edit/header.message.view", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/utils/constants", "d2/ctf/ctfBridge", "hbs!d2/dialogs/new.file/edit/impl/edit.content", "i18n!d2/dialogs/new.file/edit/impl/nls/lang", "i18n!d2/commands/nls/localized.strings", "css!d2/dialogs/new.file/edit/impl/edit.content" ], function($, Marionette, Backbone, _, PerfectScrollingBehavior, WizardTabableRegionBehavior, ReserveCommand, ButtonIconLayoutView, HeaderMessageView, RestResources, RestLinkrels, utils, constants, ctfBridge, template, lang, commandLang) {
  "use strict";
  return Marionette.LayoutView.extend({
    className: "d2-edit-content",
    template: template,
    regions: {
      buttonRegion: ".button-region"
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true,
        scrollYMarginOffset: 15
      },
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    constructor: function EditContentView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.buttonIconLayoutView = new ButtonIconLayoutView({
        collection: new Backbone.Collection([ {
          id: "edit_now",
          label: lang.EditNow,
          iconClass: "d2-icon-edit-now"
        }, {
          id: "edit_later",
          label: lang.EditLater,
          iconClass: "d2-icon-edit-later"
        } ])
      });
      this.fetchDataForContentEdit();
      this.listenTo(this.buttonIconLayoutView, "button:click", this.onButtonClick);
    },
    prependMessage: function(mode, message) {
      this.$el.find(".d2-header-message-container." + mode).remove();
      if (mode && message) {
        var messageView = new HeaderMessageView({
          message: message,
          mode: mode
        });
        messageView.render();
        this.$el.prepend(messageView.$el);
      }
    },
    fetchDataForContentEdit: function() {
      var url = RestLinkrels.getLink(this.options.node.get("links"), RestLinkrels.CHECKOUT_PRECHECK), me = this;
      function commitPendingObjects() {
        return me.options.action.commitFile(me.options.node, me.options.wizard);
      }
      function reserveFile() {
        me.options.node.contentCreatedBeforeEdit = true;
        $.ajax(me.options.node.connector.extendAjaxOptions({
          url: url,
          success: function(response) {
            switch (response.status) {
             case "WARNING":
              me.prependMessage("warning", response.message);
              break;

             case "ERROR":
              me.prependMessage("error", response.message);
              me.disableEditNow();
              break;

             default:
              me.prependMessage();
              break;
            }
            me.options.wizard.unblockActions();
          },
          error: function(xhr, textStatus, errorThrown) {
            me.prependMessage("error", utils.parseAjaxErrorAsString(xhr, textStatus, errorThrown));
            me.disableEditNow();
            me.options.wizard.unblockActions();
          }
        }));
      }
      me.options.wizard.blockActions();
      if (me.options.action.isLinkedDoc === true) {
        me.options.wizard.unblockActions();
        reserveFile();
      } else {
        commitPendingObjects().always(function() {
          var linkedNodes = me.options.action._getLinkedNodes(me.options.node, me.options.wizard), msg = commandLang.CreateItemSuccessMessageFormat;
          if (linkedNodes && linkedNodes.length > 0) {
            msg = commandLang.CreateItemSuccessMessageFormatWithLink;
          }
          me.prependMessage("success", _.str.sformat(msg, me.options.node.get("name")));
          reserveFile();
        });
      }
    },
    disableEditNow: function() {
      var buttonView = this.buttonIconLayoutView.children.findByModel(this.buttonIconLayoutView.collection.findWhere({
        id: "edit_now"
      }));
      buttonView.disable();
    },
    onButtonClick: function(model) {
      switch (model.get("id")) {
       case "edit_now":
        this.onClickEditNow();
        break;

       case "edit_later":
        this.onClickEditLater();
        break;
      }
    },
    onClickEditNow: function() {
      var node = this.options.node, me = this;
      me.getInitialDataForCheckout(node).done(function() {
        me.options.wizard.blockActions();
        $.ajax(node.connector.extendAjaxOptions({
          type: "PUT",
          url: RestLinkrels.getLink(me.options.node.get("links"), RestLinkrels.CHECKOUT),
          success: function(response) {
            node.set("links", node.get("links").concat(response.links));
            var dlHelper = me.options.downloadHelper, downloadLink = dlHelper.getDownloadLink(node);
            if (!downloadLink) {
              me.contentLessObject = true;
            }
            if (ctfBridge.isCtfEnabled()) {
              me.options.wizard.unblockActions();
              me.options.wizard.nextStep();
            } else {
              if (downloadLink) {
                dlHelper._downloadContent(node);
              }
              me.options.wizard.unblockActions();
              me.options.wizard.nextStep();
            }
          },
          error: function() {
            me.prependMessage("error", _.str.sformat(lang.CheckoutFailed, node.get("name")));
            me.disableEditNow();
            me.options.wizard.unblockActions();
          }
        }));
      });
    },
    getInitialDataForCheckout: function(node) {
      var deferred = $.Deferred();
      if (ctfBridge.isCtfEnabled()) {
        var reserveCommand = new ReserveCommand();
        reserveCommand._validateCtfPath({
          connector: node.connector
        }).done(function() {
          var pref = RestResources.getCurrentUser().get("preferences"), checkoutPath = pref[constants.UserSettings.DOWNLOAD_CHECKOUT_PATH];
          if (checkoutPath) {
            deferred.resolve();
          } else {
            deferred.reject();
          }
        }).fail(deferred.reject);
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    getNextStep: function() {
      if (this.editContentLater) {
        return "finish";
      }
      var nextStep = this.options.action.STEPS.ADD_VERSION;
      if (ctfBridge.isCtfEnabled() && !this.contentLessObject) {
        nextStep = this.options.action.STEPS.DOWNLOADING_CONTENT;
      }
      return nextStep;
    },
    onClickEditLater: function() {
      this.editContentLater = true;
      this.options.wizard.close();
    },
    getTitle: function() {
      return this.options.action.isLinkedDoc === true ? lang.EditLinkedDocumentContentTitle : lang.EditContentTitle;
    },
    getCancelLabel: function() {
      return lang.CancelLabel;
    },
    onRender: function() {
      this.buttonRegion.show(this.buttonIconLayoutView);
    },
    onShow: function() {
      this.$el.closest(".d2-wizard-step-view").css("top", "0");
    }
  });
});