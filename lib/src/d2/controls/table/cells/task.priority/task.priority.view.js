/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/table/cells/templated/templated.view", "csui/controls/table/cells/cell.registry", "d2/utils/task.utils", "hbs!d2/controls/table/cells/task.priority/impl/task.priority", "css!d2/controls/table/cells/task.priority/impl/task.priority" ], function(TemplatedCellView, cellViewRegistry, taskUtils, template) {
  "use strict";
  var TaskPriorityCellView = TemplatedCellView.extend({
    template: template,
    needsAriaLabel: true,
    getValueData: function() {
      return taskUtils.getTaskPriorityObject(this.model.get(this.options.column.name));
    },
    getValueText: function() {
      return taskUtils.getTaskPriorityObject(this.model.get(this.options.column.name)).priorityName;
    }
  }, {
    columnClassName: "d2-table-cell-priority"
  });
  cellViewRegistry.registerByColumnKey("d2_task_priority", TaskPriorityCellView);
  return TaskPriorityCellView;
});