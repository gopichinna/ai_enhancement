/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/models/actionitems", "csui-ext!csui/utils/defaultactionitems" ], function(_, ActionItemCollection, rules) {
  "use strict";
  var defaultActionItems = new ActionItemCollection();
  if (rules) {
    defaultActionItems.add(_.flatten(rules, true));
  }
  return defaultActionItems;
});