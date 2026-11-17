/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "csui/controls/toolbar/toolitems.mask", "csui/utils/toolitem.masks/global.toolitems.mask" ], function(module, _, ToolItemMask, GlobalMenuItemsMask) {
  "use strict";
  var toolbars = [ "filterToolbar", "leftToolbar", "tableHeaderToolbar", "inlineActionbar", "rightToolbar", "addToolbar", "configurationToolbar", "captionMenuToolbar" ];
  function ToolbarItemsMasks() {
    var config = module.config(), globalMask = new GlobalMenuItemsMask();
    this.toolbars = _.reduce(toolbars, function(toolbars, toolbar) {
      var mask = new ToolItemMask(globalMask, {
        normalize: false
      });
      _.each(config, function(source) {
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
  ToolbarItemsMasks.toolbars = toolbars;
  return ToolbarItemsMasks;
});