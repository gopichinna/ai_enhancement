/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "d2/widgets/myshares/myshares.model", "csui/utils/commands", "nuc/utils/deepClone/deepClone" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, MySharesCollection, commands) {
  "use strict";
  var MySharesCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "myshares",
    constructor: function MySharesCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var myshares = this.options.widget || this.options.myshares || {};
      if (!(myshares instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options), config = module.config();
        myshares = new MySharesCollection(myshares.models, _.extend({
          connector: connector
        }, myshares.options, config.options, MySharesCollectionFactory.getDefaultResourceScope(), {
          autoreset: true
        }));
      }
      this.property = myshares;
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
  return MySharesCollectionFactory;
});