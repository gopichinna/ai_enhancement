/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "csui/models/server.module/server.module.collection" ], function(module, _, ServerModuleCollectionImpl) {
  "use strict";
  const config = module.config(), sourceModules = config.modules || {}, {
    moduleOrder = {}
  } = config, pluginModuleIds = [], serverModules = _.map(sourceModules, function(attributes, id) {
    pluginModuleIds.push(id);
    attributes.id = id;
    attributes.sequence = _.isNumber(moduleOrder[id]) && !_.isNaN(moduleOrder[id]) ? moduleOrder[id] : Number.MAX_VALUE;
    return attributes;
  });
  var ModuleCollection = ServerModuleCollectionImpl.extend({
    comparator: "sequence",
    constructor: function ModuleCollection(models, options = {}) {
      options.ownModulesOnly = true;
      ModuleCollection.__super__.constructor.call(this, models, options);
      this.add(serverModules, {
        silent: true
      });
    },
    getPluginModules: function() {
      return this.filter(function(model) {
        return _.includes(pluginModuleIds, model.get("id"));
      });
    }
  });
  return ModuleCollection;
});