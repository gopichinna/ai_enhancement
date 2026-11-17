/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import OAuthLoginDialog from "dctmw/dialogs/authentication/oauth.login.dialog";

import clientLocation from "dctmw/utils/client.location";

import Session from "dctmw/utils/authenticators/session";

let authStore = [ {
  accessToken: null,
  accessTokenExpiry: null
} ];

const authTokenExpiredTime = 600;

let AuthenticationUtils = {
  getAccessToken: function(connector, otdsUrl, otdsClientId, appName) {
    var deffered = $.Deferred(), me = this, appContext = Session.get().getContext();
    const params = clientLocation.getHashParams();
    if (this._getAccessToken()) {
      return deffered.resolve(this._getAccessToken()).promise();
    }
    if (appContext && appContext.isEmbeddedMode && params && !_.isEmpty(params["access_token"])) {
      return deffered.resolve(params["access_token"]).promise();
    }
    this.validateLoginAndGetToken(connector, otdsUrl, otdsClientId, appName).done(function(accessToken, expiresIn) {
      me._setAccessToken(accessToken, expiresIn);
      deffered.resolve(me._getAccessToken());
    }).fail(function(error) {
      deffered.reject(error);
    });
    return deffered.promise();
  },
  validateLoginAndGetToken: function(connector, otdsUrl, otdsClientId, appName, authUrlErrorText) {
    var authUrl = otdsUrl + "/otdsws/login";
    var dialog = new OAuthLoginDialog({
      connector: connector,
      url: authUrl,
      clientId: otdsClientId,
      appName: appName,
      strings: {
        authUrlErrorTitle: authUrlErrorText
      }
    });
    return dialog.login().then(function(accessToken, expiresIn) {
      return $.Deferred().resolve(accessToken, expiresIn).promise();
    }).catch(function(msg) {
      return $.Deferred().reject(msg).promise();
    });
  },
  _getAccessToken: function() {
    var token = authStore.accessToken, expiry = authStore.accessTokenExpiry;
    if (token && expiry && new Date().getTime() < expiry - 3e5) {
      return token;
    } else {
      delete authStore.accessToken;
      delete authStore.accessTokenExpiry;
    }
    return false;
  },
  _setAccessToken: function(accessToken, expiresIn) {
    if (!expiresIn) {
      expiresIn = authTokenExpiredTime;
    }
    authStore.accessToken = accessToken;
    authStore.accessTokenExpiry = new Date().getTime() + expiresIn * 1e3;
  }
};

export default AuthenticationUtils;