/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/utils/url", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/progressblocker/blocker", "csui/widgets/metadata/metadata.view", "d2/models/workflow/workflow.audit.task", "d2/models/workflow/task", "d2/models/workflow/workflow.audit.task.event", "d2/utils/constants", "d2/utils/rest.linkrels", "d2/utils/task.utils", "i18n!d2/widgets/workflow.details/impl/nls/lang", "hbs!d2/widgets/workflow.details/impl/empty.task.details", "hbs!d2/widgets/workflow.details/impl/task.details.tab", "css!d2/widgets/workflow.details/impl/task.details.tab" ], function(_, $, Marionette, Url, LayoutViewEventsPropagationMixin, BlockingView, CSMetadataView, WorkflowAuditTask, TaskModel, WorkflowAuditTaskEvent, constants, RestLinkrels, TaskUtils, lang, EmptyTaskDetailsTemplate, template) {
  "use strict";
  var TaskDetailsTabEmptyView = Marionette.ItemView.extend({
    className: function() {
      if (this.options.showErrorView) {
        return "d2-empty-task-details error-view";
      } else {
        return "d2-empty-task-details";
      }
    },
    ui: {
      tryAgainBtn: ".try-again-task-details-btn"
    },
    triggers: {
      "click @ui.tryAgainBtn": "try:again:clicked"
    },
    template: EmptyTaskDetailsTemplate,
    templateHelpers: function() {
      return {
        text: this.options.showErrorView ? lang.taskDetailsErrorFetchingDataText : lang.taskDetailsTabNoDetailsText,
        isErrorView: this.options.showErrorView ? this.options.showErrorView : false,
        tryAgain: lang.tryAgainBtnText
      };
    },
    constructor: function TaskNoteEmptyView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  var TaskDetailsTabMetadataView = CSMetadataView.extend({
    constructor: function(options) {
      this.options = {
        model: options.node ? options.node : "",
        originatingView: options.originatingView ? options.originatingView : "",
        context: options.context ? options.context : ""
      };
      this.userData = options.userData ? options.userData : {};
      CSMetadataView.prototype.constructor.call(this, this.options);
    },
    onRender: function() {
      CSMetadataView.prototype.onRender.apply(this, arguments);
    },
    onBeforeDestroy: function() {
      CSMetadataView.prototype.onBeforeDestroy.apply(this, arguments);
    }
  });
  var TaskDetailsTabView = Marionette.LayoutView.extend({
    className: "d2-wf-task-details-tab",
    template: template,
    regions: {
      rgnContent: "> .d2-wf-task-details-tab-content"
    },
    constructor: function TaskDetailsTabView(options) {
      this.options = options || {};
      Marionette.LayoutView.prototype.constructor.call(this, this.options);
      this.propagateEventsToRegions();
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
    },
    onShow: function() {
      if (this.options.node.get("task_state") === constants.WorkflowTaskState.FUTURE) {
        this.rgnContent.show(new TaskDetailsTabEmptyView());
      } else {
        this.blockActions();
        this.fetchTaskDetails().done(function() {
          if (!this.options.node.get("userData")) {
            TaskUtils.resolveUserDetails(this.options.node, [ "sent_by", "supervisor_name", "assignee", "delegated_to" ]).always(function() {
              this.options["userData"] = this.options.node.get("userData");
              this.rgnContent.show(new TaskDetailsTabMetadataView(this.options));
              this.unblockActions();
            }.bind(this));
          } else {
            this.options["userData"] = this.options.node.get("userData");
            this.rgnContent.show(new TaskDetailsTabMetadataView(this.options));
            this.unblockActions();
          }
        }.bind(this)).fail(function() {
          this.emptyErrorView = new TaskDetailsTabEmptyView({
            showErrorView: true
          });
          this.rgnContent.show(this.emptyErrorView);
          this.listenTo(this.emptyErrorView, "try:again:clicked", function() {
            this.rgnContent && this.rgnContent.reset().destroy();
            this.onShow();
          });
          this.unblockActions();
        }.bind(this));
      }
    },
    getTaskDetails: function(node, model) {
      var wfTaskDetailsUrl = RestLinkrels.getLink(node.get("links"), RestLinkrels.SELF), dfd = $.Deferred(), qParams = {
        inline: true
      };
      if (node.collection && node.collection.widgetName) {
        qParams["wf-overview-widget-name"] = node.collection.widgetName;
      }
      wfTaskDetailsUrl = Url.appendQuery(wfTaskDetailsUrl, Url.combineQueryString(qParams));
      $.ajax(node.connector.extendAjaxOptions({
        url: wfTaskDetailsUrl,
        success: function(response) {
          if (response.properties) {
            var isSignatureTask = node.get("is_digital_signature_awaiting_task");
            model.set(isSignatureTask ? {
              supervisor_name: response.properties.supervisor_name,
              assignee: response.properties.assignee,
              task_instructions: response.properties.task_instructions
            } : {
              d2_task_priority: response.properties.priority || model.get("d2_task_priority"),
              sent_by: response.properties.sent_by,
              supervisor_name: response.properties.supervisor_name,
              assignee: response.properties.assignee,
              task_instructions: response.properties.task_instructions
            });
            if (node instanceof WorkflowAuditTask) {
              node.set(isSignatureTask ? {
                supervisor_name: response.properties.supervisor_name,
                assignee: response.properties.assignee,
                task_instructions: response.properties.task_instructions
              } : {
                d2_task_priority: response.properties.priority || model.get("d2_task_priority"),
                sent_by: response.properties.sent_by,
                supervisor_name: response.properties.supervisor_name,
                assignee: response.properties.assignee,
                task_instructions: response.properties.task_instructions
              });
            }
            if (node instanceof WorkflowAuditTask || node instanceof TaskModel) {
              node.set({
                packages: response.packages
              });
            }
            dfd.resolve();
          }
        }.bind(this),
        error: function() {
          dfd.reject();
        }.bind(this)
      }));
      return dfd.promise();
    },
    fetchTaskDetails: function() {
      var dfd = $.Deferred(), node = this.options.node instanceof WorkflowAuditTaskEvent ? this.options.node.collection && this.options.node.collection.node : this.options.node, model = this.options.node;
      if (model.get("activity_type") === constants.WorkflowActivityType.AUTOMATIC && (_.isUndefined(model.get("supervisor_name")) || _.isUndefined(model.get("assignee")))) {
        if (node instanceof WorkflowAuditTask && !(_.isUndefined(node.get("supervisor_name")) || _.isUndefined(node.get("assignee")))) {
          model.set({
            supervisor_name: node.get("supervisor_name"),
            assignee: node.get("assignee")
          });
          return dfd.resolve();
        }
        this.getTaskDetails(node, model).done(function() {
          dfd.resolve();
        }.bind(this)).fail(function() {
          dfd.reject();
        }.bind(this));
      } else if (model.get("activity_type") !== constants.WorkflowActivityType.AUTOMATIC && (_.isUndefined(model.get("d2_task_priority")) || _.isUndefined(model.get("sent_by")) || _.isUndefined(model.get("supervisor_name")) || _.isUndefined(model.get("assignee")) || _.isUndefined(model.get("task_instructions")))) {
        if (node instanceof WorkflowAuditTask && !(_.isUndefined(node.get("d2_task_priority")) || _.isUndefined(node.get("sent_by")) || _.isUndefined(node.get("supervisor_name")) || _.isUndefined(node.get("assignee")) || _.isUndefined(node.get("task_instructions")))) {
          model.set({
            d2_task_priority: node.get("d2_task_priority"),
            sent_by: node.get("sent_by"),
            supervisor_name: node.get("supervisor_name"),
            assignee: node.get("assignee"),
            task_instructions: node.get("task_instructions")
          });
          return dfd.resolve();
        }
        this.getTaskDetails(node, model).done(function() {
          dfd.resolve();
        }.bind(this)).fail(function() {
          dfd.reject();
        }.bind(this));
      } else {
        model.set({
          assignee: node.get("assignee")
        });
        dfd.resolve();
      }
      return dfd.promise();
    }
  }, {
    enabled: function(options) {
      options = options || {};
      return options.node instanceof WorkflowAuditTask || options.node instanceof WorkflowAuditTaskEvent;
    }
  });
  _.extend(TaskDetailsTabView.prototype, LayoutViewEventsPropagationMixin);
  return TaskDetailsTabView;
});