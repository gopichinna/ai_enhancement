/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/base", "nuc/utils/authenticators/authenticator", "dctmw/utils/authenticators/auth.storage", "dctmw/utils/constants", "dctmw/utils/geolocation.utils", "dctmw/utils/repository.utils", "nuc/lib/jquery.parse.param" ], function(module, require, $, _, base, Authenticator, authStorage, constants, GeoLocationUtils, repoUtil) {
  "use strict";
  var config = _.defaults(module.config(), {
    applicationPageUrl: "#signout",
    signinPageUrl: "#signin"
  });
  let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return Authenticator.extend({
    constructor: function BaseAuthenticator() {
      Authenticator.prototype.constructor.apply(this, arguments);
    },
    getAuthUrl: function(options) {
      return base.Url.combine(this.connection.url, "repositories/" + options.credentials.repositoryName);
    },
    getAppPageUrl: function() {
      return config.applicationPageUrl;
    },
    getSigninUrl: function() {
      return config.signinPageUrl;
    },
    setTimezone: function(tz) {
      timezone = tz;
    },
    handleSuccess: function(credentials, succeeded, eventData, xhr) {
      var authData = authStorage.getCurrTabData();
      authData[constants.AuthStorage.REPOSITORY] = credentials.repositoryName;
      authData[constants.AuthStorage.APPLICATION] = repoUtil.getMatchingApplicationParameter(credentials.application, false, null, credentials.repositoryName);
      authData[constants.AuthStorage.NETWORK_LOCATION] = credentials.networkLocation;
      authStorage.setCurrTabData(authData);
      authStorage.removeAuthRepoData(credentials.repositoryName);
      this.connection.credentials = _.extend({}, this.connection.credentials, credentials, _.pick(authData, constants.AuthStorage.APPLICATION));
      if (succeeded) {
        succeeded(this.connection);
      }
      this.trigger("loggedIn", {
        sender: this,
        data: eventData,
        connection: this.connection,
        xhr: xhr
      });
    },
    handleFailure: function(request, failed) {
      var error = new base.RequestErrorMessage(request);
      if (failed) {
        failed(error, this.connection);
      }
    },
    isAuthenticated: function() {
      var DELIM = "~", authData = authStorage.getCurrTabData();
      if (this._isAppPage() && (!authData || !authData[constants.AuthStorage.REPOSITORY])) {
        var allTabData = authStorage.getAllTabsData(), allData = _.uniq(_.compact(_.map(allTabData, function(innerData) {
          if (!innerData[constants.AuthStorage.REPOSITORY]) {
            return undefined;
          }
          return (innerData[constants.AuthStorage.REPOSITORY] || "") + DELIM + (innerData[constants.AuthStorage.APPLICATION] || "") + DELIM + (innerData[constants.AuthStorage.NETWORK_LOCATION] || "");
        })));
        if (_.size(allData) === 1) {
          for (var tabId in allTabData) {
            if (Object.prototype.hasOwnProperty.call(allTabData, tabId) && allTabData[tabId][constants.AuthStorage.REPOSITORY]) {
              authStorage.setCurrTabData(allTabData[tabId]);
              break;
            }
          }
        }
      }
      if (this._isAppPage()) {
        authData = authStorage.getCurrTabData();
        var modified = false, queryParams = $.parseParams(window.location.search), repo = queryParams[constants.UrlParams.REPOSITORY], application = repoUtil.getMatchingApplicationParameter(queryParams[constants.UrlParams.APPLICATION], false, null, repo), networkLocation = queryParams[constants.UrlParams.NETWORK_LOCATION];
        application = application || queryParams[constants.UrlParams.APPLICATION];
        if (_.isString(repo) && !_.isEmpty(repo) && authData[constants.AuthStorage.REPOSITORY] !== repo) {
          authData[constants.AuthStorage.REPOSITORY] = repo;
          modified = true;
        }
        if (_.isString(application) && !_.isEmpty(application) && authData[constants.AuthStorage.APPLICATION] !== application) {
          authData[constants.AuthStorage.APPLICATION] = application;
          modified = true;
        }
        if (_.isString(networkLocation) && !_.isEmpty(networkLocation) && authData[constants.AuthStorage.NETWORK_LOCATION] !== networkLocation) {
          authData[constants.AuthStorage.NETWORK_LOCATION] = networkLocation;
          modified = true;
        }
        if (modified) {
          authStorage.setCurrTabData(authData);
        }
      }
      return this.checkAuthenticated();
    },
    unauthenticate: function(options) {
      authStorage.removeCurrTabData();
      this.connection.credentials = undefined;
      this.trigger("loggedOut", {
        sender: this,
        connection: this.connection,
        reason: options && options.reason
      });
      require([ "csui/utils/user.session/user.session" ], function(UserSession) {
        if (UserSession.isSessionExpirationEnabled()) {
          UserSession.clearExpirationTimer();
        }
      });
      return this;
    },
    setAuthenticationHeaders: function(headers) {
      var currentApplication = authStorage.getCurrTabData()[constants.AuthStorage.APPLICATION];
      if (currentApplication) {
        headers[constants.Headers.APPLICATION] = currentApplication;
      }
      var currentLocation = authStorage.getCurrTabData()[constants.AuthStorage.NETWORK_LOCATION];
      if (currentLocation) {
        headers[constants.Headers.NETWORK_LOCATION] = currentLocation;
      }
      var currentgeoLocation = authStorage.getCurrTabData()[constants.AuthStorage.CLIENT_LOCATION];
      if (currentgeoLocation) {
        headers[constants.Headers.CLIENT_LOCATION] = currentgeoLocation;
      }
      var currentClientApplication = authStorage.getCurrTabData()[constants.AuthStorage.CLIENT_APPLICATION];
      if (currentClientApplication) {
        headers[constants.Headers.CLIENT_APPLICATION] = currentClientApplication;
      }
      headers[constants.Headers.TIME_ZONE] = timezone;
      if (window.sv.config.mobile) {
        headers[constants.Headers.CLIENT_APPLICATION] = constants.ApplicationName.MOBILE;
      }
      headers[constants.Headers.CLIENT_TYPE] = window.sv.config.mobile ? constants.ClientTypes.MOBILE : constants.ClientTypes.DESKTOP;
      this.updateAuthHeaders(headers);
    },
    handleMissingCredentials: function() {
      var me = this;
      require([ "csui/dialogs/modal.alert/modal.alert", "i18n!dctmw/utils/authenticators/impl/nls/lang" ], function(alertDialog, lang) {
        alertDialog.showWarning(lang.AuthenticationFailureDialogText, lang.SessionExpiredDialogTitle, {
          buttons: alertDialog.buttons.Ok
        }).always(function() {
          me.unauthenticate({
            reason: "failed"
          });
        });
      });
    },
    checkAuthenticated: function() {
      return false;
    },
    isExternalSignin: function() {
      return true;
    },
    supportsBasicFallback: function() {
      return false;
    },
    updateAuthHeaders: function() {},
    _isAppPage: function() {
      return window.location.pathname.indexOf("/" + config.signinPageUrl) < 0;
    }
  });
});