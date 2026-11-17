/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/controls/table/cells/text/text.view", "csui/controls/table/cells/cell.registry", "css!csui/controls/table/cells/order/impl/order" ], function(_, TextCellView, cellViewRegistry) {
  "use strict";
  const OrderCellView = TextCellView.extend({}, {
    hasFixedWidth: true,
    columnClassName: "csui-table-cell-order"
  });
  cellViewRegistry.registerByDataType(136, OrderCellView);
  cellViewRegistry.registerByColumnKey("order", OrderCellView);
  return OrderCellView;
});