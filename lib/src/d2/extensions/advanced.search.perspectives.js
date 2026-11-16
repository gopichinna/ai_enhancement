/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(function() {
  "use strict";
  return {
    decides: function(query) {
      var byId = query.get("by-id");
      var queryform = query.get("queryform");
      return byId && byId !== "" || queryform && queryform !== "";
    },
    module: "json!d2/server.adaptors/impl/perspectives/advanced.search.json",
    sequence: 500
  };
});