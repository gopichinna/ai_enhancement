/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/models/command", "csui/utils/commands/table.settings" ], function(require, CommandModel, TableSettingsCommand) {
  "use strict";
  const SwitchTableModeWrapCommand = CommandModel.extend({
    defaults: {
      signature: "TableModeWrap"
    },
    tableModeWrap: "wrap",
    enabled: function(status) {
      if (TableSettingsCommand.isEnabled) {
        return false;
      }
      if (!status.originatingView || !typeof status.originatingView.getTableMode === "function" || !typeof status.originatingView.setTableMode === "function") {
        return false;
      }
      return status.originatingView.getTableMode() !== this.tableModeWrap;
    },
    execute: function(status, options) {
      const nodesTableView = status.originatingView;
      nodesTableView.setTableMode(this.tableModeWrap).catch(error => {
        throw error;
      });
    }
  });
  return SwitchTableModeWrapCommand;
});