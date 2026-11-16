/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/utils/contexts/factories/checkout.factory", "d2/widgets/checkedouttable/checkedout.widgettable.view", "d2/widgets/widget.container/perspective.table.container.view" ], function($, _, Backbone, Marionette, D2CheckoutFactory, D2CheckedoutTable, PerspectiveTableContainer) {
  "use strict";
  var CheckedoutTableView = PerspectiveTableContainer.extend({
    constructor: function CheckedoutTableView() {
      PerspectiveTableContainer.prototype.constructor.apply(this, arguments);
    },
    getWidgetViewClass: function() {
      return D2CheckedoutTable;
    },
    resolveDataForTable: function() {
      return this.checkDataFetchedWithContext(D2CheckoutFactory);
    }
  });
  return CheckedoutTableView;
});