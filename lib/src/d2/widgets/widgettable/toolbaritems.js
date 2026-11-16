/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "csui/controls/toolbar/toolitems.factory", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "i18n!d2/commands/nls/localized.strings" ], function(module, _, ToolItemsFactory, lang, commandLang) {
  "use strict";
  return {
    leftToolbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-Back",
        name: commandLang.CommandNameBack,
        icon: "icon arrow_back csui-icon-go-previous-node csui-no-hover-effect"
      } ]
    }, {
      maxItemsShown: 2,
      dropDownIcon: "icon icon-toolbar-more",
      dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_more32",
      dropDownText: lang.ToolbarItemMore,
      addTrailingDivider: false
    }),
    rightToolbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-RefreshList",
        name: commandLang.CommandNameRefreshList,
        iconName: "csui_action_refresh32",
        enabled: true
      }, {
        signature: "D2-TableSettings",
        name: commandLang.CommandNameTableSettings,
        icon: "icon d2-icon-table-settings",
        manageVersions: false,
        allowTableModeChange: true
      } ]
    }, {
      hAlign: "right",
      maxItemsShown: 5,
      dropDownIcon: "icon icon-toolbar-more",
      dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_more32",
      dropDownText: lang.ToolbarItemMore,
      addTrailingDivider: false
    }),
    clone: function() {
      return ToolItemsFactory.cloneToolbarItems(this);
    }
  };
});