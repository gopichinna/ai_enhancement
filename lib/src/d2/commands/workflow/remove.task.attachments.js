/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/commandhelper", "nuc/utils/url", "d2/commands/node.progress.command", "d2/models/workflow/task", "d2/models/workflow/task.files", "d2/models/workflow/workflow", "d2/models/workflow/workflow.audit.task", "d2/models/workflow/workflow.audit.task.event", "d2/utils/constants", "d2/utils/rest.linkrels", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function(_, $, CommandHelper, Url, NodeProgressCommand, TaskModel, TaskFileCollection, WorkflowModel, WorkflowAuditTask, WorkflowAuditTaskEvent, constants, RestLinkrels, utils, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-WorkflowRemoveAttachment",
      command_key: "D2-WorkflowRemoveAttachment",
      name: "",
      scope: "multiple",
      resetToolbar: true
    },
    getTask: function(status) {
      var collection = status.collection, task = status.task || collection && collection.node;
      return task;
    },
    preProcess: function(status, options) {
      status.collection = status.collection || status.originatingView && status.originatingView.collection;
      var task = this.getTask(status, options);
      if (!(task instanceof TaskModel || task instanceof WorkflowModel)) {
        return $.Deferred().reject("Either Task or Workflow Model is required in order to remove an attachment.").promise();
      }
      var nodes = this._getNodesByScope(status, this.get("scope"));
      options = options || {};
      options.suppressProgress = true;
      options.hideSuccessMessage = true;
      return this._performRemoveAction(status, options, nodes);
    },
    doAction: function(node, options) {
      if (_.contains(options.successIds, node.get("id"))) {
        return $.Deferred().resolve().promise();
      } else {
        return $.Deferred().reject(options.errorMessages[node.get("id")] || " ").promise();
      }
    },
    handleResults: function(results, options) {
      this._unblockActions(options.originatingView);
      if (options.successIds.length && options.collection) {
        options.collection.remove(options.deletedNodes);
        options.collection.trigger("d2:task:attachments:removed", options.deletedNodes);
      }
    },
    _performRemoveAction: function(status, options, nodes) {
      var deferred = $.Deferred(), ids = nodes && _.map(nodes, function(node) {
        return node.get("id");
      });
      if (!(ids && ids.length)) {
        return $.Deferred().reject().promise();
      }
      this._blockActions(status.originatingView);
      var taskModel = this.getTask(status, options), url = CommandHelper.getOriginalActionLink(taskModel, "D2-WorkflowManageAttachment", RestLinkrels.D2_TASK_SUPPORTING_DOCUMENTS), qParams = {
        inline: true,
        links: true,
        "object-ids": ids
      };
      if (taskModel instanceof WorkflowModel || taskModel instanceof WorkflowAuditTask || taskModel instanceof WorkflowAuditTaskEvent) {
        qParams["wf-overview-widget-name"] = taskModel.connector.context.viewStateModel.getDefaultViewState("widget_name");
      }
      url = Url.appendQuery(url, Url.combineQueryString(qParams));
      $.ajax(taskModel.connector.extendAjaxOptions({
        url: url,
        type: "DELETE",
        contentType: constants.MediaTypes.DCTM_JSON,
        success: function(response) {
          var successIds = [], errorMessages = {}, deletedNodes = [];
          if (response && response.entries && response.entries.length) {
            _.each(response.entries, function(entry) {
              if (entry.content["rest-error"]) {
                errorMessages[entry.content["r_object_id"]] = entry.content["rest-error"].message;
              } else {
                successIds.push(entry.content["r_object_id"]);
                var deletedNode = _.find(nodes, function(node) {
                  return node.get("id") === entry.content["r_object_id"];
                });
                deletedNode && deletedNodes.push(deletedNode);
              }
            });
          }
          options.successIds = successIds;
          options.errorMessages = errorMessages;
          options.deletedNodes = deletedNodes;
          deferred.resolve();
        },
        error: _.bind(function(xhr, message, statusText) {
          this._unblockActions(status.originatingView);
          deferred.reject(utils.parseAjaxErrorAsString(xhr, statusText, message));
        }, this)
      }));
      return deferred.promise();
    },
    _blockActions: function(view) {
      view && _.isFunction(view.blockActions) && view.blockActions();
    },
    _unblockActions: function(view) {
      view && _.isFunction(view.unblockActions) && view.unblockActions();
    },
    getMessageOptions: function() {
      return {
        multiFileFailure: lang.RemoveTaskAttachmentManyItemsFailureMessage,
        multiFileOneFailure: lang.RemoveTaskAttachmentManyItemsOneFailureMessage,
        oneFileFailure: lang.RemoveTaskAttachmentOneItemFialureMessage,
        actionType: "REMOVE_TASK_ATTACHMENTS"
      };
    }
  });
});