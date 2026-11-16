/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings", "dctmw/utils/client.location", "d2/utils/widget.constants", "dctmw/utils/rest.resources" ], function(require, $, CommandModel, CommandHelper, lang, clientLocation, widgetConstants, RestResources) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-Locations",
      command_key: "D2-Locations",
      name: lang.CommandNameLocations,
      verb: lang.CommandVerbLocations,
      scope: "single"
    },
    enabled: function(status) {
      const D2CollectionModel = require("d2/models/d2collections/d2.mycollections.model");
      const model = CommandHelper.getJustOneNode(status);
      if (model instanceof D2CollectionModel === true) {
        return false;
      }
      const userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets");
      if (!userDefaultWidgets[widgetConstants.DEFAULT.LOCATIONS]) {
        return false;
      }
      return CommandModel.prototype.enabled.apply(this, arguments);
    },
    execute: function(status) {
      let node = CommandHelper.getJustOneNode(status);
      if (status.context.viewStateModel._currentHistoryEntry && status.context.viewStateModel._currentHistoryEntry.state) {
        status.context.viewStateModel._currentHistoryEntry.state.dropdown = "locations";
      }
      clientLocation.navigate(clientLocation.modularizeFragment(`#d2/nodes/${node.get("id")}/metadata/navigator?dropdown=locations`), {
        trigger: true,
        reload: true
      });
      return $.Deferred().resolve().promise();
    }
  });
});