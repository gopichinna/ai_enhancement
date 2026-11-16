/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "i18n!d2/widgets/metadata/panels/audit/impl/nls/lang", "csui/controls/toolbar/toolitems.factory" ], function(_, lang, ToolItemsFactory) {
  var toolbarItems = {
    tableHeaderToolbar: new ToolItemsFactory(),
    dropdownMenuList: new ToolItemsFactory(),
    inlineActionbar: new ToolItemsFactory(),
    rightToolbar: new ToolItemsFactory({
      main: [ {
        signature: "D2-RefreshList",
        name: "lang.CommandNameRefreshList",
        iconName: "csui_action_refresh32",
        enabled: true,
        suppressFailMessage: true
      } ]
    })
  };
  return toolbarItems;
});