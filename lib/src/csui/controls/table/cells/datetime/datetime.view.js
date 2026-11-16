/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/table/cells/date/date.view", "csui/controls/table/cells/cell.registry", "csui/utils/base" ], function(DateCellView, cellViewRegistry, base) {
  var DateTimeCellView = DateCellView.extend({
    formatFunction: base.formatDateTime
  });
  cellViewRegistry.registerByDataType(401, DateTimeCellView);
  return DateTimeCellView;
});