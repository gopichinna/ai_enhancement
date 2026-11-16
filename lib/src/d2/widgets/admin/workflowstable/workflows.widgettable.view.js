/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/utils/widget.constants", "d2/utils/constants", "d2/widgets/workflowstable/workflows.widgettable.view" ], function(widgetConstants, constants, WorkflowsTableView) {
  "use strict";
  return WorkflowsTableView.extend({
    constructor: function AdminWorkflowsTableView() {
      WorkflowsTableView.prototype.constructor.apply(this, arguments);
    },
    getWidgetType: function() {
      return widgetConstants.D2.ADMIN_WORKFLOWS;
    },
    getWidgetTypeId: function() {
      return constants.WidgetId.ADMIN_WORKFLOWS;
    },
    getCollectionAttributes: function() {
      let attrs = WorkflowsTableView.prototype.getCollectionAttributes.apply(this, arguments);
      attrs.widgetType = widgetConstants.D2.ADMIN_WORKFLOWS;
      return attrs;
    },
    getWorkflowsReportingType: function() {
      return constants.WorkflowsReportingType.ALL;
    }
  });
});