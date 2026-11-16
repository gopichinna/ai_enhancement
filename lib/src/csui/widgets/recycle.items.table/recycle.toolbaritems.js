/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n!csui/widgets/recycle.items.table/impl/nls/lang", "csui/controls/toolbar/toolitems.factory" ], function(lang, ToolItemsFactory) {
  "use strict";
  const toolbarItems = {
    filterToolbar: new ToolItemsFactory({
      filter: [ {
        signature: "Filter",
        name: lang.filterName,
        iconName: "csui_action_filter32",
        toolItemAria: lang.filterToolItemAria,
        toolItemAriaExpand: false,
        toolItemRole: "button"
      } ]
    }, {
      addTrailingDivider: false
    }),
    tableHeaderToolbar: new ToolItemsFactory({
      main: [ {
        signature: "SmartViewRestore",
        name: lang.LblRestore
      }, {
        signature: "SmartViewPurge",
        name: lang.LblPurge
      } ]
    }, {
      maxItemsShown: 5,
      dropDownIconName: "csui_action_more32",
      addGroupSeparators: false,
      lazyActions: true
    }),
    inlineActionbar: new ToolItemsFactory({
      info: [ {
        signature: "SmartViewRestore",
        name: lang.LblRestore,
        iconName: "csui_action_restore32"
      }, {
        signature: "SmartViewPurge",
        name: lang.LblPurge,
        iconName: "csui_action_delete32"
      } ]
    }, {
      maxItemsShown: 5,
      dropDownText: lang.ToolbarItemMore,
      dropDownIconName: "csui_action_more32",
      addGroupSeparators: false
    })
  };
  return toolbarItems;
});