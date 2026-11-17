/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/table/cells/templated/templated.view", "csui/controls/table/cells/cell.registry", "d2/utils/task.utils", "hbs!d2/controls/table/cells/workflow.status/impl/workflow.status", "css!d2/controls/table/cells/workflow.status/impl/workflow.status" ], function(TemplatedCellView, cellViewRegistry, taskUtils, template) {
  "use strict";
  var WorkflowStatusCellView = TemplatedCellView.extend({
    template: template,
    needsAriaLabel: true,
    getValueData: function() {
      return taskUtils.getStatusObject(this.model.get(this.options.column.name) || this.model.get("task_state"));
    },
    getValueText: function() {
      return taskUtils.getStatusObject(this.model.get(this.options.column.name) || this.model.get("task_state")).statusName;
    }
  }, {
    columnClassName: "d2-table-cell-workflow-status"
  });
  cellViewRegistry.registerByColumnKey("d2_workflow_state", WorkflowStatusCellView);
  return WorkflowStatusCellView;
});