/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings", "dctmw/utils/client.location", "d2/utils/widget.constants", "dctmw/utils/rest.resources" ], function($, CommandModel, CommandHelper, lang, clientLocation, widgetConstants, RestResources) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-Renditions",
      command_key: "D2-Renditions",
      name: lang.CommandNameRenditions,
      verb: lang.CommandVerbRenditions,
      scope: "single"
    },
    enabled: function() {
      const userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets");
      if (!userDefaultWidgets[widgetConstants.DEFAULT.RENDITIONS]) {
        return false;
      }
      return CommandModel.prototype.enabled.apply(this, arguments);
    },
    execute: function(status) {
      let node = CommandHelper.getJustOneNode(status);
      clientLocation.navigate(clientLocation.modularizeFragment(`#d2/nodes/${node.get("id")}/metadata/navigator`), {
        trigger: true,
        reload: true
      });
      return $.Deferred().resolve().promise().done(() => {
        status.context.viewStateModel.set(status.context.viewStateModel.CONSTANTS.STATE, {
          dropdown: "renditions"
        });
      });
    }
  });
});