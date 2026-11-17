/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "d2/controls/globalmessage/globalmessage", "csui/dialogs/modal.alert/modal.alert", "csui/models/command", "nuc/models/node/node.model", "csui/utils/commandhelper", "nuc/utils/url", "d2/utils/constants", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function($, GlobalMessage, ModalAlert, CommandModel, NodeModel, CommandHelper, Url, constants, utils, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-ExternalEsign",
      command_key: "D2-ExternalEsign",
      scope: "single"
    },
    LANGSTRING: Object.freeze({
      title: lang.ExternalEsignTitle,
      message: lang.ExternalEsignMessage,
      cancelBtn: lang.ExternalEsignCancelBtn,
      popupTitle: lang.ExternalEsignPopupTitle,
      popupWarning: lang.ExternalEsignPopupWarning,
      authError: lang.ExternalEsignAuthError,
      initiateEvent: "EXT_SIGN_OFF_INITIATE",
      cancelEvent: "EXT_SIGN_OFF_CANCEL"
    }),
    enabled: function(status, options) {
      var externalESignRequired = options.externalEsignOff ? true : false;
      return externalESignRequired;
    },
    execute: function(status, options) {
      var node = options.node;
      this.options = options;
      this.auditUrl = options.auditUrl;
      this.auditParams = options.auditParams;
      this.deferred = $.Deferred();
      this.login(node, options);
      return this.deferred.promise();
    },
    login: function(node, options) {
      var me = this;
      me.node = node;
      var baseUrl = options.externalEsignOff.url, redirUri = this.getOAuthRedirectUrl("oauth2-login-cb.html", options);
      this.authUrl = Url.appendQuery(baseUrl, Url.combineQueryString({
        redirect_uri: redirUri
      }));
      me._openWindow(node, me.authUrl).done(result => {
        me._externalWnd = result;
        if (!me._externalWnd) {
          ModalAlert.showWarning(function() {
            me.deferred.reject();
          }, me.LANGSTRING.popupWarning, me.LANGSTRING.popupTitle);
        } else {
          var wndChecker = function() {
            if (me.deferred.state() === "pending") {
              if (!me._externalWnd || me._externalWnd.closed) {
                window.removeEventListener("message", me._msgListener);
                me._modalMessage && me._modalMessage.close();
                me._triggerAuditEvents(node, me.LANGSTRING.cancelEvent);
                me.deferred.reject();
              } else {
                setTimeout(wndChecker, 250);
              }
            }
          };
          setTimeout(wndChecker, 250);
          me._attachMessageListener(function() {
            GlobalMessage.showMessage("error", me.LANGSTRING.authError);
          });
          me._modalMessage = ModalAlert.showInformation(function() {
            window.removeEventListener("message", me._msgListener);
            if (!me._externalWnd || !me._externalWnd.closed) {
              me._externalWnd && me._externalWnd.close();
              me._triggerAuditEvents(node, me.LANGSTRING.cancelEvent);
              me.deferred.reject();
            }
          }, me.LANGSTRING.message, me.LANGSTRING.title, {
            buttons: {
              showYes: false,
              showNo: false,
              showCancel: true,
              labelCancel: me.LANGSTRING.cancelBtn
            }
          });
        }
      }).fail(() => {
        me.deferred.reject();
      });
    },
    getOAuthRedirectUrl: function(redirUri) {
      return $("<a>").prop("href", redirUri).prop("href");
    },
    _openWindow: function(node, url) {
      var dfd = $.Deferred();
      var height = Math.min(Math.max(window.outerHeight - 200, 500), 800), width = Math.min(Math.max(window.outerWidth - 150, 700), 1e3);
      this._triggerAuditEvents(node, this.LANGSTRING.initiateEvent).done(() => {
        dfd.resolve(window.open(url, "d2_oauth_login_dialog", "scrollbars=yes,resizable=yes" + ",height=" + height + ",width=" + width + ",top=" + (window.screenTop + (window.outerHeight - height) / 2) + ",left=" + (window.screenLeft + (window.outerWidth - width) / 2)));
      }).fail(() => {
        dfd.reject();
      });
      return dfd.promise();
    },
    _attachMessageListener: function(errCb) {
      var me = this;
      me._msgListener = function(e) {
        window.removeEventListener("message", me._msgListener);
        me._externalWnd && me._externalWnd.close();
        me._modalMessage && me._modalMessage.close();
        var data = e.message || e.data, jsonData = data && JSON.parse(data);
        if (jsonData && jsonData.id_token) {
          me.deferred.resolve(jsonData.id_token);
        } else {
          jsonData = jsonData || {};
          if (jsonData.error_description && jsonData.error_description === "User+cancelled") {
            me._triggerAuditEvents(me.node, me.LANGSTRING.cancelEvent);
            me.deferred.reject();
          } else {
            errCb(jsonData.error, jsonData.error_description);
          }
        }
      };
      window.addEventListener("message", me._msgListener, false);
    },
    _triggerAuditEvents: function(node, auditEvent) {
      var deferred = $.Deferred(), url = this.auditUrl;
      if (!url) {
        return;
      }
      url = Url.appendQuery(url, Url.combineQueryString(this.auditParams));
      url = Url.appendQuery(url, Url.combineQueryString({
        "audit-action": auditEvent
      }));
      var ajaxOptions = node.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        contentType: constants.MediaTypes.DCTM_JSON,
        success: function() {
          deferred.resolve();
        }
      });
      var connectorError = ajaxOptions.error;
      ajaxOptions.error = function(xhr, message, statusText) {
        if (xhr.responseJSON && xhr.responseJSON.status === 401 && xhr.responseJSON.code !== "E_INVALID_AUTHENTICATION") {
          connectorError.apply(this, arguments);
        } else {
          GlobalMessage.showMessage("error", utils.parseAjaxErrorAsString(xhr, statusText, message));
        }
        deferred.reject(xhr.responseJSON);
      };
      $.ajax(ajaxOptions);
      return deferred.promise();
    }
  });
});