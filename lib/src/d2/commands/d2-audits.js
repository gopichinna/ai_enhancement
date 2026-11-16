/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings", "dctmw/utils/client.location", "d2/utils/widget.constants", "dctmw/utils/rest.resources" ], function(require, $, CommandModel, CommandHelper, lang, clientLocation, widgetConstants, RestResources) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-Audits",
      command_key: "D2-Audits",
      name: lang.CommandNameAudits,
      verb: lang.CommandVerbAudits,
      scope: "single"
    },
    enabled: function() {
      const userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets");
      if (!userDefaultWidgets[widgetConstants.DEFAULT.AUDIT]) {
        return false;
      }
      return CommandModel.prototype.enabled.apply(this, arguments);
    },
    execute: function(status) {
      let node = CommandHelper.getJustOneNode(status);
      clientLocation.navigate(clientLocation.modularizeFragment(`#d2/nodes/${node.get("id")}/metadata/navigator?dropdown=audits`), {
        trigger: true,
        reload: true
      });
      return $.Deferred().resolve().promise();
    }
  });
});