/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "csui/controls/toolbar/toolitems.mask", "csui/utils/toolitem.masks/global.toolitems.mask", "csui-ext!d2/utils/vdoc.toolbaritems.mask" ], function(module, _, ToolItemMask, GlobalMenuItemsMask, dynamicMasks) {
  "use strict";
  dynamicMasks = dynamicMasks || [];
  var VDocToolbarItemMask = ToolItemMask.extend({
    constructor: function VDocToolbarItemMask(options) {
      var config = module.config(), globalMask = new GlobalMenuItemsMask();
      ToolItemMask.prototype.constructor.call(this, globalMask, {
        normalize: false
      });
      _.each(config, function(source) {
        this.extendMask(source);
      }, this);
      this.storeMask();
      this.context = options.context;
      this.node = options.node ? options.node : options.model;
      this._updateMask();
      this.listenTo(this.node, "change:id", this._updateMask);
    },
    _updateMask: function() {
      var modified = this.restoreMask({
        silent: true
      });
      dynamicMasks.forEach(function(mask) {
        mask = mask({
          context: this.context,
          node: this.node
        });
        if (mask) {
          modified = this.extendMask(mask, {
            silent: true
          }) || modified;
        }
      }, this);
      if (modified) {
        this.trigger("update", this);
      }
    }
  });
  return VDocToolbarItemMask;
});