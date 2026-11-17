/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/widgets/d2collections.perspective/d2collections.perspective.widgettable.view", "d2/widgets/widget.container/perspective.table.container.view", "d2/utils/widget.constants" ], function(D2CollectionPerspectiveView, PerspectiveTableContainer, WidgetConstants) {
  "use strict";
  return PerspectiveTableContainer.extend({
    constructor: function D2CollectionTableView() {
      PerspectiveTableContainer.prototype.constructor.apply(this, arguments);
    },
    getWidgetViewClass: function() {
      return D2CollectionPerspectiveView;
    },
    getWidgetType: function() {
      return WidgetConstants.D2.COLLECTIONS;
    },
    resolveDataForTable: function() {
      return this.checkDataFetchedWithContext();
    }
  });
});