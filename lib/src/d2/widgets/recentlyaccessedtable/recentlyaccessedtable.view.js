/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/utils/contexts/factories/recentlyaccessed", "d2/widgets/recentlyaccessedtable/recentlyaccessed.widgettable.view", "d2/widgets/widget.container/perspective.table.container.view" ], function($, _, Backbone, Marionette, D2RecentlyAccessedFactory, D2RecentlyAccessedTable, PerspectiveTableContainer) {
  "use strict";
  var RecentlyAccessedTableView = PerspectiveTableContainer.extend({
    constructor: function RecentlyAccessedTableView() {
      PerspectiveTableContainer.prototype.constructor.apply(this, arguments);
    },
    getWidgetViewClass: function() {
      return D2RecentlyAccessedTable;
    },
    resolveDataForTable: function() {
      return this.checkDataFetchedWithContext(D2RecentlyAccessedFactory);
    }
  });
  return RecentlyAccessedTableView;
});