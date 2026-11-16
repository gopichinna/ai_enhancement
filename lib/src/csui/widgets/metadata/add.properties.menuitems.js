/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/base", "i18n!csui/widgets/metadata/impl/nls/lang", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitem.model", "csui-ext!csui/widgets/metadata/add.properties.menuitems", "csui-ext!csui/widgets/metadata/add.properties/toolbaritems" ], function(_, base, lang, ToolItemsFactory, TooItemModel, extraToolItems, oldExtraToolItems) {
  "use strict";
  var toolbarItems = {
    addPropertiesToolbar: new ToolItemsFactory({
      add: [ {
        signature: "AddCategory",
        name: lang.addNewCategory
      } ]
    }, {
      maxItemsShown: 0
    })
  };
  if (oldExtraToolItems) {
    addExtraToolItems(oldExtraToolItems);
  }
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