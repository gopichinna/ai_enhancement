/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/utils/contexts/factories/connector", "d2/utils/contexts/factories/workflows.factory", "d2/utils/widget.constants", "d2/utils/constants", "d2/utils/server.query.utils", "d2/controls/query.form/query.form.model", "d2/widgets/widgettable/widgettable.view", "d2/widgets/workflow.queryform/workflow.query.form.view", "d2/widgets/widgettable/toolbaritems", "d2/widgets/workflowstable/workflow.toolbaritems", "d2/widgets/workflowstable/workflow.toolbaritems.masks", "i18n!csui/widgets/nodestable/impl/nls/lang", "i18n!d2/widgets/workflowstable/impl/nls/lang", "css!d2/widgets/workflowstable/impl/workflowstable" ], function($, _, Backbone, Marionette, ConnectorFactory, WorkflowsCollectionFactory, widgetConstants, constants, serverQueryUtils, QueryFormModel, D2WidgetTable, WFQueryFormView, WidgetTableToolbarItems, WorkflowToolItems, WorkflowToolItemsMasks, csuiLang, lang) {
  "use strict";
  var WorkflowsTableView = D2WidgetTable.extend({
    className: function() {
      return D2WidgetTable.prototype.className + " d2-workflows-table-view";
    },
    constructor: function WorkflowsTableView(options) {
      this.context = options.context;
      this.widgetName = this.getViewStateWidgetName();
      this.workflowsReportingType = this.getWorkflowsReportingType();
      options.d2collectionFactory = WorkflowsCollectionFactory;
      options.selectRows = "none";
      options.inlineRowActions = true;
      options.showQueryFormPanelOnLoad = true;
      options.toolbarItems = _.extend({}, WidgetTableToolbarItems, {
        inlineActionbar: WorkflowToolItems.inlineActionbar,
        inlineRowActionbar: WorkflowToolItems.inlineRowActionbar,
        leftToolbar: WorkflowToolItems.tableViewLeftToolbar,
        rightToolbar: WorkflowToolItems.tableViewRightToolbar,
        filterToolbar: WorkflowToolItems.tableViewfilterToolbar
      });
      options.queryForm = this._getQueryForm(options);
      D2WidgetTable.prototype.constructor.apply(this, arguments);
    },
    initialize: function() {
      this.options.collectionAttributes = this.getCollectionAttributes();
      D2WidgetTable.prototype.initialize.apply(this, arguments);
      this.listenTo(this.tableView, "render", this.updateZeroRecordMessage);
      var me = this;
      this.listenTo(this.collection, "sync", function() {
        if (me.collection.columns.length === 0) {
          me.context.rejectPerspective(new Backbone.Model(), new Error(lang.MissingColumnsError));
        }
      });
    },
    updateZeroRecordMessage: function() {
      if (this.tableView._renderedEmptyTable && this.collection.requestAborted) {
        var emptyRecordDiv = this.tableView.$el.find(".csui-table-empty").addClass("d2-search-request-aborted");
        emptyRecordDiv.find(".csui-no-result-message").attr("title", lang.searchAbortedMessage).html(lang.searchAbortedMessage);
      }
    },
    getTitle: function() {
      var title = this.workflowsReportingType === constants.WorkflowsReportingType.ALL ? lang.allWorkflowsDialogTitle : lang.myWorkflowsDialogTitle, widgetConfig = serverQueryUtils.getWidgetConfig(this.getWidgetType(), this.widgetName);
      if (widgetConfig && widgetConfig.label_value) {
        title = widgetConfig.label_value;
      }
      return title;
    },
    getCollectionAttributes: function() {
      return {
        workflowsReportingType: this.getWorkflowsReportingType()
      };
    },
    getWidgetTypeId: function() {
      return constants.WidgetId.WORKFLOWS;
    },
    getWidgetType: function() {
      return widgetConstants.D2.WORKFLOWS;
    },
    addFilterCommandAria: function() {
      if (this.tableToolbarView && this.tableToolbarView.filterToolbarView) {
        var toolItemEl = this.tableToolbarView.filterToolbarView.$el.find("li:not(.workflow-toolbar-back-button) a");
        toolItemEl.removeAttr("aria-expanded");
        if (this.ui.facetView instanceof Object && this.ui.facetView.hasClass("csui-facetview-hidden")) {
          toolItemEl.attr("aria-label", csuiLang.filterExpandAria);
          toolItemEl.attr("title", csuiLang.filterExpandTooltip);
        } else {
          toolItemEl.attr("aria-label", csuiLang.filterCollapseAria);
          toolItemEl.attr("title", csuiLang.filterCollapseTooltip);
        }
      }
    },
    getWorkflowsReportingType: function() {
      var scopeId = this.context && this.context.viewStateModel && this.context.viewStateModel.get("currentRouterScopeId");
      return scopeId && scopeId === widgetConstants.WIDGET_SCOPE.ALL_WORKFLOWS ? constants.WorkflowsReportingType.ALL : constants.WorkflowsReportingType.USER;
    },
    getZeroRecordText: function() {
      return lang.noWorkflowsMessage;
    },
    _getQueryForm: function(options) {
      return {
        viewClass: WFQueryFormView,
        viewOptions: {
          context: options.context,
          widgetName: this.widgetName,
          workflowsReportingType: this.workflowsReportingType,
          originatingView: this,
          savedSearchName: this.getTitle(),
          search: _.bind(this._executeQueryFormSearch, this),
          refresh: _.bind(this._refreshTargetView, this),
          ignoreDefaultState: true
        }
      };
    },
    _restoreSelectedNodesFromSessionViewSate: function() {
      return;
    }
  });
  return WorkflowsTableView;
});