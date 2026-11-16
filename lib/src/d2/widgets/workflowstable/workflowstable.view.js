/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/utils/contexts/factories/workflows.factory", "d2/widgets/workflowstable/workflows.widgettable.view", "d2/widgets/widget.container/perspective.table.container.view", "d2/utils/widget.constants", "d2/utils/constants" ], function($, _, Backbone, Marionette, D2WorkFlowsFactory, D2WorkFlowsTable, PerspectiveTableContainer, widgetConstants, constants) {
  "use strict";
  var WorkFlowsTableView = PerspectiveTableContainer.extend({
    constructor: function WorkFlowsTableView() {
      PerspectiveTableContainer.prototype.constructor.apply(this, arguments);
    },
    getWidgetViewClass: function() {
      return D2WorkFlowsTable;
    },
    resolveDataForTable: function() {
      return this.checkDataFetchedWithContext(D2WorkFlowsFactory);
    },
    getWorkflowsReportingType: function() {
      var scopeId = this.context && this.context.viewStateModel && this.context.viewStateModel.get("currentRouterScopeId");
      return scopeId && scopeId === widgetConstants.WIDGET_SCOPE.ALL_WORKFLOWS ? constants.WorkflowsReportingType.ALL : constants.WorkflowsReportingType.USER;
    },
    getAddnlFactoryOptions: function() {
      return {
        attributes: {
          workflowsReportingType: this.getWorkflowsReportingType()
        }
      };
    }
  });
  return WorkFlowsTableView;
});