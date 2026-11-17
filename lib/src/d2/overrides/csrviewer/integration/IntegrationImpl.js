/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
(function() {
  var docId = window.signedConfigResponse.documents[0].cid;
  var searchService;
  if (docId !== "preview") {
    searchService = parent.csrviewerSearch[docId];
  }
  define([ "dojo/_base/declare", "integration/IntegrationAPI" ], function(declare, IntegrationAPI) {
    return declare([ IntegrationAPI ], {
      search: function(searchRequest) {
        if (typeof searchService !== "undefined" && searchService !== null) {
          return searchService.search(searchRequest);
        }
      }
    });
  });
})();