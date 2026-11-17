/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "d2/utils/server.query.utils", "i18n!d2/commands/nls/localized.strings" ], function(_, $, CommandModel, serverQueryUtils, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-NodeTree",
      name: lang.CommandNameNodeTree,
      scope: "single"
    },
    execute: false,
    enabled: function(status) {
      var enabled = false, collection = status.collection;
      if (collection && (!status.context || !status.context.isFolderBrowser)) {
        var widgetType = collection.widgetType, widgetName = collection.options && collection.options.widgetName;
        if (widgetType && widgetName) {
          var widgetConfig = serverQueryUtils.getWidgetConfig(widgetType, widgetName);
          if (widgetConfig.getParam("is_enable_tree_nav_smartview") === "true") {
            enabled = true;
          }
        }
      }
      return enabled;
    }
  });
});