/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/table/cells/date/date.view" ], function(DateCellView) {
  require([ "csui/controls/thumbnail/content/text/text.view" ], function(ThumbnailTextView) {
    "use strict";
    var prototype = ThumbnailTextView.prototype, ThumbnailGetValueText = prototype.getValueText, DateCellFormatFunction = DateCellView.prototype.formatFunction;
    prototype.getValueText = function() {
      var valueText = ThumbnailGetValueText.apply(this, arguments), column = this.options.column, columns = this.options.columns, columnAttributes = columns && columns.findWhere({
        column_key: column.key
      }) ? columns.findWhere({
        column_key: column.key
      }).attributes : {};
      if (columnAttributes?.type === -7) {
        var formatOptions = {
          includeTime: columnAttributes.include_time !== false
        };
        var formatFunction = DateCellFormatFunction;
        var formatter = function(singleValue) {
          return formatFunction(singleValue, formatOptions);
        };
        valueText = this.getSingleOrMultipleValueText(valueText, formatter);
      }
      return valueText;
    };
  });
});