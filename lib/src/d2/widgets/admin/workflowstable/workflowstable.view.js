/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/utils/constants", "d2/utils/widget.constants", "d2/widgets/admin/workflowstable/workflows.widgettable.view", "d2/widgets/workflowstable/workflowstable.view" ], function(constants, widgetConstants, D2AdminWorkflowsTable, WorkflowsPerspectiveTableView) {
  "use strict";
  return WorkflowsPerspectiveTableView.extend({
    constructor: function AdminWorkflowsTableView() {
      WorkflowsPerspectiveTableView.prototype.constructor.apply(this, arguments);
    },
    getWidgetViewClass: function() {
      return D2AdminWorkflowsTable;
    },
    getWorkflowsReportingType: function() {
      return constants.WorkflowsReportingType.ALL;
    },
    getAddnlFactoryOptions: function() {
      let options = WorkflowsPerspectiveTableView.prototype.getAddnlFactoryOptions.apply(this, arguments);
      options.widgetType = widgetConstants.D2.ADMIN_WORKFLOWS;
      return options;
    }
  });
});