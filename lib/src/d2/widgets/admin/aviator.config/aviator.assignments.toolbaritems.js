/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import ToolItemsFactory from "csui/controls/toolbar/toolitems.factory";

import lang from "i18n!d2/widgets/admin/aviator.config/impl/nls/lang";

const toolbarItems = {
  addToolbar: new ToolItemsFactory({
    main: [ {
      signature: "Aviator-AddAssignment",
      name: lang.labelMenuAddAssignment,
      icon: "icon-menu-av4r-add-assignments"
    } ]
  }, {
    maxItemsShown: 1,
    dropDownIconName: "csui_action_more32",
    renderIconAndText: true
  }),
  otherToolbar: new ToolItemsFactory({
    main: [ {
      signature: "Aviator-RemoveAssignment",
      name: lang.labelMenuRemoveAssignment
    }, {
      signature: "Aviator-GoToLocation",
      name: lang.labelMenuGotoLocation
    } ]
  }, {
    maxItemsShown: 5,
    dropDownIconName: "csui_action_more32"
  }),
  rightToolbar: new ToolItemsFactory({
    main: [ {
      signature: "D2-RefreshList",
      name: lang.labelMenuRefresh,
      iconName: "csui_action_refresh32",
      enabled: true
    } ]
  }, {
    hAlign: "right",
    maxItemsShown: 2,
    dropDownIconName: "csui_action_more32",
    addTrailingDivider: false
  }),
  tableInlineActionbar: new ToolItemsFactory({
    main: [ {
      signature: "Aviator-RemoveAssignment",
      name: lang.labelMenuRemoveAssignment,
      iconName: "csui_action_delete32"
    }, {
      signature: "Aviator-GoToLocation",
      name: lang.labelMenuGotoLocation,
      iconName: "d2_action_go_to_location"
    } ]
  }, {
    maxItemsShown: 5,
    dropDownIconName: "csui_action_more32"
  })
};

export default toolbarItems;