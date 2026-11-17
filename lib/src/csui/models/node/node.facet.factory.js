/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/node", "csui/models/nodefacets" ], function(module, _, Backbone, CollectionFactory, NodeModelFactory, NodeFacetCollection) {
  var FacetCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "facets",
    constructor: function FacetCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var facets = this.options.facets || {};
      if (!(facets instanceof Backbone.Collection)) {
        var node = facets.options && facets.options.node || context.getModel(NodeModelFactory, options), config = module.config();
        facets = new NodeFacetCollection(facets.models, _.defaults(config.options, facets.options, {
          autoreset: true
        }, {
          node: node
        }));
      }
      this.property = facets;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  return FacetCollectionFactory;
});