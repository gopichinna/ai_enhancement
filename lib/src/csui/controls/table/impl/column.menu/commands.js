/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/command", "csui/models/commands" ], function(CommandModel, CommandCollection) {
  var TableColumnSortAscendingCommand = CommandModel.extend({
    defaults: {
      signature: "TableColumnSortAscending"
    },
    enabled: function(status, options) {
      const table = status.originatingView.table || status.table;
      const order = table.order()[0];
      status.toolItem.set("stateIsOn", order ? order[0] === status.data.orderIndex && order[1] === "asc" : false);
      const displayedColumns = status.originatingView.displayedColumns;
      const orderColumn = displayedColumns[status.data.orderIndex];
      return orderColumn.orderable;
    },
    execute: function(status, options) {
      if (!status.toolItem.get("stateIsOn")) {
        status.originatingView.table.column(status.data.orderIndex).order("asc").draw();
      }
    }
  });
  var TableColumnSortDescendingCommand = CommandModel.extend({
    defaults: {
      signature: "TableColumnSortDescending"
    },
    enabled: function(status, options) {
      const table = status.originatingView.table || status.table;
      const order = table.order()[0];
      status.toolItem.set("stateIsOn", order ? order[0] === status.data.orderIndex && order[1] === "desc" : false);
      const displayedColumns = status.originatingView.displayedColumns;
      const orderColumn = displayedColumns[status.data.orderIndex];
      return orderColumn.orderable;
    },
    execute: function(status, options) {
      if (!status.toolItem.get("stateIsOn")) {
        status.originatingView.table.column(status.data.orderIndex).order("desc").draw();
      }
    }
  });
  var TableColumnResizeMinWidthCommand = CommandModel.extend({
    defaults: {
      signature: "TableColumnResizeMinWidth"
    },
    enabled: function(status, options) {
      return status.originatingView.displayedColumns[status.data.columnIndex].hasResizeHandle;
    },
    execute: function(status, options) {
      const displayedColumns = status.originatingView.displayedColumns;
      const resizeColumn = displayedColumns[status.data.resizeIndex];
      status.originatingView._setColumnToWidth(status.data.resizeIndex, resizeColumn.columnMinWidth);
    }
  });
  var TableColumnResizeFitToContentCommand = CommandModel.extend({
    defaults: {
      signature: "TableColumnResizeFitToContent"
    },
    enabled: function(status, options) {
      return status.originatingView.displayedColumns[status.data.columnIndex].hasResizeHandle;
    },
    execute: function(status, options) {
      status.originatingView._fitColumnToContent(status.data.resizeIndex);
    }
  });
  var commands = new CommandCollection([ new TableColumnSortAscendingCommand(), new TableColumnSortDescendingCommand(), new TableColumnResizeMinWidthCommand(), new TableColumnResizeFitToContentCommand() ]);
  return commands;
});