/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "i18n!csui/controls/tabletoolbar/nls/localized.strings", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "i18n!csui/controls/tablesettings/impl/nls/lang", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitem.model", "csui/widgets/favorites/favorite.star.view", "csui/controls/versionsettings/version.settings.view", "csui/controls/tablesettings/table.settings.dropdown.view", "csui-ext!csui/widgets/nodestable/toolbaritems", "i18n" ], function(_, publicLang, lang, tableSettingsLang, ToolItemsFactory, TooItemModel, FavoriteStarView, VersionSettingsView, TableSettingsDropdownView, extraToolItems, i18n) {
  "use strict";
  var toolbarItems = {
    navigationToolbar: new ToolItemsFactory({
      backLink: [ {
        signature: "BackToLastFragment",
        name: lang.ToolbarItemGoBack,
        iconName: i18n && i18n.settings.rtl ? "csui_action_back_rtl32" : "csui_action_back32",
        toolItemAria: lang.ToolbarItemGoBack
      } ],
      main: [ {
        signature: "TreeBrowse",
        name: lang.ToolbarItemTreeBrowse,
        iconName: i18n && i18n.settings.rtl ? "csui_action_toggle_tree_rtl32" : "csui_action_toggle_tree32",
        toolItemAria: lang.ToolbarItemTreeBrowse,
        toolItemAriaExpand: false
      } ]
    }, {
      addGroupSeparators: false
    }),
    filterToolbar: new ToolItemsFactory({
      filter: [ {
        signature: "Filter",
        name: lang.ToolbarItemFilter,
        iconName: "csui_action_filter32",
        toolItemAria: lang.ToolbarItemFilterAria,
        toolItemAriaExpand: false,
        toolItemRole: "button"
      } ]
    }),
    addToolbar: new ToolItemsFactory({
      add: []
    }, {
      maxItemsShown: 0,
      dropDownIconName: "csui_action_add32",
      dropDownText: lang.ToolbarItemAddItem,
      addTrailingDivider: false
    }),
    leftToolbar: new ToolItemsFactory({
      main: [ {
        signature: "CollectionCanCollect",
        name: lang.ToolbarItemAddItem,
        iconName: "csui_action_add32"
      } ]
    }),
    tableHeaderToolbar: new ToolItemsFactory({
      inspect: [ {
        signature: "Properties",
        name: lang.ToolbarItemInfo,
        iconName: "csui_action_properties32"
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
        signature: "Shares",
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
      }, {
        signature: "Restructure",
        name: lang.ToolbarItemRestructure
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
    captionMenuToolbar: new ToolItemsFactory({
      inspect: [ {
        signature: "Properties",
        name: lang.MenuItemInformation
      } ],
      other: [ {
        signature: "CopyLink",
        name: lang.MenuItemCopyLink
      }, {
        signature: "EmailLink",
        name: lang.ToolbarItemEmailLinkShort
      }, {
        signature: "permissions",
        name: lang.ToolbarItemPermissions
      }, {
        signature: "Rename",
        name: lang.MenuItemRename
      }, {
        signature: "Copy",
        name: lang.MenuItemCopy
      }, {
        signature: "Move",
        name: lang.MenuItemMove
      }, {
        signature: "Delete",
        name: lang.MenuItemDelete
      }, {
        signature: "Collect",
        name: lang.ToolbarCollect
      } ]
    }, {
      maxItemsShown: 0,
      dropDownIconName: "csui_action_caret_down32",
      addGroupSeparators: false
    }),
    inlineActionbar: new ToolItemsFactory({
      inspect: [ {
        signature: "Properties",
        name: lang.ToolbarItemInfo,
        iconName: "csui_action_properties32"
      } ],
      info: [ {
        signature: "View",
        name: lang.ToolbarItemView,
        iconName: "csui_action_preview32",
        flyout: "view"
      } ],
      edit: [ {
        signature: "CopyLink",
        name: lang.ToolbarItemCopyLink,
        iconName: "csui_action_copy_link32"
      }, {
        signature: "Edit",
        name: lang.ToolbarItemEdit,
        flyout: "edit",
        promoted: true,
        iconName: "csui_action_edit32"
      }, {
        signature: "EditWebDAV",
        name: "EditWebDAV",
        flyout: "edit"
      } ],
      share: [ {
        signature: "Share",
        name: lang.MenuItemShare,
        iconName: "csui_action_share32",
        flyout: "share"
      }, {
        signature: "SendTo",
        name: lang.ToolbarItemSendTo,
        iconName: "csui_action_send_to32",
        flyout: "sendto"
      }, {
        signature: "EmailLink",
        name: lang.ToolbarItemEmailLink,
        flyout: "sendto"
      } ],
      other: [ {
        signature: "InlineEdit",
        name: lang.ToolbarItemRename,
        iconName: "csui_action_rename32"
      }, {
        signature: "permissions",
        name: lang.ToolbarItemPermissions,
        iconName: "csui_action_view_perms32"
      }, {
        signature: "Download",
        name: lang.ToolbarItemDownload,
        iconName: "csui_action_download32"
      }, {
        signature: "ReserveDoc",
        name: publicLang.ToolbarItemReserve,
        iconName: "csui_action_reserve32"
      }, {
        signature: "UnreserveDoc",
        name: publicLang.ToolbarItemUnreserve,
        iconName: "csui_action_unreserve32"
      }, {
        signature: "RequestReservation",
        name: lang.ToolbarItemRequestReservation,
        iconName: "csui_action_reserve32"
      }, {
        signature: "UnrequestReservation",
        name: lang.ToolbarItemUnrequestReservation,
        iconName: "csui_action_unreserve32"
      }, {
        signature: "Copy",
        name: lang.ToolbarItemCopy,
        iconName: "csui_action_copy32"
      }, {
        signature: "Move",
        name: lang.ToolbarItemMove,
        iconName: "csui_action_move32"
      }, {
        signature: "AddVersion",
        name: lang.ToolbarItemAddVersion,
        iconName: "csui_action_add_version32"
      }, {
        signature: "Collect",
        name: lang.ToolbarCollect,
        iconName: "csui_action_collect32"
      }, {
        signature: "Delete",
        name: lang.ToolbarItemDelete,
        iconName: "csui_action_delete32"
      }, {
        signature: "RemoveCollectedItems",
        name: lang.ToolbarItemRemoveCollectionItems,
        iconName: "csui_action_collection_delete32"
      }, {
        signature: "ZipAndDownload",
        name: lang.MenuItemZipAndDownload,
        iconName: "csui_action_download32"
      }, {
        signature: "Restructure",
        name: lang.ToolbarItemRestructure
      } ]
    }, {
      maxItemsShown: 5,
      dropDownText: lang.ToolbarItemMore,
      dropDownIconName: "csui_action_more32",
      addGroupSeparators: false
    }),
    tableSettingsToolbar: new ToolItemsFactory({
      tableMode: [ {
        signature: "TableSettingsTableMode",
        name: tableSettingsLang.tableModeLabelWrap,
        itemType: "menuradio",
        itemValue: "wrap",
        commandData: {
          statusAttributeForChecked: "currentTableMode"
        }
      }, {
        signature: "TableSettingsTableMode",
        name: tableSettingsLang.tableModeLabelNoWrap,
        itemType: "menuradio",
        itemValue: "nowrap",
        commandData: {
          statusAttributeForChecked: "currentTableMode"
        }
      }, {
        signature: "TableSettingsTableMode",
        name: tableSettingsLang.tableModeLabelThumbnail,
        itemType: "menuradio",
        itemValue: "thumbnail",
        commandData: {
          statusAttributeForChecked: "currentTableMode"
        }
      } ],
      columns: [ {
        signature: "TableSettingsColumns",
        name: tableSettingsLang.columnSettings,
        itemType: "menuitem"
      } ],
      description: [ {
        signature: "TableSettingsDescription",
        name: tableSettingsLang.toggleDescription,
        itemType: "menucheckbox",
        commandData: {
          statusAttributeForChecked: "showDescription"
        }
      } ]
    }, {
      addGroupSeparators: true
    }),
    rightToolbar: new ToolItemsFactory({
      main: [ {
        signature: "ToggleDescription",
        name: lang.ToolbarItemShowDescription,
        iconName: "csui_action_reveal_description32",
        commandData: {
          useContainer: true
        },
        toolItemRole: "button"
      }, {
        signature: "TableModeWrap",
        name: lang.ToolbarItemListView,
        iconName: "csui_action_switch_list32",
        commandData: {
          useContainer: true
        },
        title: lang.ListViewTitle
      }, {
        signature: "TableModeThumbnail",
        name: lang.ToolbarItemThumbnail,
        iconName: "csui_action_switch_thumb32",
        commandData: {
          useContainer: true
        },
        title: lang.ThumbnailTitle
      }, {
        signature: "Comment",
        name: lang.ToolbarItemComment,
        iconName: "esoc_no_comment32",
        iconNameForOn: "esoc_comment32",
        className: "esoc-socialactions-comment",
        customView: true,
        commandData: {
          useContainer: true
        }
      }, {
        signature: "VersionSettings",
        enabled: true,
        viewClass: VersionSettingsView,
        customView: true,
        commandData: {
          useContainer: true,
          viewOptions: {
            focusable: false
          }
        }
      }, {
        signature: "Favorite2",
        enabled: true,
        viewClass: FavoriteStarView,
        customView: true,
        commandData: {
          useContainer: true,
          viewOptions: {
            focusable: false
          }
        }
      }, {
        signature: "TableSettings",
        viewClass: TableSettingsDropdownView,
        customView: true,
        commandData: {
          useContainer: true,
          viewOptions: {
            focusable: false,
            customClickHandler: true
          }
        }
      }, {
        signature: "RestoreWidgetViewSize",
        name: lang.ToolbarItemRestoreWidgetViewSize,
        iconName: "csui_action_minimize32",
        commandData: {
          useContainer: true
        }
      }, {
        signature: "MaximizeWidgetView",
        name: lang.ToolbarItemMaximizeWidgetView,
        iconName: "csui_action_expand32",
        commandData: {
          useContainer: true
        }
      } ]
    }, {
      hAlign: "right",
      addTrailingDivider: false
    })
  };
  if (extraToolItems) {
    _.each(extraToolItems, function(moduleToolItems) {
      _.each(moduleToolItems, function(toolItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar && key === "otherToolbar") {
          targetToolbar = toolbarItems["tableHeaderToolbar"];
        }
        if (!targetToolbar) {
          throw new Error("Invalid target toolbar: " + key);
        }
        _.each(toolItems, function(toolItem) {
          toolItem = new TooItemModel(toolItem);
          if (toolItem.get("signature") === "ConwsNavigateUp") {
            const customIndex = targetToolbar.collection.findIndex(toolItem => toolItem.get("signature") === "BackToLastFragment") + 1;
            targetToolbar.addItem(toolItem, {
              index: customIndex ? customIndex : 0
            });
            return;
          }
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }
  toolbarItems.clone = function() {
    return ToolItemsFactory.cloneToolbarItems(this);
  };
  ToolItemsFactory.storeToolbarItemsSnapshots(toolbarItems);
  return toolbarItems;
});