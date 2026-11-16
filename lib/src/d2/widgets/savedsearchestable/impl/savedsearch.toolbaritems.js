/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitem.model", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "i18n!d2/commands/nls/localized.strings", "csui-ext!d2/widgets/savedsearchtable/savedsearch.toolbaritems" ], function(_, ToolItemsFactory, ToolItemModel, csuiLang, lang, extraToolItems) {
  "use strict";
  var toolbarOptions = {
    maxItemsShown: 5,
    addGroupSeparators: true,
    dropDownText: lang.ToolbarItemMore,
    dropDownIconName: "csui_action_more32"
  };
  var toolbarItems = {
    inlineActionbar: new ToolItemsFactory({
      main: []
    }, _.deepClone(toolbarOptions)),
    tableHeaderToolbar: new ToolItemsFactory({
      main: []
    }, _.deepClone(toolbarOptions)),
    headerMenuToolbar: new ToolItemsFactory({
      main: []
    }, {
      maxItemsShown: 2
    }),
    rightToolbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-RefreshList",
        name: lang.CommandNameRefreshList,
        iconName: "csui_action_refresh32",
        enabled: true,
        suppressFailMessage: true
      } ]
    }, {
      maxItemsShown: 2
    }),
    clone: function() {
      return ToolItemsFactory.cloneToolbarItems(this);
    }
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
          toolItem = new ToolItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }
  return toolbarItems;
});