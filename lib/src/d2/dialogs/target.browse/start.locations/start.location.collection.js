/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone" ], function(require, module, _, $, Backbone) {
  "use strict";
  var config = module.config(), startLocations = config.startLocations || [], masks = config.masks || {};
  if (!_.isArray(startLocations)) {
    startLocations = Array.prototype.concat.apply([], _.values(startLocations));
  }
  masks = _.reduce(_.values(masks), function(result, mask) {
    return {
      blacklist: result.blacklist.concat(mask.blacklist || []),
      whitelist: result.whitelist.concat(mask.whitelist || [])
    };
  }, {
    blacklist: [],
    whitelist: []
  });
  masks = {
    blacklist: _.unique(masks.blacklist),
    whitelist: _.unique(masks.whitelist)
  };
  function normalizeLocationName(location) {
    var lastSlash = location.lastIndexOf("/");
    return lastSlash >= 0 ? location : "d2/dialogs/target.browse/start.locations/" + location;
  }
  function filterLocationByMask(location) {
    return !_.contains(masks.blacklist, location) && (!masks.whitelist.length || _.contains(masks.whitelist, location));
  }
  startLocations = _.chain(startLocations).map(normalizeLocationName).filter(filterLocationByMask).unique().value();
  var StartLocationModel = Backbone.Model.extend({
    defaults: {
      id: null,
      name: null,
      icon: null,
      invalid: false,
      factory: null,
      unselectable: true
    },
    constructor: function StartLocationModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },
    sync: function(method, collection, options) {
      if (method !== "read") {
        throw new Error("Only fetching the widget is supported.");
      }
      var self = this;
      options || (options = {});
      return this._resolveFactory(options).then(function() {
        var factory = self.get("factory");
        return factory.updateLocationModel(self);
      }).then(function() {
        var response = self.toJSON();
        options.success && options.success(response, options);
        self.trigger("sync", self, response, options);
      }, function() {
        var error = self.get("error");
        options.error && options.error(error, options);
        self.trigger("error", self, error, options);
        return $.Deferred().reject(error);
      });
    },
    _resolveFactory: function(options) {
      var self = this, deferred = $.Deferred(), factoryData = this.getFactoryData(), factoryPath = this.getFactoryModulePath(factoryData);
      require([ factoryPath ], function(Factory) {
        self.set("factory", new Factory(options));
        deferred.resolve();
      }, function(error) {
        self.set("error", error);
        if (options.ignoreErrors) {
          deferred.resolve();
        } else {
          deferred.reject(error);
        }
      });
      return deferred.promise();
    },
    getFactoryData: function() {
      var name = this.get("id"), lastSlash = name.lastIndexOf("/"), path;
      if (lastSlash < 0) {
        path = "d2/dialogs/target.browse/start.locations/" + name;
      } else {
        path = name;
        name = name.substring(lastSlash + 1);
      }
      return {
        name: name,
        path: path
      };
    },
    getFactoryModulePath: function(moduleData) {
      return moduleData.path + "/" + moduleData.name + ".factory";
    }
  });
  var StartLocationCollection = Backbone.Collection.extend({
    model: StartLocationModel,
    constructor: function StartLocationCollection(options) {
      options || (options = {});
      var locations = options.startLocations;
      var addLocs = [];
      if (options.globalSearch) {
        addLocs.push("search.location");
      }
      if (options.includeBrowse) {
        addLocs.push("default.location");
        addLocs.push("current.location");
      }
      if (options.includeRelatedFiles) {
        addLocs.push("related.files");
      }
      if (options.includeWorkflowTemplates) {
        addLocs.push("workflow.templates");
      }
      if (locations) {
        locations = _.chain(locations).concat(addLocs).map(this._normalizeLocationName).filter(this._filterLocationByMask).unique().value();
      } else {
        locations = startLocations;
      }
      var models = _.map(locations, function(id) {
        return {
          id: id
        };
      });
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },
    _normalizeLocationName: function(location) {
      return normalizeLocationName(location);
    },
    _filterLocationByMask: function(location) {
      return filterLocationByMask(location);
    },
    sync: function(method, collection, options) {
      if (method !== "read") {
        throw new Error("Only fetching the start locations is supported.");
      }
      var self = this;
      options || (options = {});
      return this._resolveFactories(options).then(function() {
        if (options.removeInvalid !== false) {
          var invalidModels = self.where({
            invalid: true
          });
          self.remove(invalidModels);
        }
        var response = self.toJSON();
        options.success && options.success(response, options);
        self.trigger("sync", self, response, options);
      });
    },
    _resolveFactories: function(options) {
      var resolvableModels = this.filter(function(model) {
        return model.has("id") && !(model.has("factory") || model.has("error"));
      }), modelOptions = _.defaults({
        ignoreErrors: true
      }, _.omit(options, "success", "error")), promises = _.invoke(resolvableModels, "fetch", modelOptions);
      return $.when.apply($, promises);
    }
  });
  return StartLocationCollection;
});