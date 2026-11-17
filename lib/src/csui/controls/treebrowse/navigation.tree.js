/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/backbone", "csui-ext!csui/controls/treebrowse/navigation.tree" ], function(module, Backbone, moduleConfigs) {
  "use strict";
  var config = module.config(), enableSystemLevel = !!config.enable;
  moduleConfigs = moduleConfigs || [];
  var configModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      enabled: function(status, options) {
        return false;
      },
      data: function(status, options) {
        return {};
      }
    }
  }), configCollection = Backbone.Collection.extend({
    model: configModel,
    comparator: "sequence"
  });
  var NavigationTree = {
    enabled: function(status, options) {
      if (!!enableSystemLevel) {
        return true;
      }
      var enabled = false, moduleConfigCollection = new configCollection(moduleConfigs);
      moduleConfigCollection.some(function(mConfig) {
        enabled = mConfig.get("enabled")(status, options);
        if (enabled) {
          status.originatingView.treeData = mConfig.get("data")(status, options);
        } else if (status?.originatingView?.removeTreeData) {
          status.originatingView.removeTreeData();
        }
        enabled = enabled ? true : enabled;
        return enabled;
      });
      return enabled;
    }
  };
  return NavigationTree;
});