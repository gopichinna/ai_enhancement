/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/models/nodes", "csui/utils/commands", "d2/controls/mixins/view.state/workflow.view.state.mixin", "d2/controls/task.list/task.list.view", "d2/models/workflow/workflows", "d2/utils/contexts/factories/workflows.factory", "d2/utils/contexts/factories/workflow", "d2/utils/constants", "d2/utils/server.query.utils", "d2/utils/widget.constants", "d2/widgets/task.details/task.details.view", "d2/widgets/workflow.details/impl/workflow.details.panel.view", "d2/widgets/workflowstable/workflow.toolbaritems", "d2/widgets/workflowstable/workflow.toolbaritems.masks", "i18n!d2/widgets/workflow.details/impl/nls/lang", "css!d2/widgets/workflow.details/impl/workflow.details" ], function(_, NodeCollection, commands, WorkflowViewStateMixin, TaskListView, WorkflowCollection, WorkflowCollectionFactory, WorkflowModelFactory, constants, serverQueryUtil, widgetConstants, TaskDetailsView, WorkflowDetailsPanelView, workflowToolItems, WorkflowToolItemsMasks, lang) {
  "use strict";
  var WorkflowDetailsView = TaskDetailsView.extend({
    className: function() {
      return "d2-workflow-details-widget " + TaskDetailsView.prototype.className;
    },
    constructor: function WorkflowDetailsView() {
      TaskDetailsView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, "d2:workflow:supervisor:changed", this._markWfSupervisorChanged).listenTo(this.model, "d2:workflow:aborted", this._markWfAborted).listenTo(this.model, "d2:workflow:update:performers", this._onListClickItem);
    },
    initialize: function(options) {
      options = options || {};
      if (!options.collection) {
        var workflowOverviewWidgetName = this.getViewStateWorkflowOverviewWidgetName() || options.workflowOverviewWidgetName, widgetType = this.isAdminScope() ? widgetConstants.D2.ADMIN_WORKFLOWS : widgetConstants.D2.WORKFLOWS;
        if (!workflowOverviewWidgetName) {
          throw new Error("Either a workflowOverviewWidgetName or a WorkflowCollection is required");
        }
        options.collection = this.context.getCollection(WorkflowCollectionFactory, {
          options: _.extend({
            commands: commands,
            widgetType: widgetType,
            widgetName: workflowOverviewWidgetName
          }, this._getCollectionStateOptions())
        });
      } else if (!(options.collection instanceof WorkflowCollection)) {
        throw new Error("collection is not a WorkflowCollection");
      }
      this.collection = options.collection;
      options.workflowListWidget = serverQueryUtil.getWidgetConfig(widgetType, this.collection.options.widgetName);
      if (options.container) {
        this.container = options.container;
      } else if (options.data.containerId) {
        this.container = this.context.getModel(WorkflowModelFactory, {
          workflow: {
            attributes: {
              id: this.options.data.containerId
            }
          }
        });
      }
      if (!options.manageAttachments) {
        options.manageAttachments = this.getViewStateWorkflowManageAttachments();
      }
      this.setViewStateWorkflowManageAttachments(false);
      if (!this.model) {
        this.model = this.context.getModel(WorkflowModelFactory, {
          attributes: options.data.id && {
            id: options.data.id
          },
          temporary: true
        });
        this.model.detailsView = true;
        this.model.collection = this.collection;
        options.model = this.model;
      }
      if (!this.container) {
        this.container = options.model.clone();
      }
      options.container = this.container;
      this.listenToOnce(this.collection, "sync", function() {
        this.setViewStateCollectionOrderBy(this.collection.orderBy, false);
      });
    },
    isAdminScope: function() {
      return this.context.viewStateModel?.get("currentRouterScopeId") === "adminworkflowdetails";
    },
    _onContextNodeSync: function() {
      if (this.collection.widgetType !== this.model.widgetType) {
        this.collection.widgetType = this.model.widgetType;
        this.collection.widgetName = this.model.widgetName;
        this.collection.fetch().always(() => TaskDetailsView.prototype._onContextNodeSync.apply(this, arguments));
      } else {
        TaskDetailsView.prototype._onContextNodeSync.apply(this, arguments);
      }
    },
    _markWfSupervisorChanged: function(options) {
      options = options || {};
      this._handleNavigationAfterTaskCompletion(options);
    },
    _markWfAborted: function(options) {
      options = options || {};
      this._handleNavigationAfterTaskCompletion(options);
    },
    addInitialURLParamSupport: function() {
      this.addUrlParametersSupport(WorkflowViewStateMixin.PROPERTY_CONSTANTS.DETAILS_PERSPECTIVE_INIT_URL_PARAMS);
    },
    _setupDefaultOptions: function() {
      this.options.commands = commands;
      this.options.toolbarItems = _.extend({}, workflowToolItems);
      this.options.toolbarItemsMasks = new WorkflowToolItemsMasks(this.options);
      this.options.originatingView = this;
      this.options.blockingParentView = this;
      this.options.labelListName = this.options.workflowListWidget && this.options.workflowListWidget["label_value"] || lang.listNameLabel;
    },
    _setupTaskListView: function() {
      TaskDetailsView.prototype._setupTaskListView.apply(this, arguments);
      var idCompartors = this.taskListView.listView.attributesUsedForEqualityComparison, index = _.indexOf(idCompartors, "workflow_id");
      if (index !== -1) {
        idCompartors.splice(index, 1);
      }
    },
    _setupTaskDetailsView: function() {
      if (!this.taskDetailsView) {
        this.taskDetailsView = new WorkflowDetailsPanelView(_.defaults({}, this.options));
        this.listenTo(this.taskDetailsView, "goto:task:list", this._onClickBack);
      }
    },
    _onBeforeNavigateBack: function(e) {
      this.trigger("workflow:navigation:back", e);
    },
    _getListItemOpenCommandSignature: function() {
      return "D2-OpenWorkflow";
    },
    _getCollectionStateOptions: function() {
      var options = {
        orderBy: this.getViewStateCollectionOrderBy(),
        workflowsReportingType: this.getViewStateWorkflowReportingType(),
        detailsView: true
      }, origOrderBy = options.orderBy;
      if (_.isEmpty(options.orderBy)) {
        options.orderBy = "r_start_date asc";
        this.setViewStateCollectionOrderBy(options.orderBy, false);
      }
      if (!_.contains([ constants.WorkflowsReportingType.USER, constants.WorkflowsReportingType.ALL ], options.workflowsReportingType)) {
        options.workflowsReportingType = constants.WorkflowsReportingType.USER;
        this.setViewStateWorkflowReportingType(options.workflowsReportingType, true, false);
      }
      _.defaults(options, TaskDetailsView.prototype._getCollectionStateOptions.apply(this, arguments));
      if (_.isEmpty(origOrderBy)) {
        delete options.orderBy;
      }
      return options;
    }
  });
  WorkflowViewStateMixin.mixin(WorkflowDetailsView.prototype);
  return WorkflowDetailsView;
});