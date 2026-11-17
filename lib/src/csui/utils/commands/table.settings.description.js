/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "csui/lib/backbone", "csui/models/command", "csui/utils/accessibility" ], function(module, _, Backbone, CommandModel, Accessibility) {
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
      if (accessibleTable) {
        return false;
      }
      if (status.currentTableMode !== "wrap") {
        return false;
      }
      if (!status.collection) {
        return false;
      }
      if (!(status.collection instanceof Backbone.Collection)) {
        return false;
      }
      const nodeWithDescription = status.collection.find(function(node) {
        const description = node.get("description");
        return !!description;
      });
      return nodeWithDescription !== undefined;
    },
    execute: async function(status, options) {
      const nodesTableView = options.nodesTableView;
      await nodesTableView.setDescriptionShown(options.checked);
      status.showDescription = nodesTableView.getDescriptionShown();
    }
  });
  return TableSettingsSetDescriptionShownCommand;
});