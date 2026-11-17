/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/base", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitem.model", "csui-ext!csui/widgets/permissions/dynamic.permissions/toolbaritems" ], function(base, lang, ToolItemsFactory, TooItemModel, extraToolItems) {
  "use strict";
  let toolbarItems = {
    inlineToolbar: new ToolItemsFactory({
      other: []
    }, {
      maxItemsShown: base.isHybrid() ? 1 : 3,
      dropDownText: lang.ToolbarItemMore,
      dropDownIconName: "csui_action_more32"
    })
  };
  if (extraToolItems) {
    addExtraToolItems(extraToolItems);
  }
  function addExtraToolItems(extraToolItems) {
    extraToolItems.forEach(function(moduleToolItems) {
      for (const key in moduleToolItems) {
        let targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error("Invalid target toolbar: " + key);
        }
        moduleToolItems[key].forEach(function(toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      }
    });
  }
  return toolbarItems;
});