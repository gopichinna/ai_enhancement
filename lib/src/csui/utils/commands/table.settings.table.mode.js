/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/models/command", "csui/utils/accessibility" ], function(require, CommandModel, Accessibility) {
  "use strict";
  const accessibleTable = Accessibility.isAccessibleTable();
  const TableSettingsTableModeCommand = CommandModel.extend({
    defaults: {
      signature: "TableSettingsTableMode"
    },
    enabled: function(status) {
      const thumbnailToggleConfig = require.moduleConfig("csui/utils/commands/thumbnail.toggle");
      const itemValue = status.toolItem.get("itemValue");
      switch (itemValue) {
       case "wrap":
        if (accessibleTable) {
          return false;
        }
        break;

       case "thumbnail":
        if (accessibleTable) {
          return false;
        }
        if (thumbnailToggleConfig.enableGridView === false) {
          return false;
        }
        break;
      }
      return true;
    },
    execute: async function(status, options) {
      const nodesTableView = options.nodesTableView;
      const tableMode = options.itemValue;
      await nodesTableView.setTableMode(tableMode);
      status.currentTableMode = tableMode;
    }
  });
  return TableSettingsTableModeCommand;
});