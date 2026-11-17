/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/models/command", "smart/themes/theming", "csui/utils/commonconfig.util", "csui/utils/contexts/factories/connector", "css!smart/controls/app.header/panel/groups/impl/smart.theme.groups" ], function(module, $, CommandModel, theming, CommonConfigUtil, ConnectorFactory) {
  "use strict";
  let config = module.config();
  Object.assign(config, {
    enableSwitchToJato: CommonConfigUtil.enableFeatureInSmartView() || false,
    enableJatoTheme: config.enableJatoTheme ?? false
  });
  const applyStyling = (method, className, timeOut) => {
    setTimeout(function() {
      document.body.classList[method](className);
    }, timeOut);
  };
  const SwitchToSmartview = CommandModel.extend({
    defaults: {
      signature: "SwitchToSmartview"
    },
    enabled: function(status, options) {
      return this.canSwitchToJatoTheme() && theming.isJATOTheme();
    },
    canSwitchToJatoTheme: function() {
      return config.enableSwitchToJato && config.enableJatoTheme;
    },
    execute: function(status, options) {
      const deferred = $.Deferred();
      const newTheme = status.toolItem.get("theme");
      const connector = status.context.getObject(ConnectorFactory);
      this._updateNewTheme(newTheme, connector).then(() => {
        this.loadNewTheme(status, newTheme);
        deferred.resolve();
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    loadNewTheme: function(status, newTheme) {
      let currentTheme = theming.getTheme();
      const isSwitchBetweenJatoAndNonJato = currentTheme === "cf" || newTheme === "cf";
      const clsName = isSwitchBetweenJatoAndNonJato ? "smart-fade-out-and-in-long-time" : "smart-fade-out-and-in";
      applyStyling("add", clsName, 0);
      setTimeout(function() {
        if (newTheme === "jato") {
          newTheme = document.documentElement.dataset.jatoTheme ?? "light";
        }
        theming.saveTheme(newTheme);
        theming.applyTheme();
        status.context?.brandingConfigData?.trigger("change:theme");
        status.context?.navigationHeaderView?.render();
        status.context?.trigger("reload:perspective");
      }, 500);
      applyStyling("remove", clsName, 2500);
    },
    _getUrl: function(connector) {
      let url = connector.getConnectionUrl().getApiBase("v2");
      if (url) {
        url += "members/preferences";
      }
      return url;
    },
    _updateNewTheme: function(newTheme, connector) {
      const options = {
        url: this._getUrl(connector),
        method: "PUT",
        data: {
          SmartUI: {
            theme: newTheme
          }
        }
      };
      return connector.makeAjaxCall(options);
    }
  });
  return SwitchToSmartview;
});