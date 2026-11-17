/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitem.model", "csui/widgets/favorites/favorite.star.view", "i18n!d2/commands/nls/localized.strings", "csui-ext!d2/utils/vdoc.toolbaritems" ], function(_, ToolItemsFactory, TooItemModel, FavoriteStarView, lang, extraToolItems) {
  "use strict";
  var toolbarItems = {
    headerToolbar: new ToolItemsFactory({
      main: []
    }, {
      maxItemsShown: 15,
      dropDownIconName: "csui_action_more32",
      lazyActions: true
    }),
    inlineActionbar: new ToolItemsFactory({
      main: []
    }, {
      maxItemsShown: 0,
      dropDownIconName: "csui_action_more32",
      lazyActions: true
    }),
    editVDInlineActionbar: new ToolItemsFactory({
      main: []
    }, {
      maxItemsShown: 0,
      dropDownIconName: "csui_action_more32",
      lazyActions: true
    }),
    metadataDropdown: new ToolItemsFactory({
      main: []
    }, {
      maxItemsShown: 0,
      dropDownIcon: "icon icon-expandArrowDown",
      lazyActions: true
    }),
    metadataRightBar: new ToolItemsFactory({
      main: []
    }, {
      maxItemsShown: 3
    }),
    tableViewHeaderToolbar: new ToolItemsFactory({
      main: []
    }, {
      maxItemsShown: 15,
      dropDownIconName: "csui_action_more32",
      lazyActions: true
    }),
    tableViewInlineActionBar: new ToolItemsFactory({
      main: []
    }, {
      maxItemsShown: 5,
      dropDownIconName: "csui_action_more32",
      lazyActions: true
    }),
    tableviewRightBar: new ToolItemsFactory({
      main: [ {
        signature: "D2-TableSettings",
        name: lang.CommandNameTableSettings,
        iconName: "d2_action_settings",
        enabled: true,
        allowTableModeChange: true,
        manageWorkflowStatus: true,
        useAdditionalViewContainer: true
      }, {
        signature: "D2-TableViewClose",
        name: lang.CommandVDocTableViewClose,
        iconName: "d2_action_panel_close",
        className: "vdoc-close-panel-icon",
        enabled: true
      } ]
    }, {
      maxItemsShown: 2
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