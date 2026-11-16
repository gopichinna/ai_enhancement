/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/contexts/factories/search.results.factory" ], function(SearchResultsFactory) {
  var SearchResultCollectionFactory = SearchResultsFactory.extend({
    constructor: function SearchResultCollectionFactory(context, options) {
      SearchResultsFactory.prototype.constructor.apply(this, arguments);
      console.warn('warning: "csui/widgets/search.results/impl/search.results.factory" has been' + ' deprecated. Use "csui/utils/contexts/factories/search.results.factory');
    }
  });
  return SearchResultCollectionFactory;
});