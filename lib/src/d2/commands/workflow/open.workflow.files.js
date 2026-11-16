/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/models/command", "i18n!d2/commands/nls/localized.strings", "d2/commands/workflow/open.workflow" ], function(_, CommandModel, lang, CommandOpenWorkflow) {
  "use strict";
  return CommandOpenWorkflow.extend({
    defaults: {
      signature: "D2-OpenWorkflowFiles",
      command_key: "D2-OpenWorkflowFiles",
      name: lang.CommandNameOpenWorkflowFiles,
      scope: "single"
    },
    enabled: function(status, options) {
      var isEnabled = CommandOpenWorkflow.prototype.enabled.call(this, status, options);
      return isEnabled && CommandModel.prototype.enabled.call(this, status, options);
    },
    getWorkflow: function(status) {
      return status && (status.workflow || status.task);
    },
    getAdditionalContextParameters: function(workflow, status) {
      return {
        showDocumentsView: true,
        selectedNodeId: status.selectedNodeId,
        selectedFileTab: status.selectedFileTab,
        selectedMetaTab: status.selectedMetaTab
      };
    }
  });
});