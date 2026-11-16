/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "i18n!d2/widgets/metadata/panels/renditions/impl/nls/lang", "csui/controls/toolbar/toolitems.factory" ], function(_, lang, ToolItemsFactory) {
  var toolbarItems = {
    tableHeaderToolbar: new ToolItemsFactory({
      main: [ {
        signature: "Download",
        name: lang.ToolbarItemRenditionDownload
      }, {
        signature: "D2-RenditionDelete",
        name: lang.ToolbarItemRenditionDelete
      } ]
    }, {
      maxItemsShown: 5,
      dropDownIconName: "csui_action_more32"
    })
  };
  return toolbarItems;
});