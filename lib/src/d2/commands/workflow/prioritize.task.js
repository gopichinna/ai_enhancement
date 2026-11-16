/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/models/command", "csui/utils/commandhelper", "d2/models/workflow/workflow.audits", "d2/models/workflow/workflow.audit.task", "d2/utils/constants", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/models/workflow/task", "i18n!d2/commands/nls/localized.strings" ], function($, _, CommandModel, CommandHelper, WorkflowAuditCollection, WorkflowAuditTask, constants, RestLinkrels, utils, TaskModel, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-PrioritizeTask",
      command_key: "D2-PrioritizeTask",
      name: lang.CommandNamePrioritizeTask,
      scope: "single"
    },
    execute: function(status) {
      var taskPriority, deferred = $.Deferred(), me = this, node = CommandHelper.getJustOneNode(status), widgetConfig = {}, collection = status.collection || status.originatingView && status.originatingView.collection;
      if (!(node instanceof TaskModel || node instanceof WorkflowAuditTask)) {
        return $.Deferred().reject("Task Model or workflow audit entry model is required in order to set priority.").promise();
      }
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
      }
      if (status.data.priority) {
        taskPriority = parseInt(status.data.priority);
      }
      this._blockActions(status);
      me._setTaskPriority(node, taskPriority).done(function() {
        if (collection instanceof WorkflowAuditCollection) {
          collection.fetch({
            reload: true,
            reset: true
          }).always(function() {
            deferred.resolve();
          });
        } else {
          CommandHelper.refreshNode(node, widgetConfig).done(function() {
            node.trigger("d2:task:change:priority");
            deferred.resolve();
          }).fail(deferred.reject);
        }
      }).fail(function(xhr) {
        CommandHelper.showErrorPanel(node, _.str.sformat(lang.SetPriorityFailureMessage, node.get("name")), utils.parseAjaxErrorAsString(xhr));
        deferred.reject();
      }).always(function() {
        me._unblockActions(status);
      });
      return deferred.promise();
    },
    _setTaskPriority: function(task, taskPriority) {
      var url = CommandHelper.getOriginalActionLink(task, this.get("signature")), data = {
        properties: {
          priority: taskPriority
        }
      };
      return $.ajax(task.connector.extendAjaxOptions({
        url: url,
        type: "PATCH",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify(data)
      }));
    },
    _blockActions: function(status) {
      if (status && status.originatingView && status.originatingView.blockActions) {
        status.originatingView.blockActions();
      }
    },
    _unblockActions: function(status) {
      if (status && status.originatingView && status.originatingView.unblockActions) {
        status.originatingView.unblockActions();
      }
    }
  });
});