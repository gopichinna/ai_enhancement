/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings", "dctmw/utils/client.location", "d2/utils/widget.constants", "d2/utils/constants", "dctmw/utils/rest.resources" ], function(require, $, CommandModel, CommandHelper, lang, clientLocation, widgetConstants, constants, RestResources) {
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
      if (status.nodes && status.nodes.length === 1) {
        const model = CommandHelper.getJustOneNode(status);
        if (model.get("type") === constants.Types.COLLECTIONS) {
          return false;
        }
        const userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets");
        if (!userDefaultWidgets[widgetConstants.DEFAULT.LOCATIONS]) {
          return false;
        }
        return CommandModel.prototype.enabled.apply(this, arguments);
      }
      return false;
    },
    routeToPath: function(status, path) {
      if (status.context.viewStateModel._currentHistoryEntry && status.context.viewStateModel._currentHistoryEntry.state) {
        status.context.viewStateModel._currentHistoryEntry.state.dropdown = "locations";
        status.context.viewStateModel.setViewState("dropdown", "locations");
      }
      clientLocation.navigate(clientLocation.modularizeFragment(path), {
        trigger: true,
        reload: true
      });
    },
    execute: function(status) {
      const node = CommandHelper.getJustOneNode(status);
      const nodeLocationsPath = `#d2/nodes/${node.get("id")}/metadata/navigator?dropdown=locations`;
      this.routeToPath(status, nodeLocationsPath);
      return $.Deferred().resolve().promise();
    }
  });
});