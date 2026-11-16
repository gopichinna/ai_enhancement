/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/underscore", "csui/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "i18n!csui/utils/commands/nls/localized.strings" ], function(module, require, _, $, CommandModel, CommandHelper, lang) {
  "use strict";
  var ConnectorFactory, NodeModelFactory;
  var config = _.extend({
    enabled: true
  }, module.config());
  var SwitchToClassicCommand = CommandModel.extend({
    defaults: {
      signature: "SwitchToNonCMUser",
      name: lang.SwitchCMUserCommandName
    },
    enabled: function(status, options) {
      return config.enabled;
    },
    execute: function(status, options) {
      let deferred = $.Deferred(), context = status.context || options && options.context, self = this;
      require([ "csui/utils/contexts/factories/connector" ], function(ConnectorFactory) {
        const connector = context.getObject(ConnectorFactory);
        self._disableContentManager(connector).then(function() {
          window.location.reload();
        }, deferred.reject);
      });
      return deferred.promise();
    },
    _getUrl: function(connector) {
      let url = connector.getConnectionUrl().getApiBase("v2");
      if (url) {
        url += "members/preferences";
      }
      return url;
    },
    _disableContentManager: function(connector) {
      let deferred = $.Deferred();
      let options = {
        url: this._getUrl(connector),
        method: "PUT",
        data: {
          General: {
            enableCMMode: false
          }
        }
      };
      connector.makeAjaxCall(options).then(deferred.resolve, deferred.reject);
      return deferred.promise();
    }
  });
  return SwitchToClassicCommand;
});