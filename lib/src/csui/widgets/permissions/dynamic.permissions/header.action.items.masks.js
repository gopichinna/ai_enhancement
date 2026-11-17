/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/controls/toolbar/toolitems.mask", "csui/utils/toolitem.masks/global.toolitems.mask" ], function(module, ToolItemMask, GlobalMenuItemsMask) {
  "use strict";
  let toolbars = [ "dropdownMenuList" ];
  function HeaderActionItemsMasks() {
    let config = module.config();
    let globalMask = new GlobalMenuItemsMask();
    this.toolbars = toolbars.reduce(function(toolbars, toolbar) {
      let mask = new ToolItemMask(globalMask, {
        normalize: false
      });
      Object.entries(config).forEach(([ key, source ]) => {
        source = source[toolbar];
        if (source) {
          mask.extendMask(source);
        }
      });
      mask.storeMask();
      toolbars[toolbar] = mask;
      return toolbars;
    }, {});
  }
  HeaderActionItemsMasks.toolbars = toolbars;
  return HeaderActionItemsMasks;
});