/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/models/nodes", "csui/utils/commandhelper", "d2/commands/workflow/add.task.attachments", "d2/commands/workflow/manage.attachments", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings", "d2/models/workflow/task", "d2/models/workflow/workflow" ], function(_, $, NodeCollection, CommandHelper, CommandAddTaskAttachments, CommandManageAttachments, utils, lang, TaskModel, WorkflowModel) {
  "use strict";
  var cmdManageAttachments = new CommandManageAttachments();
  var AddFileRelationsAsAttachments = CommandAddTaskAttachments.extend({
    defaults: {
      signature: "D2-WorkflowAddFileRelationsAsAttachments",
      command_key: "D2-WorkflowAddFileRelationsAsAttachments",
      name: lang.CommandNameAddFileRelationsAsAttachments,
      scope: "multi"
    },
    getContainerNode: function(status) {
      if (utils.isMobile()) {
        return status.collection.options.taskModel;
      } else {
        return status.container || status.originatingView && status.originatingView.container;
      }
    },
    enabled: function(status, options) {
      var node = this.getContainerNode(status, options);
      if (node instanceof TaskModel || node instanceof WorkflowModel) {
        var newStatus = _.defaults({
          nodes: new NodeCollection([ node ])
        }, status);
        return cmdManageAttachments.enabled(newStatus, options);
      }
      return false;
    },
    preProcess: function(status, options) {
      status.targetNodes = this._getNodesByScope(status, this.get("scope"));
      status.nodes = new NodeCollection([ this.getContainerNode(status, options) ]);
      return CommandAddTaskAttachments.prototype.preProcess.apply(this, arguments);
    }
  });
  return AddFileRelationsAsAttachments;
});