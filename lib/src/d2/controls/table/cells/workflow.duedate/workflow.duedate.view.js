/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/table/cells/cell.registry", "d2/controls/table/cells/task.duedate/task.duedate.view" ], function(cellViewRegistry, TaskDueDateView) {
  "use strict";
  var WorkflowDuedateCellView = TaskDueDateView.extend({
    getDuedateValue: function() {
      return this.model.get("d2_workflow_due_date") || this.model.get("d2_task_due_date");
    }
  }, {
    columnClassName: "d2-table-cell-workflow-duedate"
  });
  cellViewRegistry.registerByColumnKey("d2_workflow_due_date", WorkflowDuedateCellView);
  return WorkflowDuedateCellView;
});