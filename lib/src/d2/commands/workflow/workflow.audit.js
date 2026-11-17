/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/models/command", "d2/models/workflow/workflows", "i18n!d2/commands/nls/localized.strings", "d2/commands/workflow/open.workflow" ], function(_, CommandModel, WorkflowCollection, lang, CommandOpenWorkflow) {
  "use strict";
  return CommandOpenWorkflow.extend({
    defaults: {
      signature: "D2-WorkflowAudit",
      command_key: "D2-WorkflowAudit",
      name: lang.CommandNameWorkflowAudit,
      scope: "single"
    },
    enabled: function(status, options) {
      return CommandOpenWorkflow.prototype.enabled.call(this, status, options) && CommandModel.prototype.enabled.call(this, status, options);
    },
    getAdditionalContextParameters: function(workflow, status) {
      var collection = workflow.collection || status && status.collection;
      return {
        workflowWidgetName: collection instanceof WorkflowCollection && collection.options.widgetName,
        showAuditView: true
      };
    }
  });
});