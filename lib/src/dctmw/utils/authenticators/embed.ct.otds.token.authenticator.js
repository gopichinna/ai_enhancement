/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/jquery.parse.param", "nuc/utils/base", "dctmw/utils/authenticators/ct.otds.token.authenticator", "dctmw/utils/constants", "dctmw/utils/utils", "dctmw/utils/client.location", "i18n!dctmw/utils/nls/lang" ], function($, _, parseParam, base, CookieOtdsTokenAuthenticator, constants, utils, clientLocation, lang) {
  "use strict";
  var EmbedCtOtdsTicketAuthenticator = CookieOtdsTokenAuthenticator.extend({
    postLogin: function() {
      var me = this, deferred = $.Deferred(), credentials = {}, headers, params = me._getQueryParams(), hashParams = me._getHashParams();
      if (hashParams.access_token) {
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
          headers["authorization"] = "bearer " + hashParams.access_token;
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
              var error = response;
              if (response && response.status) {
                switch (response.status) {
                 case 400:
                 case 401:
                  error = lang.authenticationError;
                  break;

                 case 404:
                  error = _.str.sformat(lang.InvalidRepositoryId, credentials.repositoryName);
                  break;
                }
              }
              if (params["redirect"] === "false") {
                me.handleFailure(response);
                deferred.reject(error);
              } else {
                return true;
              }
            }
          });
          return deferred.promise();
        } else {
          if (params["redirect"] === "false") {
            deferred.reject(lang.authenticationError);
            return deferred.promise();
          }
        }
      } else {
        if (params["redirect"] === "false") {
          deferred.reject(lang.authenticationError);
          return deferred.promise();
        }
      }
      return true;
    }
  });
  return EmbedCtOtdsTicketAuthenticator;
});