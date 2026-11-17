/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/widgets/myshares/myshares.factory", "d2/widgets/mysharestable/myshares.widgettable.view", "d2/widgets/widget.container/perspective.table.container.view" ], function($, _, Backbone, Marionette, D2MySharesTableFactory, D2MySharesTable, PerspectiveTableContainer) {
  "use strict";
  var MySharesTableView = PerspectiveTableContainer.extend({
    constructor: function MySharesTableView() {
      PerspectiveTableContainer.prototype.constructor.apply(this, arguments);
    },
    getWidgetViewClass: function() {
      return D2MySharesTable;
    },
    resolveDataForTable: function() {
      return this.checkDataFetchedWithContext(D2MySharesTableFactory);
    }
  });
  return MySharesTableView;
});