/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "csui/models/command", "csui/utils/commonconfig.util" ], function(module, _, CommandModel, CommonConfig) {
  "use strict";
  const config = _.extend({
    enabled: CommonConfig.enableFeatureInSmartView() || false
  }, module.config());
  const TableSettingsColumnsCommand = CommandModel.extend({
    defaults: {
      signature: "TableSettingsColumns"
    },
    enabled: function(status) {
      if (!config.enabled) {
        return false;
      }
      if (!status.canCustomizeColumns) {
        return false;
      }
      return status.currentTableMode === "nowrap" || status.currentTableMode === "wrap";
    },
    execute: async function(status, options) {
      const nodesTableView = options.nodesTableView;
      nodesTableView.openColumnSettings();
    }
  });
  return TableSettingsColumnsCommand;
});