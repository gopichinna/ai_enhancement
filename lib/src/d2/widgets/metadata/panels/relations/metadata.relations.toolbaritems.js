/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "i18n!d2/widgets/metadata/panels/relations/impl/nls/lang", "csui/controls/toolbar/toolitems.factory" ], function(_, lang, ToolItemsFactory) {
  var toolbarItems = {
    tableHeaderToolbar: new ToolItemsFactory(),
    inlineActionbar: new ToolItemsFactory()
  };
  return toolbarItems;
});