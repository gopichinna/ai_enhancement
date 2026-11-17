/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/controls/table/cells/name/name.view", "csui/controls/table/cells/date/date.view", "d2/utils/graphics/graphics.evaluator", "d2/utils/graphics/graphics.resources", "i18n!csui/controls/table/impl/nls/lang" ], function($, _, NameCellView, DateCellView, GraphicsEvaluator, GraphicsResources, lang) {
  "use strict";
  var prototype = NameCellView.prototype, NameCellGetValueData = prototype.getValueData, NameCellRenderValue = prototype.renderValue, DateCellGetValueData = DateCellView.prototype.getValueData, DateCellFormatFunction = DateCellView.prototype.formatFunction;
  prototype.formatFunction = DateCellFormatFunction;
  prototype.getValueData = function() {
    var valueData = NameCellGetValueData.apply(this, arguments), column = this.options.column;
    if (column.attributes.type === -7) {
      valueData.name = DateCellGetValueData.apply(this, arguments).formattedValue;
      valueData.nameAria = _.str.sformat(lang.nameAria, valueData.name);
    }
    return valueData;
  }, prototype.renderValue = function() {
    NameCellRenderValue.apply(this, arguments);
    var rule = GraphicsEvaluator.evaluateColumnGraphics(GraphicsResources.getGraphicsRules(), this.model, this.options.column);
    if (rule) {
      this.$el.addClass("d2-table-cell-graphic-name");
      var textElement = this.$el.has(".csui-table-cell-name-link-text").length ? this.$el.find(".csui-table-cell-name-link-text") : this.$el.find(".csui-table-cell-name-value");
      rule.get("icon") && $('<img class="d2-graphic-icon" src="' + rule.get("icon") + '"/>').insertBefore(textElement);
      if (rule.get("is_icon_only")) {
        textElement.remove();
      } else {
        rule.get("color") && this.$el.css("color", rule.get("color"));
        rule.get("color") && this.$el.find("a, p").css("color", rule.get("color"));
        rule.get("background") && this.$el.css("background-color", rule.get("background"));
      }
    }
  };
});