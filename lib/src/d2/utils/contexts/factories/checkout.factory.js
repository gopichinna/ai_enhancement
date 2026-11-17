/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "d2/widgets/checkout/checkout.model", "csui/utils/commands", "nuc/utils/deepClone/deepClone" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, CheckoutCollection, commands) {
  "use strict";
  var CheckoutCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "checkedout",
    constructor: function CheckoutCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var checkout = this.options.widget || this.options.checkedout || {};
      if (!(checkout instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options), config = module.config();
        checkout = new CheckoutCollection(checkout.models, _.extend({
          connector: connector
        }, checkout.options, config.options, CheckoutCollectionFactory.getDefaultResourceScope(), {
          autoreset: true
        }));
      }
      this.property = checkout;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  }, {
    getDefaultResourceScope: function() {
      return _.deepClone({
        commands: commands.getAllSignatures()
      });
    }
  });
  return CheckoutCollectionFactory;
});