/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "csui/models/widget/search.results/search.facets" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, SearchFacetCollection) {
  var SearchResultFacetCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "searchFacets",
    constructor: function SearchResultFacetCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var facets = this.options.searchFacets || {};
      if (!(facets instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options), query = facets.options.query, config = module.config();
        facets = new SearchFacetCollection(facets.models, _.extend({
          connector: connector,
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
  return SearchResultFacetCollectionFactory;
});