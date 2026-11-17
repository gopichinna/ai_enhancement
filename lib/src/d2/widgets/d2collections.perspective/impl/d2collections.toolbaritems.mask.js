/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "csui/controls/toolbar/toolitems.mask", "csui/utils/toolitem.masks/global.toolitems.mask", "d2/widgets/d2collections.perspective/impl/d2collections.toolbaritems" ], function(module, _, ToolItemMask, GlobalMenuItemsMask, d2collectionsToolItems) {
  "use strict";
  function D2CollectionsToolbarItemsMasks() {
    this.initializeMasks();
  }
  D2CollectionsToolbarItemsMasks.prototype.initializeMasks = function() {
    var toolbars = _.keys(d2collectionsToolItems), config = module.config();
    this.toolbars = _.reduce(toolbars, function(toolbars, toolbar) {
      var mask = new ToolItemMask(new GlobalMenuItemsMask(), {
        normalize: false
      });
      _.each(config, function(source, key) {
        if (source && key === toolbar) {
          mask.extendMask(source);
        }
      });
      mask.storeMask();
      toolbars[toolbar] = mask;
      return toolbars;
    }, {});
    D2CollectionsToolbarItemsMasks.toolbars = toolbars;
  };
  return D2CollectionsToolbarItemsMasks;
});