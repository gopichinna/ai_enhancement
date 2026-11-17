/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/url", "smart/themes/theming", "dctmw/utils/rest.resources", "dctmw/utils/rest.linkrels", "dctmw/utils/utils", "dctmw/utils/constants", "dctmw/utils/client.location", "i18n!csui/utils/commands/nls/localized.strings" ], function(require, _, $, Backbone, Url, SmartTheming, RestResources, RestLinkrels, utils, constants, clientLocation, lang) {
  "use strict";
  var ConnectorFactory;
  return Backbone.Model.extend({
    idAttribute: "signature",
    defaults: {
      signature: "SignOut",
      command_key: "SignOut",
      name: lang.SignOutCommandName
    },
    getCommandKey: function() {
      var commandKey = this.get("command_key");
      return commandKey ? Array.isArray(commandKey) ? commandKey : [ commandKey ] : [];
    },
    enabled: function() {
      return true;
    },
    execute: function(status, options) {
      var deferred = $.Deferred(), context = status.context || options && options.context, licenseFailed = status.licenseFailed, self = this;
      require([ "csui/utils/contexts/factories/connector", "csui/pages/start/impl/perspective.router" ], function() {
        ConnectorFactory = arguments[0];
        self._signOut(context, licenseFailed).done(deferred.resolve).fail(deferred.reject);
      }, deferred.reject);
      return deferred.promise();
    },
    _signOut: function(context, licenseFailed) {
      var connector = context.getObject(ConnectorFactory), skippedSSO = clientLocation.getQueryParams()["skipsso"] === "true";
      if (licenseFailed === true) {
        var otdsLogoutUrl = this.getOtdsLogoutUrl(), signInPageUrl = connector.authenticator.getSigninUrl(), hashParams = {};
        hashParams["nextUrl"] = encodeURIComponent(location.hash);
        hashParams[constants.AppUrlParams.LOGGED_OUT] = "true";
        var redirectUrl = location.origin + location.pathname + location.search + Url.appendQuery(signInPageUrl, Url.combineQueryString(hashParams["nextUrl"]));
        redirectUrl = otdsLogoutUrl + "&redirect_uri=" + encodeURIComponent(redirectUrl);
        utils.openUrlInWindow(redirectUrl);
      } else {
        let url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.LOGOFF);
        if (!url) {
          url = Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF), "logout");
        }
        return $.ajax(connector.extendAjaxOptions({
          url: url
        })).done(function() {
          connector.authenticator.unauthenticate({
            reason: "logged-out"
          });
          utils.getLocalStore(constants.StorageKey.MOBILE).destroy();
          var redirectUrl = this.getRedirectUrl(connector);
          var otdsLogoutUrl = this.getOtdsLogoutUrl();
          if (otdsLogoutUrl && !skippedSSO) {
            redirectUrl = otdsLogoutUrl + "&redirect_uri=" + encodeURIComponent(redirectUrl);
          }
          utils.openUrlInWindow(redirectUrl);
        }.bind(this));
      }
    },
    getRedirectUrl: function(connector) {
      var redirectUrl = RestResources.getD2Options().logout_redirect_url;
      if (redirectUrl) {
        return redirectUrl;
      }
      var signInPageUrl = connector.authenticator.getSigninUrl(), hashParams = {};
      hashParams["nextUrl"] = encodeURIComponent(location.hash);
      hashParams[constants.AppUrlParams.LOGGED_OUT] = "true";
      return location.origin + location.pathname + location.search + Url.appendQuery(signInPageUrl, Url.combineQueryString(hashParams));
    },
    getOtdsLogoutUrl: function() {
      let otdsLogoutUrl = RestResources.getProductInfo().get("otds-logout");
      if (!otdsLogoutUrl) {
        otdsLogoutUrl = RestResources.getProductInfo().get("otds_logout_url");
      }
      if (!otdsLogoutUrl) {
        otdsLogoutUrl = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.OTDS_LOGOUT);
      }
      return otdsLogoutUrl ? `${otdsLogoutUrl}${SmartTheming.isJATOTheme() ? `&theme=jato-${SmartTheming.getTheme()}` : ""}` : otdsLogoutUrl;
    }
  });
});