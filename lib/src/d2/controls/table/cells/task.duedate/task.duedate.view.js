/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/table/cells/templated/templated.view", "csui/controls/table/cells/cell.registry", "d2/utils/format.utils", "hbs!d2/controls/table/cells/task.duedate/impl/task.duedate", "css!d2/controls/table/cells/task.duedate/impl/task.duedate" ], function(TemplatedCellView, cellViewRegistry, formatUtils, template) {
  "use strict";
  var TaskDuedateCellView = TemplatedCellView.extend({
    template: template,
    needsAriaLabel: true,
    getValueData: function() {
      return this._getTaskDuedateObject();
    },
    getValueText: function() {
      var taskDueDateObject = this._getTaskDuedateObject();
      return taskDueDateObject && taskDueDateObject.title;
    },
    getDuedateValue: function() {
      return this.model.get("d2_task_due_date");
    },
    _getTaskDuedateObject: function() {
      var dueDateData = formatUtils.formatDueDate(this.getDuedateValue(), true);
      if (dueDateData) {
        return {
          dueDateStyle: dueDateData.overdue ? "task-overdue-date" : "task-due-date",
          title: dueDateData.datetimeInClientFormat,
          value: dueDateData.display
        };
      }
    }
  }, {
    columnClassName: "d2-table-cell-task-duedate"
  });
  cellViewRegistry.registerByColumnKey("d2_task_due_date", TaskDuedateCellView);
  return TaskDuedateCellView;
});