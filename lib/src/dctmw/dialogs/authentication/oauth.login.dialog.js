/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "smart/controls/globalmessage/globalmessage", "smart/dialogs/modal.alert/modal.alert", "i18n!dctmw/dialogs/authentication/impl/nls/lang" ], function($, _, Url, GlobalMessage, ModalAlert, lang) {
  "use strict";
  var OAuthLoginDialog = function OAuthLoginDialog(options) {
    options = options || {};
    if (!options.url) {
      throw Error("url option is mandatory for the OAuth login dialog.");
    }
    this.baseUrl = options.url;
    var redirUri = "oauth2-login-cb.html", stateArr = new Uint8Array(16), state = "";
    this.strings = options.strings || {};
    _.defaults(this.strings, {
      title: lang.OAuthLoginDialogTitle,
      message: lang.OAuthLoginDialogMessage,
      cancelBtn: lang.OAuthLoginDialogCancelBtn,
      popupTitle: lang.OAuthLoginDialogPopupTitle,
      popupWarning: lang.OAuthLoginDialogPopupWarning,
      authError: lang.OAuthLoginDialogAuthError,
      authUrlErrorTitle: lang.OAuthLoginDialogAuthError,
      authUrlErrorMessage: lang.OAuthLoginUrlNotReachable,
      authUrlErrorCancelBtn: lang.CoreLoginDialogCloseBtn
    });
    (window.crypto || window.msCrypto).getRandomValues(stateArr);
    for (var i = 0; i < stateArr.byteLength; i++) {
      state += String.fromCharCode(stateArr[i]);
    }
    state = btoa(state);
    this.state = state;
    this.authUrl = Url.appendQuery(this.baseUrl, Url.combineQueryString({
      response_type: "token",
      client_id: options.clientId,
      redirect_uri: $("<a>").prop("href", redirUri).prop("href"),
      state: state
    }));
  };
  _.extend(OAuthLoginDialog.prototype, {
    login: function() {
      var me = this;
      me.deferred = $.Deferred();
      me.checkAuthUrlReachable().done(function() {
        me._checkOAuthLogin().fail(function() {
          me._externalWnd = me._openWindow(me.authUrl);
          if (!me._externalWnd) {
            ModalAlert.showWarning(function() {
              me.deferred.reject();
            }, me.strings.popupWarning, me.strings.popupTitle);
          } else {
            var wndChecker = function() {
              if (me.deferred.state() === "pending") {
                if (!me._externalWnd || me._externalWnd.closed) {
                  window.removeEventListener("message", me._msgListener);
                  me._modalMessage && me._modalMessage.close();
                  me.deferred.reject();
                } else {
                  setTimeout(wndChecker, 250);
                }
              }
            };
            setTimeout(wndChecker, 250);
            me._attachMessageListener(function() {
              GlobalMessage.showMessage("error", me.strings.authError);
            });
            me._modalMessage = ModalAlert.showInformation(function() {
              window.removeEventListener("message", me._msgListener);
              me._externalWnd && me._externalWnd.close();
              me.deferred.reject();
            }, me.strings.message, me.strings.title, {
              buttons: {
                showYes: false,
                showNo: false,
                showCancel: true,
                labelCancel: me.strings.cancelBtn
              }
            });
          }
        });
      }).fail(function() {
        me._modalMessage = ModalAlert.showError(function() {
          window.removeEventListener("message", me._msgListener);
          me._externalWnd && me._externalWnd.close();
          me.deferred.reject(me.strings.authUrlErrorMessage);
        }, me.strings.authUrlErrorMessage, me.strings.authUrlErrorTitle, {
          buttons: {
            showYes: false,
            showNo: false,
            showCancel: true,
            labelCancel: me.strings.authUrlErrorCancelBtn
          }
        });
      });
      return me.deferred.promise();
    },
    _checkOAuthLogin: function() {
      var deferred = $.Deferred(), offScrFrame = $('<iframe id="dctm_oauth_login_check">').css({
        position: "absolute",
        width: "1px",
        height: "1px",
        left: "-1px"
      }).attr("src", this.authUrl + "&prompt=none");
      this._attachMessageListener(deferred.reject);
      $("body").append(offScrFrame);
      return deferred.promise();
    },
    _attachMessageListener: function(errCb) {
      var me = this;
      me._msgListener = function(e) {
        window.removeEventListener("message", me._msgListener);
        $("#dctm_oauth_login_check").remove();
        me._externalWnd && me._externalWnd.close();
        me._modalMessage && me._modalMessage.close();
        var data = e.message || e.data, jsonData = data && JSON.parse(data);
        if (jsonData && jsonData.access_token) {
          if (me.state && me.state !== decodeURIComponent(jsonData.state)) {
            me.deferred.reject("Invalid OAuth2 state");
          } else {
            delete me.state;
            me.deferred.resolve(jsonData.access_token, jsonData.expires_in ? parseInt(jsonData.expires_in) : null);
          }
        } else {
          jsonData = jsonData || {};
          errCb(jsonData.error, jsonData.error_description);
        }
      };
      window.addEventListener("message", me._msgListener, false);
    },
    _openWindow: function(url) {
      var height = Math.min(Math.max(window.outerHeight - 200, 500), 800), width = Math.min(Math.max(window.outerWidth - 150, 700), 1e3);
      return window.open(url, "dctm_oauth_login_dialog", "scrollbars=yes,resizable=yes" + ",height=" + height + ",width=" + width + ",top=" + (window.screenTop + (window.outerHeight - height) / 2) + ",left=" + (window.screenLeft + (window.outerWidth - width) / 2));
    },
    checkAuthUrlReachable: function() {
      var me = this;
      return $.ajax({
        url: me.baseUrl
      });
    }
  });
  return OAuthLoginDialog;
});