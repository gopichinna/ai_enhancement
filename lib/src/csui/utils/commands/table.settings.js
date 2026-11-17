/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "csui/models/command" ], function(module, _, CommandModel) {
  "use strict";
  const config = module.config();
  _.defaults(config, {
    enabled: false
  });
  const TableSettingsCommand = CommandModel.extend({
    defaults: {
      signature: "TableSettings"
    },
    enabled: function(status) {
      return config.enabled && status.originatingView && typeof status.originatingView.getTableMode === "function" && typeof status.originatingView.setTableMode === "function";
    }
  });
  TableSettingsCommand.isEnabled = config.enabled;
  return TableSettingsCommand;
});