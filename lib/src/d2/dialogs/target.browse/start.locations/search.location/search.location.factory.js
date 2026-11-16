/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/dialogs/target.browse/start.locations/location.base.factory", "csui/models/widget/search.results/search.results.model", "d2/widgets/advanced.search.results/search.facets" ], function(_, $, LocationBaseFactory, SearchResultsCollection, SearchFacetCollection) {
  "use strict";
  var SearchLocationFactory = LocationBaseFactory.extend({
    updateLocationModel: function(model) {
      model.set({
        hide: true,
        invalid: false
      });
      return $.Deferred().resolve().promise();
    },
    getLocationParameters: function(options) {
      var container = this.options.container, searchResults = {};
      var children = new SearchResultsCollection(searchResults.models, _.extend({
        connector: options.connector,
        query: options.query,
        excludeTypes: options.excludeTypes,
        subTypeFilters: options.subTypeFilters
      }, {
        autofetch: true,
        autoreset: true,
        top: options.pageSize
      }));
      children.searchFacets = new SearchFacetCollection();
      if (container) {
        container.set("unselectable", false);
      }
      return {
        container: container,
        collection: children
      };
    }
  });
  return SearchLocationFactory;
});