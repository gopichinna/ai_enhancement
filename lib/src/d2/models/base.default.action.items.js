/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/models/actionitems", "d2/utils/constants" ], function(_, ActionItemCollection, constants) {
  "use strict";
  var defaultActionItems = new ActionItemCollection([ {
    signature: "Open",
    sequence: 10,
    decides: function(node) {
      return _.contains([ constants.Types.DOCUMENT, constants.Types.EMAIL, constants.Types.RENDITION ], node.get("type"));
    }
  }, {
    signature: "Browse",
    sequence: 20,
    decides: function(node) {
      return node.get("type") === constants.Types.FOLDER || node.get("type") === constants.Types.CABINET;
    }
  } ]);
  return defaultActionItems;
});