/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import module from "module";

import _ from "nuc/lib/underscore";

import ToolItemsFactory from "csui/controls/toolbar/toolitems.factory";

import ToolItemMask from "csui/controls/toolbar/toolitems.mask";

import GlobalMenuItemsMask from "csui/utils/toolitem.masks/global.toolitems.mask";

import Toolbaritems from "d2/widgets/business.workspace/toolbar/toolbaritems";

var toolbars = _.chain(Toolbaritems).reduce((list, value, key) => {
  if (value instanceof ToolItemsFactory) {
    list.push(key);
  }
  return list;
}, []).value();

class ToolbarItemsMasks {
  constructor() {
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
}

ToolbarItemsMasks.toolbars = toolbars;

export default ToolbarItemsMasks;