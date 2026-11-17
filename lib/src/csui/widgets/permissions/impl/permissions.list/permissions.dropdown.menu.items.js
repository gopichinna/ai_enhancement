/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitem.model", "csui-ext!csui/widgets/permissions/impl/permissions.list/permissions.dropdown.menu.items", "csui-ext!csui/widgets/permissions/permissions.list/permissions.dropdown.menu.items" ], function(_, lang, ToolItemsFactory, TooItemModel, deprecatedExtraToolItems, extraToolItems) {
  "use strict";
  var toolbarItems = {
    dropdownMenuList: new ToolItemsFactory({
      main: [ {
        signature: "adduserorgroup",
        name: lang.AddUserOrGroups
      }, {
        signature: "addownerorgroup",
        name: lang.AddOwnerOrGroup
      }, {
        signature: "restorepublicaccess",
        name: lang.RestorePublicAccess
      } ]
    }, {
      maxItemsShown: 0,
      dropDownIconName: "csui_action_caret_down32"
    })
  };
  if (deprecatedExtraToolItems) {
    console.warn('DEPRECATED: depend on the extension "csui-ext!csui/widgets/permissions/permissions.list/permissions.dropdown.menu.items"' + " instead.");
    if (extraToolItems) {
      var allExtraToolItems = extraToolItems.concat(deprecatedExtraToolItems);
      addExtraToolItems(allExtraToolItems);
    } else {
      addExtraToolItems(deprecatedExtraToolItems);
    }
  } else if (extraToolItems) {
    addExtraToolItems(extraToolItems);
  }
  function addExtraToolItems(extraToolItems) {
    _.each(extraToolItems, function(moduleToolItems) {
      _.each(moduleToolItems, function(toolItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error("Invalid target toolbar: " + key);
        }
        _.each(toolItems, function(toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }
  return toolbarItems;
});