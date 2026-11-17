/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import ToolItemsFactory from "csui/controls/toolbar/toolitems.factory";

const toolItems = {
  addToolbar: new ToolItemsFactory({}, {
    maxItemsShown: 1,
    dropDownIconName: "csui_action_more32",
    renderIconAndText: true
  }),
  otherToolbar: new ToolItemsFactory({}, {
    maxItemsShown: 5,
    dropDownIconName: "csui_action_more32"
  }),
  rightToolbar: new ToolItemsFactory({}, {
    hAlign: "right",
    maxItemsShown: 2,
    dropDownIconName: "csui_action_more32",
    addTrailingDivider: false
  }),
  inlineActionbar: new ToolItemsFactory({}, {
    maxItemsShown: 5,
    dropDownIconName: "csui_action_more32"
  })
};

export default toolItems;