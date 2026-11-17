/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "nuc/utils/base", "dctmw/utils/authenticators/cookie.token.authenticator", "dctmw/lib/base64", "dctmw/utils/constants", "dctmw/utils/utils", "dctmw/utils/geolocation.utils", "i18n!dctmw/utils/nls/lang" ], function(_, $, Url, base, CookieTokenAuthenticator, base64, constants, utils, GeolocationUtils, lang) {
  "use strict";
  return CookieTokenAuthenticator.extend({
    postLogin: function() {
      var me = this, dctmTicketAuthParam = "dctm-ticket-auth", deferred = $.Deferred(), credentials = {}, headers, params = me._getQueryParams(), origHash = window.location.hash;
      if (params[constants.UrlParams.REPOSITORY] && params[constants.UrlParams.USERNAME] && params[constants.UrlParams.PASSWORD]) {
        credentials.username = params[constants.UrlParams.USERNAME];
        credentials.password = params[constants.UrlParams.PASSWORD];
        credentials.repositoryName = params[constants.UrlParams.REPOSITORY];
        credentials.application = params[constants.UrlParams.APPLICATION] || "";
        credentials.networkLocation = params[constants.UrlParams.NETWORK_LOCATION] || "";
        headers = GeolocationUtils.updateLocationDetails(utils.getAuthHeaders(credentials));
        headers["DOCUMENTUM-CUSTOM-UNAUTH-SCHEME"] = true;
        headers["X-SW-NO-CACHE"] = true;
        var url = me.getAuthUrl({
          credentials: credentials
        }), queryParamMap = {};
        queryParamMap[dctmTicketAuthParam] = me.getEncodedUserCredentials(credentials);
        url = Url.appendQuery(url, Url.combineQueryString(queryParamMap));
        delete credentials.password;
        $.ajax({
          url: url,
          headers: headers,
          success: function(response, textStatus, xhr) {
            me.handleSuccess(credentials, undefined, undefined, xhr);
            if (params["redirect"] !== "false") {
              _.each(constants.UrlParams, function(UrlParam) {
                if (params[UrlParam]) {
                  delete params[UrlParam];
                }
              });
              utils.openUrlInWindow(base.Url.appendQuery(window.location.pathname, base.Url.combineQueryString(params)) + origHash);
              return;
            }
            deferred.resolve();
          },
          error: function(response) {
            var error = response;
            switch (response.status) {
             case 401:
              if (params["redirect"] !== "false") {
                delete params[constants.UrlParams.USERNAME];
                delete params[constants.UrlParams.PASSWORD];
                var hashParams = {
                  nextUrl: encodeURIComponent(origHash)
                };
                utils.openUrlInWindow(base.Url.appendQuery(window.location.pathname, base.Url.combineQueryString(params)) + base.Url.appendQuery(me.getSigninUrl(), base.Url.combineQueryString(hashParams)));
                return;
              }
              error = lang.authenticationError;
              break;

             case 404:
              error = _.str.sformat(lang.InvalidRepositoryId, credentials.repositoryName);
              break;
            }
            me.handleFailure(response);
            deferred.reject(error);
          }
        });
        return deferred.promise();
      }
      return true;
    },
    doAuthenticate: function(options, succeeded, failed) {
      if (!options.credentials) {
        this.handleMissingCredentials();
        return true;
      }
      var me = this, authHeader = me.formatAuthorizationHeader(options.credentials);
      delete options.credentials.password;
      var headers = GeolocationUtils.updateLocationDetails(utils.getAuthHeaders(options.credentials));
      headers["authorization"] = authHeader;
      headers["DOCUMENTUM-CUSTOM-UNAUTH-SCHEME"] = true;
      $.ajax({
        url: me.getAuthUrl(options),
        headers: headers,
        success: function(response, textStatus, xhr) {
          me.handleSuccess(options.credentials, succeeded, undefined, xhr);
        },
        error: function(request) {
          me.handleFailure(request, failed);
        }
      });
      return true;
    },
    isExternalSignin: function() {
      return false;
    },
    updateAuthHeaders: function(headers) {
      headers["DOCUMENTUM-CUSTOM-UNAUTH-SCHEME"] = true;
      CookieTokenAuthenticator.prototype.updateAuthHeaders.apply(this, arguments);
    },
    formatAuthorizationHeader: function(credentials) {
      return "Basic " + this.getEncodedUserCredentials(credentials);
    },
    getEncodedUserCredentials: function(credentials) {
      return base64.strToBase64(credentials.username + ":" + credentials.password);
    }
  });
});