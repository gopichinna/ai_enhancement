/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/contexts/factories/factory", "nuc/contexts/factories/connector", "d2/models/table/display.types" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, DisplayTypeCollection) {
  "use strict";
  const DisplayTypesFactory = CollectionFactory.extend({
    propertyPrefix: "d2_display_types",
    constructor: function DisplayTypesFactory(context, options) {
      CollectionFactory.prototype.constructor.call(this, context, options);
      let displayTypes = this.options.favorites || this.options.widget || {};
      if (!(displayTypes instanceof Backbone.Collection)) {
        const connector = context.getObject(ConnectorFactory, options), config = module.config();
        displayTypes = new DisplayTypeCollection(displayTypes.models, _.extend({
          connector: connector
        }, displayTypes.options, config.options, {
          autoreset: true
        }));
      }
      this.property = displayTypes;
    },
    isFetchable: function() {
      return false;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  return DisplayTypesFactory;
});