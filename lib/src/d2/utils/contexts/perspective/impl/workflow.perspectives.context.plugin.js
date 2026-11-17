/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/contexts/perspective/perspective.context.plugin", "d2/controls/mixins/view.state/workflow.view.state.mixin", "d2/utils/constants", "d2/utils/contexts/factories/workflow", "d2/utils/contexts/factories/next.workflow", "d2/utils/contexts/perspective/workflow.perspectives", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "d2/utils/widget.constants", "i18n!d2/utils/contexts/perspective/impl/nls/lang" ], function(module, _, $, Backbone, ApplicationScopeModelFactory, PerspectiveContextPlugin, WorkflowViewStateMixin, constants, WorkflowModelFactory, NextWorkflowModelFactory, workflowPerspectives, RestResources, serverQueryUtil, widgetConstants, lang) {
  "use strict";
  var APP_SCOPE_MY_WORKFLOW_DETAILS = "myworkflowdetails", APP_SCOPE_ALL_WORKFLOW_DETAILS = "allworkflowdetails", APP_SCOPE_ADMIN_WORKFLOW_DETAILS = "adminworkflowdetails", APP_SCOPE_MY_WORKFLOW_DOCUMENTS = "myworkflowdocuments", APP_SCOPE_ALL_WORKFLOW_DOCUMENTS = "allworkflowdocuments", APP_SCOPE_ADMIN_WORKFLOW_DOCUMENTS = "adminworkflowdocuments", APP_SCOPE_MY_WORKFLOW_AUDIT = "myworkflowaudit", APP_SCOPE_ALL_WORKFLOW_AUDIT = "allworkflowaudit", supportedApplicationScopes = [ APP_SCOPE_MY_WORKFLOW_DETAILS, APP_SCOPE_MY_WORKFLOW_DOCUMENTS, APP_SCOPE_ALL_WORKFLOW_DETAILS, APP_SCOPE_ALL_WORKFLOW_DOCUMENTS, APP_SCOPE_MY_WORKFLOW_AUDIT, APP_SCOPE_ALL_WORKFLOW_AUDIT, APP_SCOPE_ADMIN_WORKFLOW_DETAILS, APP_SCOPE_ADMIN_WORKFLOW_DOCUMENTS ];
  return PerspectiveContextPlugin.extend({
    constructor: function WorkflowPerspectivesContextPlugin() {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.nextWorkflow = this.context.getModel(NextWorkflowModelFactory, {
        permanent: true,
        detached: true
      });
      this.viewStateModel = this.context.viewStateModel;
      this.listenTo(this.nextWorkflow, "change:workflow_info", this._fetchWorkflowPerspective);
    },
    isFetchable: function(factory) {
      return factory.property !== this.workflow;
    },
    isWithinServiceableScope: function() {
      var appScopeId = this.applicationScope.get("id");
      return _.includes(supportedApplicationScopes, appScopeId);
    },
    onClear: function() {
      if (!this.isWithinServiceableScope()) {
        this.workflow = this._getWorkflowFromFactory();
        this.nextWorkflow.clear({
          silent: true
        });
      } else {
        this.workflow = this._getWorkflowFromFactory.apply(this, this.rejectedPerspective ? undefined : [ this.nextWorkflow.get("workflow_info").model, true ]);
      }
    },
    onRefresh: function() {
      if (this.isWithinServiceableScope()) {
        if (this.rejectedPerspective) {
          this.workflow.clear();
          return;
        }
        this._syncWorkflowToSharedContextModel();
      }
    },
    _getWorkflowFromFactory: function(sourceWorkflow, forceCopy) {
      var factory = this.context.getFactory(WorkflowModelFactory, {
        workflow: sourceWorkflow
      });
      if (!!sourceWorkflow && forceCopy === true && factory.property !== sourceWorkflow) {
        factory.property = sourceWorkflow;
      }
      return factory.property;
    },
    _syncWorkflowToSharedContextModel: function() {
      this.workflow = this._getWorkflowFromFactory();
      var workflowInfo = this.nextWorkflow.get("workflow_info");
      if (workflowInfo.model === this.workflow) {
        return;
      }
      this.workflow.clear({
        silent: true
      });
      this.workflow.set(workflowInfo.model.attributes);
      this.workflow.trigger("sync");
    },
    _fetchWorkflowPerspective: function() {
      var workflowInfo = this.nextWorkflow.get("workflow_info"), workflow, appScope, showWorkflowDocuments = workflowInfo.showDocumentsView === true, setContextToAllWorkflows = workflowInfo.setContextToAllWorkflows === true, showWorkflowAudit = workflowInfo.showAuditView === true, setContextToAdminMode = workflowInfo.setContextToAdminMode;
      let workflowWidgetName = workflowInfo.workflowWidgetName, workflowWidgetType = setContextToAdminMode ? widgetConstants.D2.ADMIN_WORKFLOWS : widgetConstants.D2.WORKFLOWS;
      if (workflowInfo.model) {
        if (this.workflow && this.workflow === workflowInfo.model && this.isWithinServiceableScope()) {
          return;
        }
        workflow = workflowInfo.model;
      } else {
        workflow = this.context.getModel(WorkflowModelFactory, {
          attributes: {
            id: workflowInfo.id
          },
          temporary: true
        });
      }
      this.rejectedPerspective = false;
      this.context.triggerMethod("request:perspective", this.context);
      if (showWorkflowDocuments) {
        appScope = setContextToAdminMode ? APP_SCOPE_ADMIN_WORKFLOW_DOCUMENTS : setContextToAllWorkflows ? APP_SCOPE_ALL_WORKFLOW_DOCUMENTS : APP_SCOPE_MY_WORKFLOW_DOCUMENTS;
      } else if (showWorkflowAudit) {
        appScope = setContextToAllWorkflows ? APP_SCOPE_ALL_WORKFLOW_AUDIT : APP_SCOPE_MY_WORKFLOW_AUDIT;
      } else {
        appScope = setContextToAdminMode ? APP_SCOPE_ADMIN_WORKFLOW_DETAILS : setContextToAllWorkflows ? APP_SCOPE_ALL_WORKFLOW_DETAILS : APP_SCOPE_MY_WORKFLOW_DETAILS;
      }
      this.applicationScope.set("id", appScope);
      var userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), workflowOverviewWidgetName = workflowWidgetName || this.viewStateModel.getDefaultViewState(WorkflowViewStateMixin.PROPERTY_CONSTANTS.WIDGET_NAME_WORKFLOW_OVERVIEW), workflowOverviewWidgetConfig = !!workflowOverviewWidgetName && serverQueryUtil.getWidgetConfig(workflowWidgetType, workflowOverviewWidgetName), taskAttachmentsWidgetName = this.viewStateModel.getDefaultViewState(WorkflowViewStateMixin.PROPERTY_CONSTANTS.WIDGET_NAME_TASK_ATTACHMENTS), taskAttachmentsWidgetConfig = !!taskAttachmentsWidgetName && serverQueryUtil.getWidgetConfig(widgetConstants.D2.TASK_ATTACHMENTS, taskAttachmentsWidgetName), wConfigWFReportingType;
      if (!workflowOverviewWidgetConfig) {
        if (setContextToAdminMode) {
          this._doRejectPerspective(workflow, new Error(lang.ErrorMissingWorkflowWidgetConfig));
          return;
        }
        workflowOverviewWidgetName = userDefaultWidgets[setContextToAllWorkflows ? widgetConstants.DEFAULT.ALL_WORKFLOWS : widgetConstants.DEFAULT.MY_WORKFLOWS];
        workflowOverviewWidgetConfig = !!workflowOverviewWidgetName && serverQueryUtil.getWidgetConfig(widgetConstants.D2.WORKFLOWS, workflowOverviewWidgetName);
        if (!workflowOverviewWidgetConfig) {
          this._doRejectPerspective(workflow, new Error(lang.ErrorMissingWorkflowWidgetConfig));
          return;
        }
      }
      wConfigWFReportingType = workflowOverviewWidgetConfig.widgetParams && workflowOverviewWidgetConfig.widgetParams["wf_report_type_smartview"];
      if (!showWorkflowDocuments && !showWorkflowAudit && (setContextToAdminMode && wConfigWFReportingType !== constants.WorkflowsReportingType.ALL) && (setContextToAllWorkflows && wConfigWFReportingType === constants.WorkflowsReportingType.USER || !setContextToAllWorkflows && wConfigWFReportingType === constants.WorkflowsReportingType.ALL)) {
        this._doRejectPerspective(workflow, new Error(lang.ErrorIncorrectReportingTypeWorkflowWidgetConfig));
        return;
      }
      if (!showWorkflowDocuments && !showWorkflowAudit && !taskAttachmentsWidgetConfig) {
        taskAttachmentsWidgetName = userDefaultWidgets[widgetConstants.DEFAULT.TASK_ATTACHMENTS];
        taskAttachmentsWidgetConfig = !!taskAttachmentsWidgetName && serverQueryUtil.getWidgetConfig(widgetConstants.D2.TASK_ATTACHMENTS, taskAttachmentsWidgetName);
        if (!taskAttachmentsWidgetConfig) {
          this._doRejectPerspective(workflow, new Error(lang.ErrorMissingTaskAttachmentsWidgetConfig));
          return;
        }
      }
      workflow.widgetName = workflowOverviewWidgetName;
      workflow.widgetType = workflowWidgetType;
      workflow.ensureFetched().done(function() {
        var newWorkflowInfo;
        if (this.workflow && this.workflow.widgetType !== workflowWidgetType) {
          this._getWorkflowFromFactory(workflow, true);
        }
        this.workflow = workflow;
        if (workflowInfo.model) {
          workflowInfo.model = workflow;
        } else {
          newWorkflowInfo = {
            id: workflow.get("id"),
            model: workflow
          };
          if (newWorkflowInfo.id !== workflowInfo.id) {
            newWorkflowInfo.replaceLastUrl = true;
          }
        }
        this.viewStateModel.setDefaultViewState(WorkflowViewStateMixin.PROPERTY_CONSTANTS.WIDGET_NAME_WORKFLOW_OVERVIEW, workflowOverviewWidgetName, {
          silent: true
        });
        this.viewStateModel.setDefaultViewState(WorkflowViewStateMixin.PROPERTY_CONSTANTS.WIDGET_NAME_TASK_ATTACHMENTS, taskAttachmentsWidgetName, {
          silent: true
        });
        this._setOtherDefaultViewStateParams(workflowInfo, workflow.get("d2_workflow_state"));
        if (newWorkflowInfo) {
          this.nextWorkflow.set("workflow_info", _.extend({}, workflowInfo, newWorkflowInfo));
        }
        this._verifyWorkflowModelAndDecidePerspective(workflow, {
          showWorkflowDocumentsView: showWorkflowDocuments,
          showWorkflowAuditView: showWorkflowAudit
        });
      }.bind(this)).fail(function(error) {
        this._doRejectPerspective(workflow, error);
      }.bind(this));
    },
    _verifyWorkflowModelAndDecidePerspective: function(workflow, addlPerspectiveMatcherProperties) {
      if (workflow.get("type") === constants.Types.WORKFLOW) {
        this._changePerspective(workflow, addlPerspectiveMatcherProperties);
      } else {
        this._doRejectPerspective(workflow, new Error(lang.ErrorNotAWorkflow));
      }
    },
    _doRejectPerspective: function(workflow, error) {
      this.rejectedPerspective = true;
      this.context.rejectPerspective(workflow, error);
    },
    _changePerspective: function(sourceModel, addlPerspectiveMatcherProperties) {
      var perspectiveModule, perspective = workflowPerspectives.findByNode(addlPerspectiveMatcherProperties ? new Backbone.Model(_.defaults(addlPerspectiveMatcherProperties, sourceModel.attributes)) : sourceModel);
      if (_.isEmpty(sourceModel.get("perspective")) || perspective.get("important")) {
        perspectiveModule = perspective.get("module");
      }
      if (perspectiveModule) {
        return this.context.overridePerspective(sourceModel, perspectiveModule);
      }
      this.context.applyPerspective(sourceModel);
    },
    _setOtherDefaultViewStateParams: function(workflowInfo, workflowState) {
      if (workflowInfo) {
        var viewStateModel = this.context.viewStateModel, state = viewStateModel.get(viewStateModel.CONSTANTS.STATE) || {}, defaultState = viewStateModel.get(viewStateModel.CONSTANTS.DEFAULT_STATE) || {};
        defaultState[WorkflowViewStateMixin.PROPERTY_CONSTANTS.COLLECTION_STATE_REPORTING_TYPE] = workflowInfo.setContextToAllWorkflows === true ? constants.WorkflowsReportingType.ALL : constants.WorkflowsReportingType.USER;
        var qFormParam = JSON.parse(state["qform-param"] || "{}"), wfStates = qFormParam["wf-states"] || [];
        if (!_.contains(wfStates, workflowState)) {
          wfStates.push(workflowState);
          qFormParam["wf-states"] = wfStates;
          state["qform-param"] = JSON.stringify(qFormParam);
        }
        if (!_.isUndefined(workflowInfo.orderBy)) {
          state[WorkflowViewStateMixin.PROPERTY_CONSTANTS.COLLECTION_STATE_ORDER_BY] = workflowInfo.orderBy;
        }
        if (_.isObject(workflowInfo.filter)) {
          state[WorkflowViewStateMixin.PROPERTY_CONSTANTS.COLLECTION_STATE_FILTER] = JSON.stringify(workflowInfo.filter);
        }
        if (_.isNumber(workflowInfo.top) && !_.isNaN(workflowInfo.top)) {
          defaultState[WorkflowViewStateMixin.PROPERTY_CONSTANTS.COLLECTION_STATE_TOP] = workflowInfo.top;
        }
        if (_.isNumber(workflowInfo.skip) && !_.isNaN(workflowInfo.skip)) {
          defaultState[WorkflowViewStateMixin.PROPERTY_CONSTANTS.COLLECTION_STATE_SKIP] = workflowInfo.skip;
        }
        if (_.isBoolean(workflowInfo.manageAttachments)) {
          defaultState[WorkflowViewStateMixin.PROPERTY_CONSTANTS.WORKFLOW_MANAGE_ATTACHMENTS] = workflowInfo.manageAttachments;
        }
        if (workflowInfo.selectedFileTab) {
          state[WorkflowViewStateMixin.PROPERTY_CONSTANTS.WORKFLOW_DOCUMENTS_TYPE] = workflowInfo.selectedFileTab;
        }
        if (workflowInfo.selectedMetaTab) {
          state[WorkflowViewStateMixin.PROPERTY_CONSTANTS.WORKFLOW_METADATA_DROPDOWN] = workflowInfo.selectedMetaTab;
        }
        if (workflowInfo.selectedNodeId) {
          defaultState[WorkflowViewStateMixin.PROPERTY_CONSTANTS.WORKFLOW_DOCUMENTS_SELECTED_NODE] = workflowInfo.selectedNodeId;
        }
        if (workflowInfo.hasMoreRecords) {
          defaultState[WorkflowViewStateMixin.PROPERTY_CONSTANTS.COLLECTION_HAS_MORE_RECORDS] = workflowInfo.hasMoreRecords;
        }
        if (workflowInfo.hadMoreRecords) {
          defaultState[WorkflowViewStateMixin.PROPERTY_CONSTANTS.COLLECTION_HAD_MORE_RECORDS] = workflowInfo.hadMoreRecords;
        }
        viewStateModel.set(viewStateModel.CONSTANTS.STATE, state, {
          silent: true
        });
        viewStateModel.set(viewStateModel.CONSTANTS.DEFAULT_STATE, defaultState, {
          silent: true
        });
      }
    }
  });
});