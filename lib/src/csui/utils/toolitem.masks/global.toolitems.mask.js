/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/controls/toolbar/toolitems.mask" ], function(module, _, ToolItemMask) {
  "use strict";
  var GlobalToolItemsMask = ToolItemMask.extend({
    constructor: function GlobalToolItemsMask() {
      ToolItemMask.prototype.constructor.apply(this);
      var config = module.config();
      _.each(config, function(source, key) {
        this.extendMask(source);
      }, this);
      this.storeMask();
    }
  });
  return GlobalToolItemsMask;
});