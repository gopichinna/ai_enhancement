/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/table/cells/date/date.view", "i18n!csui/controls/thumbnail/content/name/impl/nls/localized.strings", "css!d2/overrides/csui/controls/thumbnail/thumbnail.css" ], function(_, DateCellView, lang) {
  require([ "csui/controls/thumbnail/content/name/name.view", "csui/controls/thumbnail/content/text/text.view" ], function(ThumbnailNameView, ThumbnailTextView) {
    "use strict";
    var prototype = ThumbnailNameView.prototype, ThumbnailTemplateHelpers = prototype.templateHelpers, DateCellFormatFunction = DateCellView.prototype.formatFunction;
    prototype.templateHelpers = function() {
      var origTemplateHelpers = ThumbnailTemplateHelpers.apply(this), column = this.options.column, columns = this.options.columns, columnAttributes = columns && columns.findWhere({
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
        var formatterDate = ThumbnailTextView.prototype.getSingleOrMultipleValueText(origTemplateHelpers.name, formatter);
        origTemplateHelpers.name = formatterDate;
        origTemplateHelpers.nameAria = _.str.sformat(lang.nameAria, formatterDate);
        origTemplateHelpers.nameNoOpenAria = _.str.sformat(lang.nameNoOpenAria, formatterDate);
      }
      return origTemplateHelpers;
    };
  });
});