/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "i18n!csui/widgets/search.results/nls/lang", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitem.model", "csui/themes/csui.jato.action.icons", "csui-ext!csui/widgets/search.results/toolbaritems", "csui/widgets/search.results/impl/toolbaritems" ], function(_, publicLang, lang, ToolItemsFactory, TooItemModel, jatoIcons, extraToolItems, oldExtraToolItems) {
  "use strict";
  var toolbarItems = {
    filterToolbar: new ToolItemsFactory({
      filter: [ {
        signature: "Filter",
        name: lang.ToolbarItemFilter,
        iconName: "csui_action_filter32"
      } ]
    }, {
      addTrailingDivider: false
    }),
    tableHeaderToolbar: new ToolItemsFactory({
      inspect: [ {
        signature: "Properties",
        name: lang.ToolbarItemInfo,
        iconName: "csui_action_properties32",
        iconSVG: jatoIcons.actionProperties
      } ],
      info: [],
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
        signature: "SendTo",
        name: lang.ToolbarItemSendTo,
        flyout: "sendto",
        group: "share"
      }, {
        signature: "Share",
        name: lang.ToolbarItemShare,
        flyout: "share",
        promoted: true,
        group: "share"
      }, {
        signature: "EmailLink",
        name: lang.ToolbarItemEmailLink,
        flyout: "sendto",
        promoted: true,
        group: "share"
      } ],
      main: [ {
        signature: "InlineEdit",
        name: lang.ToolbarItemRename
      }, {
        signature: "permissions",
        name: lang.ToolbarItemPermissions
      }, {
        signature: "Download",
        name: lang.ToolbarItemDownload
      }, {
        signature: "ReserveDoc",
        name: publicLang.ToolbarItemReserve
      }, {
        signature: "UnreserveDoc",
        name: publicLang.ToolbarItemUnreserve
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
        signature: "Collect",
        name: lang.ToolbarCollect
      }, {
        signature: "Delete",
        name: lang.ToolbarItemDelete
      }, {
        signature: "RemoveCollectedItems",
        name: lang.ToolbarItemRemoveCollectionItems
      }, {
        signature: "ZipAndDownload",
        name: lang.MenuItemZipAndDownload
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
        name: publicLang.ToolbarItemOriginalReserve
      }, {
        signature: "OriginalUnreserveDoc",
        name: publicLang.ToolbarItemOriginalUnreserve
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
      maxItemsShown: 15,
      dropDownIconName: "csui_action_more32",
      dropDownText: lang.ToolbarItemMore,
      addGroupSeparators: false,
      lazyActions: true
    }),
    otherToolbar: new ToolItemsFactory({
      inspect: [ {
        signature: "Properties",
        name: lang.ToolbarItemInfo,
        iconName: "csui_action_properties32",
        iconSVG: jatoIcons.actionProperties
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
        signature: "SendTo",
        name: lang.ToolbarItemSendTo,
        flyout: "sendto",
        group: "share"
      }, {
        signature: "Share",
        name: lang.ToolbarItemShare,
        flyout: "share",
        promoted: true,
        group: "share"
      }, {
        signature: "EmailLink",
        name: lang.ToolbarItemEmailLink,
        flyout: "sendto",
        promoted: true,
        group: "share"
      } ],
      main: [ {
        signature: "permissions",
        name: lang.ToolbarItemPermissions
      }, {
        signature: "Download",
        name: lang.ToolbarItemDownload
      }, {
        signature: "ReserveDoc",
        name: publicLang.ToolbarItemReserve
      }, {
        signature: "UnreserveDoc",
        name: publicLang.ToolbarItemUnreserve
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
        signature: "Collect",
        name: lang.ToolbarCollect
      }, {
        signature: "Delete",
        name: lang.ToolbarItemDelete
      }, {
        signature: "ZipAndDownload",
        name: lang.MenuItemZipAndDownload
      } ]
    }, {
      maxItemsShown: 15,
      dropDownText: lang.ToolbarItemMore,
      dropDownIconName: "csui_action_more32",
      addGroupSeparators: false,
      lazyActions: true,
      useOTCToolbar: true
    }),
    inlineToolbar: new ToolItemsFactory({
      inspect: [ {
        signature: "Properties",
        name: lang.ToolbarItemInfo,
        iconName: "csui_action_properties32",
        iconSVG: jatoIcons.actionProperties
      } ],
      info: [ {
        signature: "View",
        name: lang.ToolbarItemView,
        iconName: "csui_action_preview32",
        iconSVG: jatoIcons.actionVisibility,
        flyout: "view"
      } ],
      edit: [ {
        signature: "CopyLink",
        name: lang.ToolbarItemCopyLink,
        iconName: "csui_action_copy_link32",
        iconSVG: jatoIcons.actionLink
      }, {
        signature: "Edit",
        name: lang.ToolbarItemEdit,
        flyout: "edit",
        promoted: true,
        iconName: "csui_action_edit32",
        iconSVG: jatoIcons.actionEdit
      }, {
        signature: "EditWebDAV",
        name: "EditWebDAV",
        flyout: "edit"
      } ],
      share: [ {
        signature: "Share",
        name: lang.MenuItemShare,
        iconName: "csui_action_share32",
        iconSVG: jatoIcons.actionShare,
        flyout: "share"
      }, {
        signature: "SendTo",
        name: lang.ToolbarItemSendTo,
        iconName: "csui_action_send_to32",
        iconSVG: jatoIcons.actionSendTo,
        flyout: "sendto"
      }, {
        signature: "EmailLink",
        name: lang.ToolbarItemEmailLink,
        flyout: "sendto"
      } ],
      other: [ {
        signature: "permissions",
        name: lang.ToolbarItemPermissions,
        iconName: "csui_action_view_perms32",
        iconSVG: jatoIcons.actionLicenseKey
      }, {
        signature: "Download",
        name: lang.ToolbarItemDownload,
        iconName: "csui_action_download32",
        iconSVG: jatoIcons.actionDownload
      }, {
        signature: "ReserveDoc",
        name: publicLang.ToolbarItemReserve,
        iconName: "csui_action_reserve32",
        iconSVG: jatoIcons.actionLock
      }, {
        signature: "UnreserveDoc",
        name: publicLang.ToolbarItemUnreserve,
        iconName: "csui_action_unreserve32",
        iconSVG: jatoIcons.actionLockOpen
      }, {
        signature: "RequestReservation",
        name: lang.ToolbarItemRequestReservation,
        iconName: "csui_action_reserve32",
        iconSVG: jatoIcons.actionLock
      }, {
        signature: "UnrequestReservation",
        name: lang.ToolbarItemUnrequestReservation,
        iconName: "csui_action_unreserve32",
        iconSVG: jatoIcons.actionLockOpen
      }, {
        signature: "Copy",
        name: lang.ToolbarItemCopy,
        iconName: "csui_action_copy32",
        iconSVG: jatoIcons.actionCopy
      }, {
        signature: "Move",
        name: lang.ToolbarItemMove,
        iconName: "csui_action_move32",
        iconSVG: jatoIcons.actionMove
      }, {
        signature: "AddVersion",
        name: lang.ToolbarItemAddVersion,
        iconName: "csui_action_add_version32",
        iconSVG: jatoIcons.actionVersionAdd
      }, {
        signature: "Collect",
        name: lang.ToolbarCollect,
        iconName: "csui_action_collect32",
        iconSVG: jatoIcons.actionCollection
      }, {
        signature: "Delete",
        name: lang.ToolbarItemDelete,
        iconName: "csui_action_delete32",
        iconSVG: jatoIcons.actionDelete
      }, {
        signature: "ZipAndDownload",
        name: lang.MenuItemZipAndDownload,
        iconName: "csui_action_download32",
        iconSVG: jatoIcons.actionDownload
      } ]
    }, {
      maxItemsShown: 5,
      dropDownText: lang.ToolbarItemMore,
      dropDownIconName: "csui_action_more32",
      addGroupSeparators: false
    }),
    tabularInlineToolbar: new ToolItemsFactory({
      inspect: [ {
        signature: "Properties",
        name: lang.ToolbarItemInfo,
        commandData: {
          dialogView: true
        },
        iconName: "csui_action_properties32",
        iconSVG: jatoIcons.actionProperties
      } ],
      info: [],
      edit: [ {
        signature: "CopyLink",
        name: lang.ToolbarItemCopyLink,
        iconName: "csui_action_copy_link32",
        iconSVG: jatoIcons.actionLink
      }, {
        signature: "Edit",
        name: lang.ToolbarItemEdit,
        flyout: "edit",
        promoted: true,
        iconName: "csui_action_edit32",
        iconSVG: jatoIcons.actionEdit
      }, {
        signature: "EditWebDAV",
        name: "EditWebDAV",
        flyout: "edit"
      } ],
      share: [ {
        signature: "Share",
        name: lang.MenuItemShare,
        iconName: "csui_action_share32",
        iconSVG: jatoIcons.actionShare,
        flyout: "share"
      } ],
      other: [ {
        signature: "permissions",
        name: lang.ToolbarItemPermissions,
        iconName: "csui_action_view_perms32",
        iconSVG: jatoIcons.actionLicenseKey
      }, {
        signature: "Download",
        name: lang.ToolbarItemDownload,
        iconName: "csui_action_download32",
        iconSVG: jatoIcons.actionDownload
      }, {
        signature: "ReserveDoc",
        name: publicLang.ToolbarItemReserve,
        iconName: "csui_action_reserve32",
        iconSVG: jatoIcons.actionLock
      }, {
        signature: "UnreserveDoc",
        name: publicLang.ToolbarItemUnreserve,
        iconName: "csui_action_unreserve32",
        iconSVG: jatoIcons.actionLockOpen
      }, {
        signature: "RequestReservation",
        name: lang.ToolbarItemRequestReservation,
        iconName: "csui_action_reserve32",
        iconSVG: jatoIcons.actionLock
      }, {
        signature: "UnrequestReservation",
        name: lang.ToolbarItemUnrequestReservation,
        iconName: "csui_action_unreserve32",
        iconSVG: jatoIcons.actionLockOpen
      }, {
        signature: "Copy",
        name: lang.ToolbarItemCopy,
        iconName: "csui_action_copy32",
        iconSVG: jatoIcons.actionCopy
      }, {
        signature: "Move",
        name: lang.ToolbarItemMove,
        iconName: "csui_action_move32",
        iconSVG: jatoIcons.actionMove
      }, {
        signature: "AddVersion",
        name: lang.ToolbarItemAddVersion,
        iconName: "csui_action_add_version32",
        iconSVG: jatoIcons.actionVersionAdd
      }, {
        signature: "Collect",
        name: lang.ToolbarCollect,
        iconName: "csui_action_collect32",
        iconSVG: jatoIcons.actionCollection
      }, {
        signature: "Delete",
        name: lang.ToolbarItemDelete,
        iconName: "csui_action_delete32",
        iconSVG: jatoIcons.actionDelete
      }, {
        signature: "ZipAndDownload",
        name: lang.MenuItemZipAndDownload,
        iconName: "csui_action_download32",
        iconSVG: jatoIcons.actionDownload
      } ]
    }, {
      maxItemsShown: 5,
      dropDownText: lang.ToolbarItemMore,
      dropDownIconName: "csui_action_more32",
      addGroupSeparators: false
    }),
    versionToolItems: [ "properties", "open", "download", "delete" ]
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