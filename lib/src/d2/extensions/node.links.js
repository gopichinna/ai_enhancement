/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/utils/url", "d2/utils/constants" ], function(Url, constants) {
  "use strict";
  return [ {
    equals: {
      type: constants.Types.TASK
    },
    getUrl: function(node) {
      return Url.combine("tasks/", node.get("id"));
    }
  }, {
    equals: {
      type: constants.Types.COLLECTIONS
    },
    getUrl: function(node) {
      return Url.combine("collections/?collection-id", node.get("id"));
    }
  } ];
});