/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/controls/table/cells/date/date.view", "d2/utils/graphics/graphics.evaluator", "d2/utils/graphics/graphics.resources", "i18n!csui/controls/thumbnail/content/name/impl/nls/localized.strings", "css!d2/overrides/csui/controls/thumbnail/thumbnail.css" ], function($, _, DateCellView, GraphicsEvaluator, GraphicsResources, lang) {
  require([ "csui/controls/thumbnail/content/name/name.view", "csui/controls/thumbnail/content/text/text.view" ], function(ThumbnailNameView, ThumbnailTextView) {
    "use strict";
    var prototype = ThumbnailNameView.prototype, ThumbnailTemplateHelpers = prototype.templateHelpers, ThumbnailOnRender = prototype.onRender, DateCellFormatFunction = DateCellView.prototype.formatFunction;
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
    prototype.onRender = function() {
      ThumbnailOnRender.apply(this, arguments);
      var rule = GraphicsEvaluator.evaluateColumnGraphics(GraphicsResources.getGraphicsRules(), this.model, this.options.column);
      if (rule) {
        this.$el.addClass("d2-thumbnail-cell-graphic-name");
        var textElement = this.$el.has(".csui-thumbnail-name-link-text").length ? this.$el.find(".csui-thumbnail-name-link-text") : this.$el.find(".csui-thumbnail-name-value"), nameContainer = this.$el.find(".csui-thumbnail-name");
        rule.get("icon") && $('<img class="d2-graphic-icon" src="' + rule.get("icon") + '"/>').insertBefore(textElement);
        if (rule.get("is_icon_only")) {
          textElement.remove();
        } else {
          rule.get("color") && nameContainer.css("color", rule.get("color"));
          rule.get("color") && nameContainer.find("a, .csui-thumbnail-no-default-action").css("color", rule.get("color"));
          rule.get("background") && nameContainer.css("background-color", rule.get("background"));
        }
      }
    };
  });
});