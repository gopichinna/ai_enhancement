/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/controls/toolbar/toolitems.mask", "csui/utils/toolitem.masks/global.toolitems.mask" ], function(module, _, ToolItemMask, GlobalMenuItemsMask) {
  "use strict";
  var HeaderMenuItemsMask = ToolItemMask.extend({
    constructor: function HeaderMenuItemsMask() {
      var config = module.config(), globalMask = new GlobalMenuItemsMask();
      ToolItemMask.prototype.constructor.call(this, globalMask, {
        normalize: false
      });
      _.each(config, function(source, key) {
        this.extendMask(source);
      }, this);
      this.storeMask();
    }
  });
  return HeaderMenuItemsMask;
});