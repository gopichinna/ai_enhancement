/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "dctmw/utils/authenticators/ct.otds.token.authenticator", "dctmw/utils/constants", "dctmw/utils/utils", "dctmw/utils/client.location", "i18n!dctmw/utils/nls/lang" ], function($, _, CookieOtdsTokenAuthenticator, constants, utils, clientLocation, lang) {
  "use strict";
  var CtOtdsTicketAuthenticator = CookieOtdsTokenAuthenticator.extend({
    postLogin: function() {
      var me = this, deferred = $.Deferred(), credentials = {}, headers, params = me._getQueryParams(), hashParams = me._getHashParams();
      if (hashParams.otdsticket) {
        credentials.repositoryName = params[constants.UrlParams.REPOSITORY];
        credentials.application = params[constants.UrlParams.APPLICATION];
        credentials.networkLocation = params[constants.UrlParams.NETWORK_LOCATION];
        var hashCredentials = {};
        this._paramsToCredentials(hashParams, hashCredentials);
        credentials = _.defaults(credentials, hashCredentials, {
          repositoryName: "",
          application: "",
          networkLocation: ""
        });
        if (credentials.repositoryName) {
          headers = utils.getAuthHeaders(credentials);
          headers[constants.Headers.OTDS_TKT_HEADER] = hashParams.otdsticket;
          headers["X-SW-NO-CACHE"] = true;
          $.ajax({
            url: me.getAuthUrl({
              credentials: credentials
            }),
            headers: headers,
            success: function(response, textStatus, xhr) {
              me.handleSuccess(credentials, undefined, undefined, xhr);
              deferred.resolve();
            },
            error: function(response) {
              if (response.status === 400) {
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
      } else {
        return CookieOtdsTokenAuthenticator.prototype.postLogin.call(this);
      }
      return true;
    }
  });
  return CtOtdsTicketAuthenticator;
});