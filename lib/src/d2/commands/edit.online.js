/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/utils/url", "csui/models/command", "csui/utils/commandhelper", "d2/utils/rest.linkrels", "dctmw/dialogs/authentication/oauth.login.dialog", "dctmw/utils/rest.resources", "d2/utils/constants", "dctmw/utils/utils", "d2/utils/authentication.utils", "d2/utils/open.window.popup", "smart/dialogs/modal.alert/modal.alert", "i18n!d2/commands/nls/localized.strings" ], function($, _, Marionette, Url, CommandModel, CommandHelper, RestLinkrels, OAuthLoginDialog, RestResources, constants, utils, AuthUtils, openWindowPopup, ModalAlert, lang) {
  "use strict";
  var CommandEditOnline = CommandModel.extend({
    defaults: {
      signature: "D2-EditOnline",
      command_key: "D2-EditOnline",
      name: lang.CommandNameEditOnline,
      verb: lang.CommandVerbEditOnline,
      scope: "single"
    },
    enabled: function(status, options) {
      const node = CommandHelper.getJustOneNode(status);
      let enabled = node && node.get && (node.get("reserved") !== true || node.get("reserved") === true && node.get("reserved_user_id") === constants.OES_USER);
      if (this.getAuthMode() === constants.AUTH_MODE_BASIC) {
        enabled = false;
      }
      return enabled && CommandModel.prototype.enabled.call(this, status, options);
    },
    execute: function(status) {
      var deferred = $.Deferred(), node = CommandHelper.getJustOneNode(status), me = this, otdsUrl = this.getOtdsUrl(), clientId = this.getClientId(), appName = this.getAppName();
      status.suppressSuccessMessage = true;
      me._blockActions(status.originatingView);
      this.confirmFileSizeWarning(node).done(function() {
        AuthUtils.getAccessToken(node.connector, otdsUrl, clientId, appName).done(accessToken => {
          me.getCollaborationResponse(node, accessToken).done(function(response) {
            me._showWindow(node, status.originatingView, response.editHtml).done(function() {
              me._unblockActions(status.originatingView);
              if (node.get("reserved") !== true) {
                me._refreshNode(node);
              }
              deferred.resolve();
            }).fail(function(error) {
              me._unblockActions(status.originatingView);
              return deferred.reject(new Error(error));
            });
          }).fail(function(errorResponse) {
            me._unblockActions(status.originatingView);
            const error = utils.parseAjaxErrorAsString(errorResponse);
            return deferred.reject(new Error(error));
          });
        }).fail(function(error) {
          me._unblockActions(status.originatingView);
          return deferred.reject(new Error(error));
        });
      }).fail(function() {
        me._unblockActions(status.originatingView);
        return deferred.reject();
      });
      return deferred.promise();
    },
    getCollaborationResponse: function(node, accessToken) {
      var collaborationUrl = this.getCollaborationUrl(node);
      return $.ajax(node.connector.extendAjaxOptions({
        url: collaborationUrl,
        type: "POST",
        contentType: "application/json",
        headers: {
          "X-D2-USER-OTDS-TOKEN": accessToken
        }
      }));
    },
    confirmFileSizeWarning: function(node) {
      var deferred = $.Deferred(), fileSizeLimit = this.getFileSizeLimit(), fileSizeLimitInByte = fileSizeLimit * 1e3 * 1e3;
      if (node.get("reserved") === true && node.get("reserved_user_id") === constants.OES_USER) {
        return deferred.resolve().promise();
      }
      this.getContentSize(node).done(function(contentSize) {
        if (fileSizeLimitInByte && fileSizeLimitInByte <= contentSize) {
          const modalAlertBody = _.str.sformat(lang.OESFileSizeLimitWarningMessage, node.get("name"));
          ModalAlert.confirmWarning(function(result) {
            if (result) {
              deferred.resolve();
            } else {
              deferred.reject();
            }
          }, modalAlertBody, lang.OESFileSizeLimitWarningTitle, {
            buttons: {
              showYes: true,
              labelYes: lang.OESFileSizeLimitWarningButtonYes,
              showNo: false,
              showCancel: true
            }
          });
        } else {
          deferred.resolve();
        }
      });
      return deferred.promise();
    },
    getContentSize: function(node) {
      var def = $.Deferred();
      if (node.get("r_content_size") !== undefined) {
        return def.resolve(node.get("r_content_size")).promise();
      } else {
        node.fetch().done(function() {
          def.resolve(node.get("r_content_size"));
        });
      }
      return def.promise();
    },
    getCollaborationUrl: function(node) {
      var currRepoLinks = RestResources.getCurrentRepository().get("links");
      return Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), "object", node.get("id"), "d2-collaboration-edit");
    },
    getOtdsUrl: function() {
      return RestResources.getProductInfo().get("otds_url");
    },
    getClientId: function() {
      return RestResources.getProductInfo().get("otds_client_id");
    },
    getAppName: function() {
      return RestResources.getProductInfo().get("otds_login_app_name");
    },
    getAuthMode: function() {
      return RestResources.getProductInfo().get("auth_mode");
    },
    getFileSizeLimit: function() {
      return RestResources.getD2Options().oes_file_size_limit_in_mb;
    },
    _showWindow: function(node, originatingView, htmlContent) {
      var height = Math.min(Math.max(window.outerHeight - 200, 500), 800), width = Math.min(Math.max(window.outerWidth - 150, 700), 1e3), top = window.screenTop + (window.outerHeight - height) / 2, left = window.screenLeft + (window.outerWidth - width) / 2;
      const msPopupWindow = openWindowPopup.showWindow("", node.get("id"), htmlContent, height, width, top, left);
      if (!msPopupWindow) {
        return $.Deferred().reject(lang.popupBlockedMessage).promise();
      }
      this.eventListenerForPopupWindow(msPopupWindow, htmlContent);
      return $.Deferred().resolve().promise();
    },
    eventListenerForPopupWindow: function(windowObject, htmlContent) {
      var me = this;
      windowObject.addEventListener("beforeunload", function() {
        setTimeout(function() {
          this.document && this.document.write(htmlContent);
          me.eventListenerForPopupWindow(this, htmlContent);
        }.bind(this), 300);
      }.bind(windowObject));
    },
    _blockActions: function(view) {
      CommandHelper.blockD2ViewActions(view);
    },
    _unblockActions: function(view) {
      CommandHelper.unblockD2ViewActions(view);
    },
    _refreshNode: function(node) {
      var widgetConfig = {};
      if (node.collection && node.collection.options) {
        widgetConfig.widgetType = node.collection.widgetType;
        widgetConfig.widgetName = node.collection.options.widgetName;
      }
      CommandHelper.refreshNode(node, widgetConfig);
    }
  });
  return CommandEditOnline;
});