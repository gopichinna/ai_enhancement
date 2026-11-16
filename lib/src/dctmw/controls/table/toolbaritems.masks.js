/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import module from "module";

import _ from "nuc/lib/underscore";

import ToolItemMask from "csui/controls/toolbar/toolitems.mask";

import GlobalMenuItemsMask from "csui/utils/toolitem.masks/global.toolitems.mask";

import toolbarItems from "dctmw/controls/table/toolbaritems";

class ToolbarItemsMasks extends Object {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this._initialize(options);
    this._initializeMasks();
    this._evaluateAndApplyMask();
  }
  _initialize() {}
  _initializeMasks() {
    const toolbars = _.keys(this.options.toolbarItems ?? toolbarItems), config = this.options.config ?? module.config();
    this.toolbars = _.reduce(toolbars, function(toolbars, toolbar) {
      const mask = new ToolItemMask(new GlobalMenuItemsMask(), {
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
    ToolbarItemsMasks.toolbars = toolbars;
  }
  _evaluateAndApplyMask() {}
}

Object.defineProperty(ToolbarItemsMasks.prototype.constructor, "name", {
  value: "ToolbarItemsMasks"
});

export default ToolbarItemsMasks;