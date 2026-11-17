/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/models/command", "csui/utils/commands/table.settings", "csui/utils/accessibility" ], function(require, CommandModel, TableSettingsCommand, Accessibility) {
  "use strict";
  const accessibleTable = Accessibility.isAccessibleTable();
  const SwitchTableModeThumbnailCommand = CommandModel.extend({
    defaults: {
      signature: "TableModeThumbnail"
    },
    tableModeThumbnail: "thumbnail",
    enabled: function(status) {
      if (accessibleTable) {
        const itemValue = status.toolItem.get("itemValue");
        if (itemValue === this.tableModeThumbnail) {
          return false;
        }
      }
      if (TableSettingsCommand.isEnabled) {
        return false;
      }
      const thumbnailToggleConfig = require.moduleConfig("csui/utils/commands/thumbnail.toggle");
      if (!thumbnailToggleConfig.enableGridView) {
        return false;
      }
      if (!status.originatingView || !(typeof status.originatingView.getTableMode === "function") || !(typeof status.originatingView.setTableMode === "function")) {
        return false;
      }
      return status.originatingView.getTableMode() !== this.tableModeThumbnail;
    },
    execute: function(status, options) {
      const nodesTableView = status.originatingView;
      nodesTableView.setTableMode(this.tableModeThumbnail).catch(error => {
        throw error;
      });
    }
  });
  return SwitchTableModeThumbnailCommand;
});