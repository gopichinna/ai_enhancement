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

  var masks = module.config().masks || [];
  // Support either array of module IDs or a map with keys pointing
  // to arrays of module IDs; the latter can be used for decentralized
  // configuration (multiple calls to require.config, which merge maps,
  // but not arrays)
  if (!Array.isArray(masks)) {
    masks = Object.keys(masks).reduce(function (result, key) {
      return result.concat(masks[key]);
    }, []);
  }
  // Convert the array of tool item mask module names to model attributes
  masks = masks.map(function (name) {
    return {
      id: name
    };
  });

  var ToolItemMaskCollection = Backbone.Collection.extend({
    constructor: function ToolItemMaskCollection(models, options) {
      models || (models = masks);
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    sync: function (method, collection, options) {
      if (method !== 'read') {
        throw new Error('Only fetching tool item masks is supported.');
      }
      var self = this;
      options = _.extend({}, this.options, options);
      return this._resolveMasks(options).then(function () {
        var response = self.toJSON();
        options.success && options.success(response, options);
        self.trigger('sync', self, response, options);
      });
    },

    _resolveMasks: function (options) {
      var modules = this.chain()
          .filter(function (model) {
            // A resolvable mask must have an ID
            // and not be already resolved
            return model.has('id') && !(model.has('mask') || model.has('error'));
          })
          .pluck('id')
          .value(),
        deferred = $.Deferred(),
        self = this;
      if (modules.length) {
        require(modules, function () {
          var masks = arguments;
          modules.forEach(function (module, index) {
            var model = self.get(module);
            model.set('mask', masks[index]);
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

  return ToolItemMaskCollection;
});
