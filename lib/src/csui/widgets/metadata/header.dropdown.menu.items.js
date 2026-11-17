/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitem.model", "csui-ext!csui/widgets/metadata/header.dropdown.menu.items", "csui-ext!csui/widgets/metadata/header.item.name/menuitems" ], function(_, lang, ToolItemsFactory, TooItemModel, extraToolItems, oldExtraToolItems) {
  "use strict";
  var toolbarItems = {
    dropdownMenuList: new ToolItemsFactory({
      inspect: [ {
        signature: "Properties",
        name: lang.ToolbarItemInfo
      } ],
      info: [ {
        signature: "View",
        name: lang.ToolbarItemView,
        flyout: "view"
      } ],
      edit: [ {
        signature: "CopyLink",
        name: lang.ToolbarItemCopyLink
      }, {
        signature: "Edit",
        name: lang.ToolbarItemEdit,
        flyout: "edit",
        promoted: true
      }, {
        signature: "EditWebDAV",
        name: "EditWebDAV",
        flyout: "edit"
      } ],
      share: [ {
        signature: "Share",
        name: lang.MenuItemShare,
        flyout: "share"
      } ],
      main: [ {
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
        name: lang.ToolbarItemRename
      }, {
        signature: "Download",
        name: lang.ToolbarItemDownload
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
        name: lang.ToolbarItemCopy
      }, {
        signature: "Move",
        name: lang.ToolbarItemMove
      }, {
        signature: "AddVersion",
        name: lang.ToolbarItemAddVersion
      }, {
        signature: "Delete",
        name: lang.ToolbarItemDelete
      }, {
        signature: "Collect",
        name: lang.ToolbarCollect
      }, {
        signature: "ZipAndDownload",
        name: lang.MenuItemZipAndDownload
      }, {
        signature: "Restructure",
        name: lang.MenuItemRestructure
      } ],
      shortcut: [ {
        signature: "OriginalCopyLink",
        name: lang.ToolbarItemOriginalCopyLink
      }, {
        signature: "OriginalEdit",
        name: lang.ToolbarItemOriginalEdit
      }, {
        signature: "OriginalEmailLink",
        name: lang.ToolbarItemOriginalShare
      }, {
        signature: "OriginalReserveDoc",
        name: lang.ToolbarItemOriginalReserve
      }, {
        signature: "OriginalUnreserveDoc",
        name: lang.ToolbarItemOriginalUnreserve
      }, {
        signature: "OriginalCopy",
        name: lang.ToolbarItemOriginalCopy
      }, {
        signature: "OriginalMove",
        name: lang.ToolbarItemOriginalMove
      }, {
        signature: "OriginalAddVersion",
        name: lang.ToolbarItemAddVersion
      }, {
        signature: "OriginalDownload",
        name: lang.ToolbarItemOriginalDownload
      }, {
        signature: "OriginalDelete",
        name: lang.ToolbarItemOriginalDelete
      } ]
    }, {
      maxItemsShown: 0,
      dropDownIconName: "csui_action_caret_down32",
      addGroupSeparators: false
    })
  };
  if (oldExtraToolItems) {
    addExtraToolItems(oldExtraToolItems);
  }
  if (extraToolItems) {
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