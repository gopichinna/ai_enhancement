/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/contexts/factories/factory", "nuc/contexts/factories/connector" ], function(_, FactoryImpl, ConnectorFactory) {
  "use strict";
  const Factory = FactoryImpl.extend({
    constructor: function Factory(context, options = {}) {
      const propPrefix = this.propertyPrefix;
      const connector = context.getObject(ConnectorFactory);
      if (!options[propPrefix]) {
        options[propPrefix] = {
          options: {
            connector: connector
          }
        };
      } else if (!options[propPrefix].options) {
        options[propPrefix].options = {
          connector: connector
        };
      } else {
        options[propPrefix].options.connector ??= connector;
      }
      Factory.__super__.constructor.call(this, context, options);
    },
    isFetchable() {
      const propertyFetcahble = !_.isFunction(this.property.isFetchable) || this.property.isFetchable();
      if (this.property.fetching) {
        return false;
      } else {
        return this.options.permanent === true ? propertyFetcahble : this.property.fetched !== true && propertyFetcahble;
      }
    },
    fetch() {
      return this.property.fetch();
    }
  }, {
    createModelFactoryOptions(attributes, factoryOptions = {}) {
      const opts = {};
      opts[this.prototype.propertyPrefix] = Object.assign({
        options: factoryOptions.modelOptions
      }, {
        attributes: attributes
      });
      return Object.assign(opts, _.omit(factoryOptions, "modelOptions"));
    },
    createCollectionFactoryOptions(models, factoryOptions = {}) {
      const opts = {};
      opts[this.prototype.propertyPrefix] = Object.assign({
        options: factoryOptions.collectionOption
      }, {
        models: models
      });
      return Object.assign(opts, _.omit(factoryOptions, "collectionOption"));
    }
  });
  return Factory;
});