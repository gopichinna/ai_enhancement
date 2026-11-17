/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/controls/table/cells/date/date.view", "csui/controls/table/cells/cell.registry", "csui/utils/base", "hbs!csui/controls/table/cells/duedate/duedate" ], function(_, DateCellView, cellViewRegistry, base, template) {
  var DueDateCellView = DateCellView.extend({
    template: template,
    formatFunction: base.formatDateTime,
    getValueData: function() {
      var value = this.model.get(this.options.column.name);
      return _.extend(DateCellView.prototype.getValueData.call(this), {
        pastDueDate: new Date(value) < new Date()
      });
    }
  });
  cellViewRegistry.registerByColumnKey("date_due", DueDateCellView);
  return DueDateCellView;
});