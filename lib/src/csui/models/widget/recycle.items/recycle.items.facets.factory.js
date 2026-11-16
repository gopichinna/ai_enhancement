/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "csui/models/widget/recycle.items/recycle.items.facets" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, RecycleItemsFacetCollection) {
  var RecycleItemsFacetCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "recycleItemsFacets",
    constructor: function RecycleItemsFacetCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var facets = this.options.recycleItemsFacets || {};
      if (!(facets instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options), query = facets.options.query, config = module.config();
        facets = new RecycleItemsFacetCollection(facets.models, _.extend({
          connector: connector,
          context: context,
          query: query,
          stateEnabled: true
        }, facets.options, config.options, {
          autofetch: true,
          autoreset: true
        }));
      }
      this.property = facets;
    },
    isFetchable: function() {
      return this.property.isFetchable();
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  return RecycleItemsFacetCollectionFactory;
});