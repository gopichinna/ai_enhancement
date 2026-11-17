/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings", "dctmw/utils/client.location" ], function(require, $, CommandModel, CommandHelper, lang, clientLocation) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-TaskDocumentVersions",
      command_key: "D2-TaskDocumentVersions",
      name: lang.CommandNameLocations,
      verb: lang.CommandVerbLocations,
      scope: "single"
    },
    enabled: function(_status) {
      let node = CommandHelper.getJustOneNode(_status);
      if (node.get("vdm-number") && node.get("vdm-number") > 0) {
        return false;
      } else {
        return true;
      }
    },
    routeToPath: function(status, path, dropdown) {
      if (status.context.viewStateModel._currentHistoryEntry && status.context.viewStateModel._currentHistoryEntry.state) {
        status.context.viewStateModel._currentHistoryEntry.state.dropdown = dropdown;
      }
      clientLocation.navigate(clientLocation.modularizeFragment(path), {
        trigger: true,
        reload: true
      });
    },
    execute: function(status) {
      let task = status.task;
      if (task) {
        let node = CommandHelper.getJustOneNode(status);
        status.context.viewStateModel.set("selectedNode", node);
        status.context.viewStateModel.setDefaultViewState("nodeId", node.get("id"));
        const workingFileVersionsPath = `#d2/tasks/${task.get("id")}/docs?dropdown=groupedVersions`;
        this.routeToPath(status, workingFileVersionsPath, "groupedVersions");
      }
      return $.Deferred().resolve().promise();
    }
  });
});