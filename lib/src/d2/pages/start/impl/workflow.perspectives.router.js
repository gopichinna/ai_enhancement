/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/pages/start/perspective.router", "i18n!csui/pages/start/nls/lang", "i18n!csui/pages/start/impl/nls/lang", "i18n!d2/pages/start/impl/nls/lang", "d2/controls/mixins/view.state/workflow.view.state.mixin", "d2/utils/contexts/factories/next.workflow" ], function(module, $, _, Backbone, PerspectiveRouter, publicLang, publicLang2, lang, WorkflowViewStateMixin, NextWorkflowModelFactory) {
  "use strict";
  return PerspectiveRouter.extend({
    routes: {
      "myworkflows/:workflow_id(?*query_string)": "openMyWorkflowDetails",
      "allworkflows/:workflow_id(?*query_string)": "openAllWorkflowDetails",
      "adm-workflows/:workflow_id(?*query_string)": "openAdminWorkflowDetails",
      "myworkflows/:workflow_id/docs(?*query_string)": "openMyWorkflowDocuments",
      "allworkflows/:workflow_id/docs(?*query_string)": "openAllWorkflowDocuments",
      "adm-workflows/:workflow_id/docs(?*query_string)": "openAdminWorkflowDocuments",
      "myworkflows/:workflow_id/audit(?*query_string)": "openMyWorkflowAudit",
      "allworkflows/:workflow_id/audit(?*query_string)": "openAllWorkflowAudit"
    },
    name: "WorkflowPerspectivesRouter",
    constructor: function WorkflowPerspectivesRouter() {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);
      this.isViewStateModelOwner = false;
      this.nextWorkflow = this.context.getModel(NextWorkflowModelFactory);
      this.listenTo(this.nextWorkflow, "change:workflow_info", this._updateUrl);
    },
    isViewStateModelSupported: function() {
      return true;
    },
    openMyWorkflowDetails: function(id, query_string) {
      this._openWorkflowPerspective(id, query_string, false);
    },
    openAllWorkflowDetails: function(id, query_string) {
      this._openWorkflowPerspective(id, query_string, true);
    },
    openAdminWorkflowDetails: function(id, query_string) {
      this._openWorkflowPerspective(id, query_string, true, false, false, true);
    },
    openMyWorkflowDocuments: function(id, query_string) {
      this._openWorkflowPerspective(id, query_string, false, true);
    },
    openAllWorkflowDocuments: function(id, query_string) {
      this._openWorkflowPerspective(id, query_string, true, true);
    },
    openAdminWorkflowDocuments: function(id, query_string) {
      this._openWorkflowPerspective(id, query_string, true, true, false, true);
    },
    openMyWorkflowAudit: function(id, query_string) {
      this._openWorkflowPerspective(id, query_string, false, false, true);
    },
    openAllWorkflowAudit: function(id, query_string) {
      this._openWorkflowPerspective(id, query_string, true, false, true);
    },
    _openWorkflowPerspective: function(id, query_string, setContextToAllWorkflows, showDocumentsView, showAuditView, setContextToAdminMode) {
      var workflowInfo = this.nextWorkflow.get("workflow_info");
      var setId = !workflowInfo || (id && id !== workflowInfo.id || setContextToAllWorkflows !== workflowInfo.setContextToAllWorkflows || showDocumentsView !== workflowInfo.showDocumentsView || showAuditView !== workflowInfo.showAuditView || workflowInfo.setContextToAdminMode !== setContextToAdminMode);
      this.initViewStateFromUrlParams(query_string, setId);
      this.activate(false);
      var routerInfo = this.context.viewStateModel.getLastHistoryEntry();
      if (setContextToAdminMode && routerInfo.state?.widget_name && !this.context.viewStateModel.getViewState("widget_name")) {
        this.context.viewStateModel.setViewState("widget_name", routerInfo.state.widget_name, {
          silent: true
        });
      }
      if (setId) {
        this.nextWorkflow.set("workflow_info", {
          id: id,
          showAuditView: showAuditView,
          showDocumentsView: showDocumentsView,
          setContextToAllWorkflows: setContextToAllWorkflows,
          setContextToAdminMode: setContextToAdminMode,
          workflowWidgetName: this.context.viewStateModel.getViewState("widget_name")
        });
      }
    },
    onOtherRoute: function() {
      if (this.isViewStateModelOwner) {
        var viewStateModel = this.context.viewStateModel;
        viewStateModel && viewStateModel.unset(viewStateModel.CONSTANTS.URL_PARAMS);
        this.isViewStateModelOwner = false;
      }
      this.nextWorkflow.clear({
        silent: true
      });
    },
    onViewStateChanged: function() {
      var workflowInfo = this.nextWorkflow.get("workflow_info"), viewStateModel = this.context.viewStateModel;
      if (workflowInfo && workflowInfo.id && _.any([ viewStateModel.CONSTANTS.URL_PARAMS, viewStateModel.CONSTANTS.STATE ], function(k) {
        return viewStateModel.hasChanged(k);
      })) {
        this._updateUrl();
      }
    },
    _updateUrl: function() {
      var switchedToThisRouterFromAnother = false;
      if (this !== this.getActiveRouter()) {
        switchedToThisRouterFromAnother = true;
        this.activate(false);
      }
      var viewStateModel = this.context.viewStateModel, state = viewStateModel.get(viewStateModel.CONSTANTS.STATE) || {}, defaultState = viewStateModel.get(viewStateModel.CONSTANTS.DEFAULT_STATE) || {}, workflowInfo = this.nextWorkflow.get("workflow_info"), id = workflowInfo.id, setContextToAdminMode = workflowInfo.setContextToAdminMode === true, uri;
      if (setContextToAdminMode) {
        uri = "adm-workflows";
      } else {
        uri = workflowInfo.setContextToAllWorkflows === true ? "allworkflows" : "myworkflows";
      }
      uri += "/" + encodeURIComponent(id);
      if (workflowInfo.showDocumentsView === true) {
        uri += "/docs";
        if (!switchedToThisRouterFromAnother) {
          let _urlParam = setContextToAdminMode ? WorkflowViewStateMixin.PROPERTY_CONSTANTS.ADMIN_DOCUMENTS_PERSPECTIVE_INIT_URL_PARAMS : WorkflowViewStateMixin.PROPERTY_CONSTANTS.DOCUMENTS_PERSPECTIVE_INIT_URL_PARAMS;
          _.extend(defaultState, _.pick(state, _.difference(_.keys(state), _urlParam)));
          setContextToAdminMode && delete defaultState["widget_name"];
          viewStateModel.set(viewStateModel.CONSTANTS.DEFAULT_STATE, defaultState, {
            silent: true
          });
          this.addUrlParameters(_urlParam);
        }
      } else if (workflowInfo.showAuditView === true) {
        uri += "/audit";
        if (!switchedToThisRouterFromAnother) {
          _.extend(defaultState, _.pick(state, _.difference(_.keys(state), WorkflowViewStateMixin.PROPERTY_CONSTANTS.AUDIT_PERSPECTIVE_INIT_URL_PARAMS)));
          viewStateModel.set(viewStateModel.CONSTANTS.DEFAULT_STATE, defaultState, {
            silent: true
          });
          this.addUrlParameters(WorkflowViewStateMixin.PROPERTY_CONSTANTS.AUDIT_PERSPECTIVE_INIT_URL_PARAMS);
        }
      } else if (!switchedToThisRouterFromAnother) {
        let _urlParam = setContextToAdminMode ? WorkflowViewStateMixin.PROPERTY_CONSTANTS.ADMIN_DETAILS_PERSPECTIVE_INIT_URL_PARAMS : WorkflowViewStateMixin.PROPERTY_CONSTANTS.DETAILS_PERSPECTIVE_INIT_URL_PARAMS;
        _.extend(defaultState, _.pick(state, _.difference(_.keys(state), _urlParam)));
        setContextToAdminMode && delete defaultState["widget_name"];
        viewStateModel.set(viewStateModel.CONSTANTS.DEFAULT_STATE, defaultState, {
          silent: true
        });
        this.addUrlParameters(_urlParam);
      }
      this._updatePageTitle(workflowInfo.model);
      this.navigate(uri, {
        replace: !!workflowInfo.replaceLastUrl
      });
      this.isViewStateModelOwner = true;
      if (switchedToThisRouterFromAnother) {
        this._initializeViewState();
      }
    },
    _updatePageTitle: function(node) {
      if (node) {
        document.title = !node.has("name") ? _.str.sformat(publicLang2.NodeLoadingTitle, node.get("id")) : _.str.sformat(lang.workflowPerspectivesPageTitle, node.get("name"), publicLang.ProductName);
      }
    },
    getBackToTitle: function() {
      var workflowInfo = this.nextWorkflow.get("workflow_info");
      return workflowInfo && workflowInfo.showDocumentsView === true ? lang.workflowDocumentsPerspectiveBackTitle : workflowInfo && workflowInfo.showDocumentsView === true ? lang.workflowAuditPerspectiveBackTitle : lang.workflowDetailsPerspectiveBackTitle;
    },
    restore: function(routerInfo) {
      var viewStateModel = this.context.viewStateModel, fragment = routerInfo.fragment;
      if (viewStateModel) {
        this.restoring = true;
        viewStateModel.set(viewStateModel.CONSTANTS.URL_PARAMS, routerInfo.urlParam);
        fragment && Backbone.Router.prototype.navigate.call(this, fragment, {
          trigger: true
        });
      } else {
        window.history.back();
      }
    }
  });
});