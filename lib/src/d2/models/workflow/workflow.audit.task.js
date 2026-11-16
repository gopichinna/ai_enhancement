/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/models/workflow/task", "d2/models/workflow/workflow.audit.task.events", "d2/utils/constants", "i18n!d2/widgets/workflow.timeline/impl/nls/lang" ], function(_, TaskModel, WorkflowAuditTaskEventCollection, constants, timelineLang) {
  "use strict";
  var WorkflowAuditTask = TaskModel.extend({
    constructor: function WorkflowAuditTask(attr, options) {
      WorkflowAuditTask.__super__.constructor.call(this, attr, options);
      var auditEvents = this.collection && _.isArray(this.collection.allAuditEvents) && this.collection.allAuditEvents[this.get("workitem_id") || this.get("id")];
      if (auditEvents) {
        this.auditEvents = auditEvents;
        this.auditEvents.node = this;
        if (this.auditEvents.isExpanded) {
          this.auditEvents.fetch({
            reload: true,
            reset: true
          });
        } else {
          this.auditEvents.fetched = false;
        }
      } else {
        this.auditEvents = new WorkflowAuditTaskEventCollection(undefined, _.extend({}, options, {
          node: this,
          parentTreeNode: this
        }));
      }
      this.applyCombinedTaskState = options.applyCombinedTaskState;
      this.treeChildNodes = this.auditEvents;
      this.parentTreeNode = options.parentTreeNode;
      this.hasTreeChildNodes = attr.properties && attr.properties.has_events;
    },
    parse: function(response, options) {
      var props = WorkflowAuditTask.__super__.parse.apply(this, arguments);
      if (props["activity_type"] === constants.WorkflowActivityType.AUTOMATIC) {
        props.performer_type = constants.WorkflowAuditPerformerType.SYSTEM;
        if (props["task_state"] === "acquired and halted" || props["task_state"] === "Apaused") {
          props["task_state"] = constants.WorkflowTaskState.FAULTED;
        }
        if (props["task_state"] === "rerun_initiated") {
          props["task_state"] = constants.WorkflowTaskState.RUNNING;
        }
      } else if (_.contains([ "Some users from a group", "All members in a group" ], props.performer_type)) {
        props.performer_type = constants.WorkflowAuditPerformerType.GROUP;
      } else {
        props.performer_type = constants.WorkflowAuditPerformerType.USER;
      }
      if (!props["name"]) {
        var attrs = response.properties || response;
        props["name"] = attrs["task_subject"] || attrs["task_name"];
      }
      if (props["task_state"] === constants.WorkflowTaskState.FUTURE) {
        props["assignee"] = (props["performer_names"] || []).join(",");
        props["wf_sv_disable_notes"] = props["wf_sv_disable_supporting_files"] = props["wf_sv_disable_working_files"] = true;
      }
      var wfState = options.node && options.node.get("d2_workflow_state"), applyCombinedState = options.applyCombinedTaskState && (wfState === constants.WorkflowState.ABORTED && !_.includes([ constants.WorkflowTaskState.FINISHED, constants.WorkflowTaskState.FAULTED ], props["task_state"]));
      applyCombinedState && (props["task_state"] = props["task_state"] + wfState);
      if (props["is_digital_signature_awaiting_task"]) {
        props["assignee"] = timelineLang.performerSignature;
        props["performer_type"] = constants.WorkflowAuditPerformerType.SIGNATURE;
        props["activity_type"] = constants.WorkflowActivityType.AUTOMATIC;
        if (props["task_state"] === "pending") {
          props["task_state"] = "running";
        }
      }
      return props;
    },
    set: function(key, val, options) {
      var attrs;
      if (key == null) {
        return this;
      }
      if (typeof key === "object") {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }
      if (attrs.audit_events) {
        this._setCollectionProperty("audit_events", WorkflowAuditTaskEventCollection, attrs, options);
      }
      return WorkflowAuditTask.__super__.set.apply(this, arguments);
    }
  });
  return WorkflowAuditTask;
});