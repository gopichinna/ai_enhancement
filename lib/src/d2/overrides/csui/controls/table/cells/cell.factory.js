/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/table/cells/cell.registry", "csui/controls/table/cells/cell.factory" ], function(_, cellViewRegistry, CellViewFactory) {
  "use strict";
  var originalGetCellView = CellViewFactory.getCellView;
  CellViewFactory.getCellView = function(columnDefinition) {
    if (columnDefinition.get("column_key") === "parent_id" && columnDefinition.get("isNaming") === true) {
      return cellViewRegistry.getCellView(columnDefinition);
    } else {
      return originalGetCellView.call(this, columnDefinition);
    }
  };
});