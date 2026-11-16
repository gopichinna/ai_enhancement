/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/table/cells/name/name.view", "csui/controls/table/cells/date/date.view", "i18n!csui/controls/table/impl/nls/lang" ], function(_, NameCellView, DateCellView, lang) {
  "use strict";
  var prototype = NameCellView.prototype, NameCellGetValueData = prototype.getValueData, DateCellGetValueData = DateCellView.prototype.getValueData, DateCellFormatFunction = DateCellView.prototype.formatFunction;
  prototype.formatFunction = DateCellFormatFunction;
  prototype.getValueData = function() {
    var valueData = NameCellGetValueData.apply(this, arguments), column = this.options.column;
    if (column.attributes.type === -7) {
      valueData.name = DateCellGetValueData.apply(this, arguments).formattedValue;
      valueData.nameAria = _.str.sformat(lang.nameAria, valueData.name);
    }
    return valueData;
  };
});