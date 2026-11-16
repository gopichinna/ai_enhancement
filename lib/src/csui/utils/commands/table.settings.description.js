/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "csui/models/command", "csui/utils/accessibility" ], function(module, _, CommandModel, Accessibility) {
  "use strict";
  const config = _.extend({
    enabled: true
  }, module.config());
  const accessibleTable = Accessibility.isAccessibleTable();
  const TableSettingsSetDescriptionShownCommand = CommandModel.extend({
    defaults: {
      signature: "TableSettingsDescription"
    },
    enabled: function(status) {
      if (!config.enabled) {
        return false;
      }
      return !accessibleTable && status.currentTableMode === "wrap";
    },
    execute: async function(status, options) {
      const nodesTableView = options.nodesTableView;
      await nodesTableView.setDescriptionShown(options.checked);
      status.showDescription = nodesTableView.getDescriptionShown();
    }
  });
  return TableSettingsSetDescriptionShownCommand;
});