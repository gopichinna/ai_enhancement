/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/table/cells/templated/templated.view", "csui/controls/table/cells/cell.registry", "d2/controls/table/cells/task.performers/impl/task.performers.list.view", "css!d2/controls/table/cells/task.performers/impl/task.performers" ], function($, _, Backbone, Marionette, TemplatedCellView, cellViewRegistry, TaskPerformersListView) {
  "use strict";
  var TaskPerformersCellView = TemplatedCellView.extend({
    constructor: function TaskPerformersCellView() {
      TemplatedCellView.prototype.constructor.apply(this, arguments);
      this.$el.html('<div class="task-performers"/>');
    },
    events: {
      keydown: "_onKeyDown"
    },
    getValueText: function() {
      return this.model.get("d2_performer_value");
    },
    renderValue: function() {
      var tableView = this.options && this.options.tableView, performers = this.model.get("performers");
      if (performers && performers.length > 0) {
        var taskPerformersListView = new TaskPerformersListView({
          collection: new Backbone.Collection(),
          performers: performers,
          isExternal: this.model.get("is_external_alias"),
          cellView: this
        });
        taskPerformersListView.render();
        this.$el.find(".task-performers").html(taskPerformersListView.$el);
        if (tableView) {
          this.listenTo(tableView, "dom:refresh", function() {
            taskPerformersListView.resetContent();
          });
        }
      }
    },
    _onKeyDown: function(event) {
      var eventKeyCode = event.charCode || event.which;
      switch (eventKeyCode) {
       case 13:
       case 32:
        var focusable = this.$el.find(".focusable-item").first();
        focusable.trigger("focus");
        break;

       default:
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    }
  }, {
    widthFactor: 1.8,
    columnClassName: "d2-table-cell-task-performers has-focusable-items"
  });
  cellViewRegistry.registerByColumnKey("d2_performer_value", TaskPerformersCellView);
  return TaskPerformersCellView;
});