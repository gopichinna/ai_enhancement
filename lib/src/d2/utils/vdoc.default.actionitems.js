/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/models/actionitems", "d2/models/virtual.document.children", "csui-ext!d2/utils/vdoc.default.actionitems" ], function(_, ActionItemCollection, VirtualDocumentChildren, extraActions) {
  "use strict";
  var defaultActionItems = new ActionItemCollection([ {
    sequence: 10,
    signature: "D2-ViewVDoc",
    decides: function(node) {
      return node && node.collection instanceof VirtualDocumentChildren;
    }
  } ]);
  if (extraActions) {
    defaultActionItems.add(_.flatten(extraActions, true));
  }
  return defaultActionItems;
});