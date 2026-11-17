/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/utils/contexts/factories/admin.checkout.factory", "d2/widgets/admin/checkedouttable/checkedout.widgettable.view", "d2/widgets/widget.container/perspective.table.container.view" ], function($, _, Backbone, Marionette, AdminCheckoutFactory, AdminCheckedoutTable, PerspectiveTableContainer) {
  "use strict";
  var AdminCheckedoutTableView = PerspectiveTableContainer.extend({
    constructor: function AdminCheckedoutTableView() {
      PerspectiveTableContainer.prototype.constructor.apply(this, arguments);
    },
    getWidgetViewClass: function() {
      return AdminCheckedoutTable;
    },
    resolveDataForTable: function() {
      return this.checkDataFetchedWithContext(AdminCheckoutFactory);
    }
  });
  return AdminCheckedoutTableView;
});