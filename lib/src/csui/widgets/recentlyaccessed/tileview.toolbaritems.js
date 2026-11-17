/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitem.model", "csui/themes/csui.jato.action.icons", "csui-ext!csui/widgets/recentlyaccessed/tileview.toolbaritems" ], function(_, lang, ToolItemsFactory, TooItemModel, jatoIcons, extraToolItems) {
  "use strict";
  var toolbarItems = {
    inlineActionbar: new ToolItemsFactory({
      inspect: [ {
        signature: "Properties",
        name: lang.ToolbarItemInfo,
        commandData: {
          dialogView: true
        },
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
      share: [ {
        signature: "CopyLink",
        name: lang.ToolbarItemCopyLink,
        iconName: "csui_action_copy_link32",
        iconSVG: jatoIcons.actionLink
      } ],
      edit: [ {
        signature: "Edit",
        name: lang.ToolbarItemEdit,
        iconName: "csui_action_edit32",
        iconSVG: jatoIcons.actionEdit
      } ],
      other: [ {
        signature: "Download",
        name: lang.ToolbarItemDownload,
        iconName: "csui_action_download32",
        iconSVG: jatoIcons.actionDownload
      }, {
        signature: "goToLocation",
        name: lang.ToolbarGoToLocation
      } ]
    }, {
      maxItemsShown: 1,
      dropDownText: lang.ToolbarItemMore,
      dropDownIconName: "csui_action_more32",
      addGroupSeparators: false
    })
  };
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