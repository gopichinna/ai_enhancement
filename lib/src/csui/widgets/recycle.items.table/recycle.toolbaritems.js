/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n!csui/widgets/recycle.items.table/impl/nls/lang", "csui/controls/toolbar/toolitems.factory", "csui/themes/csui.jato.action.icons" ], function(lang, ToolItemsFactory, jatoIcons) {
  "use strict";
  const toolbarItems = {
    filterToolbar: new ToolItemsFactory({
      filter: [ {
        signature: "Filter",
        name: lang.filterName,
        isOTWC: true,
        iconName: "csui_action:action_filter32",
        iconSVG: jatoIcons.actionFilter,
        toolItemAria: lang.filterToolItemAria,
        toolItemAriaExpand: false
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
        iconName: "csui_action_restore32",
        iconSVG: jatoIcons.actionRestore
      }, {
        signature: "SmartViewPurge",
        name: lang.LblPurge,
        iconName: "csui_action_delete32",
        iconSVG: jatoIcons.actionDelete
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