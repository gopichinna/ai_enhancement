/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import ToolItemsFactory from "csui/controls/toolbar/toolitems.factory";

import ToolBarItems from "d2/widgets/nodestable/toolbaritems";

export default _.extend({
  perspectiveToolbar: new ToolItemsFactory(),
  headerMenuToolbar: new ToolItemsFactory(),
  dropdownMenuList: new ToolItemsFactory(),
  nodeDropdownMenuList: new ToolItemsFactory()
}, ToolBarItems);