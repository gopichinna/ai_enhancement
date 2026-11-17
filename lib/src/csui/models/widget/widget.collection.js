/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/models/widget/widget.model", "csui/models/server.module/server.module.collection", "csui/models/tool.item.config/tool.item.config.collection", "csui/models/tool.item.mask/tool.item.mask.collection", "csui/utils/exp.widget.config" ], function(require, module, _, $, Backbone, WidgetModel, ServerModuleCollection, ToolItemConfigCollection, ToolItemMaskCollection, ExpWidgetConfig) {
  "use strict";
  var widgets = module.config().widgets || [];
  if (Array.isArray(widgets.cssvui) && widgets.cssvui.length > 0) {
    widgets.csui = _.union(widgets.csui, widgets.cssvui);
    delete widgets.cssvui;
  }
  const orientExpWidgets = (widgets, ExpWidgetConfig) => {
    const expWidgetsList = ExpWidgetConfig;
    const widgetsList = Object.keys(expWidgetsList);
    const noOfWidgets = widgetsList.length;
    if (noOfWidgets === 0) return;
    for (let i = 0; i < noOfWidgets; i++) {
      const oldWidget = widgetsList[i];
      const {
        expWidgetConfig
      } = expWidgetsList[oldWidget] || {};
      const {
        moduleName,
        newWidget,
        isBothEnable
      } = expWidgetConfig || {};
      const module = widgets[moduleName];
      if (newWidget && Array.isArray(module)) {
        if (!isBothEnable) {
          const indexOfOldWidget = module.indexOf(oldWidget);
          indexOfOldWidget > -1 && module.splice(indexOfOldWidget, 1);
        }
        module.push(newWidget);
      }
    }
  };
  orientExpWidgets(widgets, ExpWidgetConfig);
  if (!_.isArray(widgets)) {
    widgets = Array.prototype.concat.apply([], _.values(widgets));
  }
  widgets = _.map(widgets, function(name) {
    return {
      id: name
    };
  });
  var WidgetCollection = Backbone.Collection.extend({
    model: WidgetModel,
    constructor: function WidgetCollection(models, options) {
      this.options = _.defaults({}, options, {
        includeView: true,
        includeManifest: true,
        includeServerModule: true,
        includeToolItems: true
      });
      if (this.options.includeToolItems) {
        this.options.includeManifest = true;
      }
      models || (models = widgets);
      WidgetCollection.__super__.constructor.call(this, models, options);
    },
    sync: function(method, collection, options) {
      if (method !== "read") {
        throw new Error("Only fetching the widgets is supported.");
      }
      var self = this;
      options = _.extend({}, this.options, options);
      if (options.includeToolItems) {
        options.includeManifest = true;
      }
      var serverModulesPromise = this._resolveServerModules(options), toolItemsPromise = this._resolveToolItems(options), toolItemMasksPromise = this._resolveToolItemMasks(options);
      return $.when(serverModulesPromise, toolItemsPromise, toolItemMasksPromise).then(_.bind(this._resolveWidgets, this, options)).then(function() {
        var response = self.toJSON();
        options.success && options.success(response, options);
        self.trigger("sync", self, response, options);
      });
    },
    _prepareModel: function(attrs, options) {
      options || (options = {});
      _.defaults(options, {
        includeView: this.options.includeView,
        includeManifest: this.options.includeManifest,
        includeServerModule: this.options.includeServerModule,
        includeToolItems: this.options.includeToolItems
      });
      return WidgetCollection.__super__._prepareModel.call(this, attrs, options);
    },
    _resolveServerModules: function(options) {
      var serverModules = options.serverModules;
      if (serverModules || !options.includeServerModule) {
        return $.Deferred().resolve().promise();
      }
      serverModules = options.serverModules = new ServerModuleCollection();
      return serverModules.fetch({
        ignoreErrors: options.ignoreErrors !== false
      });
    },
    _resolveToolItems: function(options) {
      var toolItems = options.toolItems;
      if (toolItems || !options.includeToolItems) {
        return $.Deferred().resolve().promise();
      }
      toolItems = options.toolItems = new ToolItemConfigCollection();
      return toolItems.fetch({
        ignoreErrors: options.ignoreErrors !== false
      });
    },
    _resolveToolItemMasks: function(options) {
      var toolItemMasks = options.toolItemMasks;
      if (toolItemMasks || !options.includeToolItems) {
        return $.Deferred().resolve().promise();
      }
      toolItemMasks = options.toolItemMasks = new ToolItemMaskCollection();
      return toolItemMasks.fetch({
        ignoreErrors: options.ignoreErrors !== false
      });
    },
    _resolveWidgets: function(options) {
      var resolvableModels = this.filter(function(model) {
        return model.has("id") && !(model.has("view") || model.has("manifest") || model.has("error"));
      }), promises = _.invoke(resolvableModels, "fetch", {
        ignoreErrors: options.ignoreErrors !== false,
        ignoreManifestErrors: options.ignoreManifestErrors !== false,
        includeView: options.includeView,
        includeManifest: options.includeManifest,
        includeServerModule: options.includeServerModule,
        includeToolItems: options.includeToolItems,
        serverModules: options.serverModules,
        toolItems: options.toolItems,
        toolItemMasks: options.toolItemMasks
      });
      return $.when.apply($, promises);
    }
  });
  return WidgetCollection;
});