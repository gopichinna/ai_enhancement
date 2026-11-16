/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/base", "csui/controls/toolbar/toolitems.factory", "i18n!csui/integration/folderbrowser/impl/nls/folderbrowser.manifest", "css!csui/integration/folderbrowser/impl/icons" ], function(_, base, ToolItemsFactory, FolderBrowseLang) {
  var toolbarItems = {
    leftToolbar: [ {
      signature: "Back",
      name: FolderBrowseLang.BackButtonToolItem,
      icon: "icon arrow_back csui-icon-go-previous-node csui-no-hover-effect"
    } ],
    rightToolbar: [ {
      signature: "Page",
      name: FolderBrowseLang.PageWidgetToolItem,
      icon: "icon csui-icon-open-full-page",
      group: "main",
      options: {
        hAlign: "right"
      }
    } ]
  };
  return toolbarItems;
});