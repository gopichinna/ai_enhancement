/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/facets" ], function(FacetCollection) {
  "use strict";
  var SearchFacetCollection = FacetCollection.extend({
    constructor: function SearchFacetCollection() {
      FacetCollection.prototype.constructor.apply(this, arguments);
    },
    ensureFetched: function() {
      return true;
    }
  });
  return SearchFacetCollection;
});