/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitem.model", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "i18n!d2/commands/nls/localized.strings" ], function(_, ToolItemsFactory, ToolItemModel, csuiLang, lang) {
  "use strict";
  var toolbarOptions = {
    maxItemsShown: 5,
    addGroupSeparators: true,
    dropDownText: lang.ToolbarItemMore,
    dropDownIconName: "csui_action_more32"
  };
  var collectionToolbarOptions = {
    maxItemsShown: 5,
    addGroupSeparators: true,
    dropDownText: lang.ToolbarItemMore,
    dropDownIconName: "csui_action_more32"
  };
  var toolbarItems = {
    inlineActionbar: new ToolItemsFactory({
      preview: [ {
        signature: "DocPreview",
        name: csuiLang.ToolbarItemDocPreview,
        iconName: "csui_action_preview32",
        promoted: true
      } ],
      main: []
    }, _.deepClone(toolbarOptions)),
    tableHeaderToolbar: new ToolItemsFactory({
      main: []
    }, _.deepClone(toolbarOptions)),
    collectionsInlineActionBar: new ToolItemsFactory({
      main: []
    }, _.deepClone(collectionToolbarOptions)),
    headerMenuToolbar: new ToolItemsFactory({
      main: []
    }, {
      maxItemsShown: 2
    }),
    leftToolbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-Back",
        name: lang.CommandNameBack,
        icon: "icon arrow_back csui-icon-go-previous-node csui-no-hover-effect"
      }, {
        signature: "D2-split-view",
        name: lang.CommandNameSplit,
        icon: "icon left_panel_open",
        enabled: true
      }, {
        signature: "Filter",
        name: lang.ToolbarItemFilter,
        iconName: "d2_action_filter_active",
        toolItemAria: lang.ToolbarItemFilterAria,
        toolItemAriaExpand: false
      } ]
    }, {
      maxItemsShown: 3,
      dropDownIcon: "icon icon-toolbar-more",
      dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_more32",
      dropDownText: lang.ToolbarItemMore,
      addTrailingDivider: false
    }),
    rightToolbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-RefreshList",
        name: lang.CommandNameRefreshList,
        iconName: "csui_action_refresh32",
        enabled: true,
        suppressFailMessage: true
      }, {
        signature: "D2-TableSettings",
        name: lang.CommandNameTableSettings,
        iconName: "d2_action_settings",
        enabled: true,
        manageVersions: false,
        allowTableModeChange: true,
        useAdditionalViewContainer: true
      } ]
    }, {
      maxItemsShown: 2
    }),
    clone: function() {
      return ToolItemsFactory.cloneToolbarItems(this);
    }
  };
  return toolbarItems;
});