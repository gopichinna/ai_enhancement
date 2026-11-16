/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "i18n!csui/utils/commands/recycle.bin/nls/lang", "csui/models/command" ], function(require, _, $, Backbone, lang, CommandModel) {
  "use strict";
  const routerURL = "recycleitems";
  const RecycleBin = CommandModel.extend({
    defaults: {
      signature: "RecycleBin",
      name: lang.RecycleBin
    },
    enabled: function(status, options) {
      const RecycleBinVolumeFactory = require("csui/utils/contexts/factories/recycle.bin");
      const StartPageConfig = require.moduleConfig("csui/pages/start/start.page.view");
      return !StartPageConfig.enableHamburger && status.context.getModel(RecycleBinVolumeFactory).get("isEnabled");
    },
    execute: function(status, options) {
      const deferred = $.Deferred();
      if (status.context._applicationScope.get("id") === "recycleitems") {
        status.context._factories.recycleitems.property.fetch();
      }
      Backbone.history.navigate(routerURL, {
        trigger: true
      });
      return deferred.resolve({});
    }
  });
  return RecycleBin;
});