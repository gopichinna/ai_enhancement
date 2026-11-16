/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/underscore", "csui/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "csui/utils/url", "i18n!csui/utils/commands/nls/localized.strings", "csui/utils/commands/open.classic.page", "csui/utils/classic.nodes/classic.nodes" ], function(module, require, _, $, CommandModel, CommandHelper, Url, lang, OpenClassicPageCommand, ClassicNodes) {
  "use strict";
  var ConnectorFactory, NodeModelFactory;
  var config = _.extend({
    enabled: true
  }, module.config());
  var SwitchToClassicCommand = CommandModel.extend({
    defaults: {
      signature: "SwitchToNonProxyUser",
      name: lang.SwitchToClassicCommandName
    },
    enabled: function(status, options) {
      return config.enabled;
    },
    execute: function(status, options) {
      var deferred = $.Deferred(), context = status.context || options && options.context, self = this;
      require([ "csui/utils/contexts/factories/connector", "csui/utils/contexts/factories/node" ], function() {
        ConnectorFactory = arguments[0];
        NodeModelFactory = arguments[1];
        var connector = context.getObject(ConnectorFactory);
        self._revertProxyToken(status, connector).then(function(token) {
          connector.authenticator.updateAuthenticatedSession({
            ticket: token
          });
          connector.makeAjaxCall({
            url: self._getUrl(connector),
            xhrFields: {
              withCredentials: true
            }
          }).then(function() {
            window.location.reload();
          }, deferred.reject);
        }, deferred.reject);
      });
      return deferred.promise();
    },
    _getUrl: function(connector) {
      var cgiUrl = new Url(connector.connection.url).getCgiScript();
      return cgiUrl + "/xecmauth";
    },
    _revertProxyToken: function(options, connector) {
      var deferred = $.Deferred(), url = connector.getConnectionUrl().getApiBase("v2") + "members/proxies/auth/revert";
      var getOptions = {
        url: url,
        method: "POST",
        data: {
          token: connector.connection.session.ticket
        }
      };
      connector.makeAjaxCall(getOptions).then(function(response) {
        deferred.resolve(response.results.token);
      }, deferred.reject);
      return deferred.promise();
    }
  });
  return SwitchToClassicCommand;
});