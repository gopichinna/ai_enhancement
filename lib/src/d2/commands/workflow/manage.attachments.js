/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "csui/models/command", "csui/utils/commandhelper", "d2/commands/workflow/open.task", "d2/commands/workflow/open.workflow", "d2/models/workflow/task", "d2/models/workflow/workflow", "d2/utils/constants" ], function(require, _, CommandModel, CommandHelper, OpenTaskCommand, OpenWorkflowCommand, TaskModel, WorkflowModel, constants) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-WorkflowManageAttachment",
      command_key: "D2-WorkflowManageAttachment",
      name: "",
      scope: "single"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status);
      return CommandModel.prototype.enabled.apply(this, arguments) && node && (node instanceof TaskModel || node instanceof WorkflowModel || node.get("type") === constants.Types.WORKFLOW);
    },
    execute: function(status, options) {
      options = options || {};
      var node = CommandHelper.getJustOneNode(status), openCommand = node instanceof TaskModel ? new OpenTaskCommand() : node instanceof WorkflowModel || node.get("type") === constants.Types.WORKFLOW ? new OpenWorkflowCommand() : null;
      openCommand && openCommand.execute(status, _.extend(options, {
        manageAttachments: true
      }));
    }
  });
});