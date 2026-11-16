/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/utils/contexts/factories/tasks.factory", "d2/widgets/taskstable/tasks.widgettable.view", "d2/widgets/widget.container/perspective.table.container.view" ], function($, _, Backbone, Marionette, D2TasksFactory, D2TasksTable, PerspectiveTableContainer) {
  "use strict";
  var TasksTableView = PerspectiveTableContainer.extend({
    constructor: function TasksTableView() {
      PerspectiveTableContainer.prototype.constructor.apply(this, arguments);
    },
    getWidgetViewClass: function() {
      return D2TasksTable;
    },
    resolveDataForTable: function() {
      return this.checkDataFetchedWithContext(D2TasksFactory);
    }
  });
  return TasksTableView;
});