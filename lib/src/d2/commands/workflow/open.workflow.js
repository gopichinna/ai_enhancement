/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings", "d2/models/workflow/workflow", "d2/models/workflow/workflows", "d2/utils/constants", "d2/utils/widget.constants" ], function(require, _, $, CommandModel, CommandHelper, lang, WorkflowModel, WorkflowCollection, constants, widgetConstants) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-OpenWorkflow",
      command_key: "D2-OpenWorkflow",
      name: lang.CommandNameOpenWorkflow,
      scope: "single"
    },
    enabled: function(status, options) {
      var node = this.getWorkflow(status, options);
      return node instanceof WorkflowModel || node && node.get("type") === constants.Types.WORKFLOW;
    },
    getWorkflow: function(status) {
      return CommandHelper.getJustOneNode(status) || status.nodes && status.nodes.at(0);
    },
    execute: function(status, options) {
      var deferred = $.Deferred(), me = this;
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      require([ "d2/utils/contexts/factories/next.workflow" ], function(NextWorkflowModelFactory) {
        var context = status.context || options && options.context, nextWorkflow = context.getModel(NextWorkflowModelFactory), workflow = me.getWorkflow(status, options), collection = workflow.collection || status && status.collection, workflowInfo = {
          id: workflow.get("id"),
          setContextToAdminMode: collection.widgetType === widgetConstants.D2.ADMIN_WORKFLOWS,
          setContextToAllWorkflows: collection && collection.workflowsReportingType === constants.WorkflowsReportingType.ALL || workflow.get("rObjectType") === "d2c_workflow_tracker" || workflow.get("r_object_type") === "d2c_workflow_tracker",
          replaceLastUrl: options && options.replaceLastUrl === true,
          workflowWidgetName: collection.widgetName
        };
        _.defaults(workflowInfo, me.getAdditionalContextParameters(workflow, status, options));
        if (workflow.get("rObjectType") === "d2c_workflow_tracker" || workflow.get("r_object_type") === "d2c_workflow_tracker") {
          var qParamData = JSON.stringify({
            "wf-states": [ constants.WorkflowState.SCHEDULED, constants.WorkflowState.PAUSED, constants.WorkflowState.RUNNING ]
          });
          context && context.viewStateModel.setViewState("widget_name", "", {
            silent: true
          });
          context && context.viewStateModel.setDefaultViewState("widget_name", "", {
            silent: true
          });
          context && context.viewStateModel.setViewState("qform-param", qParamData, {
            encode: true
          });
        }
        nextWorkflow.set("workflow_info", workflowInfo);
        deferred.resolve(status, options);
      }, deferred.reject);
      return deferred.promise();
    },
    getAdditionalContextParameters: function(workflow, status, options) {
      var collection = workflow.collection || status && status.collection;
      return collection instanceof WorkflowCollection ? {
        orderBy: collection.orderBy,
        filter: _.deepClone(collection.filters),
        top: collection.topCount,
        skip: collection.skipCount,
        hasMoreRecords: collection.hasMoreRecords,
        hadMoreRecords: collection.hadMoreRecords,
        manageAttachments: options && options.manageAttachments
      } : {
        manageAttachments: options && options.manageAttachments
      };
    }
  });
});