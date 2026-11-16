/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "csui/utils/commandhelper", "csui/utils/commands/browse", "d2/utils/constants" ], function(require, $, _, CommandHelper, Browse, constants) {
  "use strict";
  var oldEnabled = Browse.prototype.enabled;
  Browse.prototype.enabled = function(status) {
    var enabled = oldEnabled.apply(this, arguments);
    var node = CommandHelper.getJustOneNode(status);
    return enabled || status.defaultAction && _.contains([ constants.Types.DOCUMENT, constants.Types.EMAIL ], node.get("type"));
  };
});