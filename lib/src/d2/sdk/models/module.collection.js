/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'module',
  'nuc/lib/underscore',
  'csui/models/server.module/server.module.collection'
], function(module, _, ServerModuleCollectionImpl){
  'use strict';

  var sourceModules = module.config().modules || {},
    pluginModuleIds = [],
    serverModules = _.map(sourceModules, function (attributes, id) {
      pluginModuleIds.push(id);
      attributes.id = id;
      return attributes;
    });

  /**
   * Server module collection. Lists all the plugins registered with the D2 Smartview runtime as well as the underlying framework.
   *
   * By convention it is required for any new dynamic component(plugins), that adds functionalities to the D2SV runtime, is required to register itself
   * with the runtime by declaring itself as an extension.
   *
   * @example <caption>To declare a D2SV extension component named "someplugin", add in extension.json</caption>
   * {
   *   "d2/sdk/models/module.collection": {
   *      "modules": {
   *        "someplugin": { //Javascript namespace of the D2 Plugin which is supplying the D2SV component
   *          "title": "This is a new cool plugin that shows hello world in an iframe",
   *          "version": "1.0.0"
   *        }
   *      }
   *    }
   * }
   *
   *
   * @module {d2/sdk/models/module.collection} d2/sdk/models/"module.collection"
   * @name ModuleCollection
   * @extends {external:Backbone.Collection}
   *
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   *
   */

  var ModuleCollection = ServerModuleCollectionImpl.extend({
    constructor: function ModuleCollection(models, options={}) {
      options.ownModulesOnly = true;
      ModuleCollection.__super__.constructor.call(this, models, options);
      this.add(serverModules, {silent: true});
    },

    getPluginModules: function() {
      return this.filter(function(model){
        return _.includes(pluginModuleIds, model.get('id'));
      });
    }
  });

  return ModuleCollection;
});