/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['module', 'require', 'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone'], function (
  module,
  require,
  _,
  $,
  Backbone
) {
  'use strict';

  var configs = module.config().configs || [];
  // Support either array of module IDs or a map with keys pointing
  // to arrays of module IDs; the latter can be used for decentralized
  // configuration (multiple calls to require.config, which merge maps,
  // but not arrays)
  if (!Array.isArray(configs)) {
    configs = Object.keys(configs).reduce(function (result, key) {
      return result.concat(configs[key]);
    }, []);
  }
  // Convert the array of tool item config module names to model attributes
  configs = configs.map(function (name) {
    return {
      id: name
    };
  });

  var ToolItemConfigCollection = Backbone.Collection.extend({
    constructor: function ToolItemConfigCollection(models, options) {
      models || (models = configs);
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    sync: function (method, collection, options) {
      if (method !== 'read') {
        throw new Error('Only fetching tool item configurations is supported.');
      }
      var self = this;
      options = _.extend({}, this.options, options);
      return this._resolveConfigs(options).then(function () {
        var response = self.toJSON();
        options.success && options.success(response, options);
        self.trigger('sync', self, response, options);
      });
    },

    _resolveConfigs: function (options) {
      var modules = this.chain()
          .filter(function (model) {
            // A resolvable config must have an ID
            // and not be already resolved
            return model.has('id') && !(model.has('config') || model.has('error'));
          })
          .pluck('id')
          .value(),
        deferred = $.Deferred(),
        self = this;
      if (modules.length) {
        require(modules, function () {
          var configs = arguments;
          modules.forEach(function (module, index) {
            var model = self.get(module);
            model.set('config', configs[index]);
          });
          deferred.resolve();
        }, function (error) {
          self.forEach(function (module) {
            module.set('error', error);
          });
          if (options.ignoreErrors) {
            deferred.resolve();
          } else {
            deferred.reject(error);
          }
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    }
  });

  return ToolItemConfigCollection;
});
