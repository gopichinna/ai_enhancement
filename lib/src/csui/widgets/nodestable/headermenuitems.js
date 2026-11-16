/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitem.model", "csui-ext!csui/widgets/nodestable/headermenuitems" ], function(_, lang, ToolItemsFactory, TooItemModel, extraMenuItems) {
  "use strict";
  var toolbarItems = {
    headerMenuToolbar: new ToolItemsFactory({
      inspect: [ {
        signature: "Properties",
        name: lang.MenuItemInformation
      } ],
      other: [ {
        signature: "CopyLink",
        name: lang.MenuItemCopyLink
      }, {
        signature: "Share",
        name: lang.MenuItemShare,
        flyout: "share"
      }, {
        signature: "SendTo",
        name: lang.ToolbarItemSendTo,
        flyout: "sendto"
      }, {
        signature: "EmailLink",
        name: lang.ToolbarItemEmailLinkShort,
        flyout: "sendto"
      }, {
        signature: "permissions",
        name: lang.ToolbarItemPermissions
      }, {
        signature: "Rename",
        name: lang.MenuItemRename
      }, {
        signature: "ReserveDoc",
        name: lang.ToolbarItemReserve
      }, {
        signature: "UnreserveDoc",
        name: lang.ToolbarItemUnreserve
      }, {
        signature: "RequestReservation",
        name: lang.ToolbarItemRequestReservation
      }, {
        signature: "UnrequestReservation",
        name: lang.ToolbarItemUnrequestReservation
      }, {
        signature: "Copy",
        name: lang.MenuItemCopy
      }, {
        signature: "Move",
        name: lang.MenuItemMove
      }, {
        signature: "Collect",
        name: lang.ToolbarCollect
      }, {
        signature: "Delete",
        name: lang.MenuItemDelete
      }, {
        signature: "ZipAndDownload",
        name: lang.ToolbarItemZipAndDownload
      }, {
        signature: "Restructure",
        name: lang.MenuItemRestructure
      } ]
    }, {
      maxItemsShown: 0,
      dropDownIconName: "csui_action_caret_down32",
      addGroupSeparators: false
    })
  };
  if (extraMenuItems) {
    _.each(extraMenuItems, function(moduleMenuItems) {
      _.each(moduleMenuItems, function(menuItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error("Invalid target toolbar: " + key);
        }
        _.each(menuItems, function(menuItem) {
          menuItem = new TooItemModel(menuItem);
          targetToolbar.addItem(menuItem);
        });
      });
    });
  }
  toolbarItems.clone = function() {
    return ToolItemsFactory.cloneToolbarItems(this);
  };
  return toolbarItems;
});