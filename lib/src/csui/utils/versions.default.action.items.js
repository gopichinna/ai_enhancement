/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/models/actionitems", "csui-ext!csui/utils/versions.default.action.items" ], function(module, _, ActionItemCollection, extraActions) {
  "use strict";
  var config = _.extend({
    openVersionContentOnly: false
  }, module.config());
  var defaultActionItems = new ActionItemCollection([ {
    type: 144,
    signature: config.openVersionContentOnly ? "OpenVersionDelegate" : "VersionOpen",
    sequence: 10
  } ]);
  if (extraActions) {
    defaultActionItems.add(_.flatten(extraActions, true));
  }
  return defaultActionItems;
});