/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/base", "smart/themes/theming", "dctmw/utils/authenticators/auth.storage", "dctmw/utils/authenticators/cookie.token.authenticator", "dctmw/utils/constants", "dctmw/utils/utils", "dctmw/utils/geolocation.utils", "dctmw/utils/client.location", "i18n!dctmw/utils/nls/lang" ], function(module, $, _, base, SmartTheming, authStorage, CookieTokenAuthenticator, constants, utils, GeolocationUtils, clientLocation, lang) {
  "use strict";
  var config = _.defaults({}, module.config(), {
    otdsCallbackPageUrl: "otds.html"
  }), OTDS_CALLBACK_PAGE_URL = config.otdsCallbackPageUrl;
  var CtOtdsTokenAuthenticator = CookieTokenAuthenticator.extend({
    doAuthenticate: function(options, succeeded, failed) {
      if (!options.credentials) {
        this.handleMissingCredentials();
        return true;
      }
      var me = this;
      var headers = GeolocationUtils.updateLocationDetails(utils.getAuthHeaders(options.credentials));
      headers["DOCUMENTUM-CUSTOM-UNAUTH-SCHEME"] = true;
      headers["X-SW-NO-CACHE"] = true;
      $.ajax({
        url: me.getAuthUrl(options),
        headers: headers,
        success: function(response, textStatus, xhr) {
          me.handleSuccess(options.credentials, succeeded, undefined, xhr);
        },
        error: function(response) {
          if (response.status === 401 && response.getResponseHeader("location")) {
            var otdsLocation = response.getResponseHeader("location") + `${SmartTheming.isJATOTheme() ? `&theme=jato-${SmartTheming.getTheme()}` : ""}&redirect_uri=` + encodeURIComponent(me._buildRedirectUrl(options));
            utils.openUrlInWindow(otdsLocation);
            return;
          }
          me.handleFailure(response, failed);
        }
      });
      return true;
    },
    postLogin: function() {
      var me = this, deferred = $.Deferred(), credentials = {}, headers, hashParams = me._getHashParams(), accessToken = hashParams["access_token"];
      this._paramsToCredentials(hashParams, credentials);
      if (credentials.repositoryName) {
        if (hashParams.loggedout) {
          delete hashParams.loggedout;
        }
        if (!accessToken) {
          return this.doAuthenticate({
            credentials: credentials
          }, function() {}, function(objError) {
            deferred.reject(objError);
          });
        } else {
          delete hashParams["access_token"];
        }
        headers = GeolocationUtils.updateLocationDetails(utils.getAuthHeaders(credentials));
        headers["authorization"] = "bearer " + accessToken;
        headers["DOCUMENTUM-CUSTOM-UNAUTH-SCHEME"] = true;
        $.ajax({
          url: me.getAuthUrl({
            credentials: credentials
          }),
          headers: headers,
          success: function(response, textStatus, xhr) {
            me.handleSuccess(credentials, undefined, undefined, xhr);
            if (hashParams.nextUrl) {
              delete hashParams.nextUrl;
            }
            hashParams = _.omit(hashParams, _.filter(_.keys(hashParams), function(k) {
              return k.startsWith(constants.SSO_PARAM_PREFIX);
            }));
            clientLocation.navigate({
              replace: true,
              trigger: true,
              hashParams: hashParams
            });
          },
          error: function(response) {
            var hdr = response.getResponseHeader && response.getResponseHeader("www-authenticate");
            if (response.status === 400 || response.status === 401 && hdr && hdr.indexOf("Basic") === 0) {
              hashParams[constants.SSO_AUTH_FAILURE_PARAM] = true;
              clientLocation.navigate(me.getSigninUrl(), {
                replace: true,
                trigger: true,
                hashParams: hashParams
              });
              return;
            }
            me.handleFailure(response);
            deferred.reject(response.status === 404 ? _.str.sformat(lang.InvalidRepositoryId, credentials.repositoryName) : response);
          }
        });
        return deferred.promise();
      }
      return true;
    },
    _buildRedirectUrl: function(options) {
      var hashParams = this._getHashParams(), appPageUrl = this.getAppPageUrl(), url, refUrl;
      if (hashParams.loggedout) {
        delete hashParams.loggedout;
      }
      if (hashParams.nextUrl) {
        appPageUrl = decodeURIComponent(hashParams.nextUrl);
        delete hashParams.nextUrl;
      }
      this._credentialsToParams(options.credentials, hashParams);
      appPageUrl = base.Url.appendQuery(appPageUrl, base.Url.combineQueryString(hashParams));
      refUrl = $("<a>").prop("href", appPageUrl).prop("href");
      url = $("<a>").prop("href", OTDS_CALLBACK_PAGE_URL).prop("href");
      url = base.Url.appendQuery(url, base.Url.combineQueryString({
        ref_uri: refUrl
      }));
      return url;
    }
  });
  return CtOtdsTokenAuthenticator;
});