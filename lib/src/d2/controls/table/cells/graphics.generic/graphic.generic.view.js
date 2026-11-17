/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/types/date", "csui/controls/table/cells/templated/templated.view", "d2/utils/graphics/graphics.evaluator", "d2/utils/graphics/graphics.resources", "hbs!d2/controls/table/cells/graphics.generic/impl/graphic.generic", "css!d2/controls/table/cells/graphics.generic/impl/graphic.generic" ], function(require, $, _, date, TemplatedCellView, GraphicsEvaluator, GraphicsResources, template) {
  "use strict";
  var GenericCellView = TemplatedCellView.extend({
    className: "d2-graphic-generic-cell csui-nowrap",
    needsAriaLabel: true,
    template: template,
    constructor: function GenericCellView() {
      TemplatedCellView.prototype.constructor.apply(this, arguments);
    },
    renderValue: function() {
      var text = this.getValueText(), isEmpty = text === undefined || text.length === 0, templateOptions = {
        value: text,
        isEmpty: isEmpty
      }, rule = GraphicsEvaluator.evaluateColumnGraphics(GraphicsResources.getGraphicsRules(), this.model, this.options.column);
      if (rule) {
        templateOptions.showText = !rule.get("is_icon_only");
        templateOptions.showIcon = rule.get("icon") && rule.get("icon") !== "";
        templateOptions.iconUrl = rule.get("icon");
      } else {
        templateOptions.showText = true;
        templateOptions.showIcon = false;
        templateOptions.iconUrl = "";
      }
      if (this.options.displayLabel) {
        templateOptions.displayLabel = true;
        templateOptions.label = this.options.column.title || this.options.column.name || "";
      }
      var html = this.template(templateOptions);
      this.$el.html(html);
      this._applyStyles(rule);
    },
    _applyStyles: function(rule) {
      if (rule && !rule.get("is_icon_only")) {
        var $styleElement = this.options.displayLabel ? this.$el.find(".d2-graphic-column-container") : this.$el;
        rule.get("color") && $styleElement.css("color", rule.get("color"));
        rule.get("background") && $styleElement.css("background-color", rule.get("background"));
      }
    },
    formatFunction: function(value, options) {
      return options && options.includeTime ? date.formatExactDateTime(value) : date.formatExactDate(value);
    },
    getValueData: function() {
      var column = this.options.column;
      var propertyValue = this.model.get(column.name);
      if (column.type === -7 || column.attributes?.type === -7) {
        var formatOptions = {
          includeTime: column.include_time !== false && column.attributes?.include_time !== false
        };
        var formatFunction = this.formatFunction;
        return this.getSingleOrMultipleValueData(propertyValue, function(singleValue) {
          return formatFunction(singleValue, formatOptions);
        }, function(singleValue) {
          return formatFunction(singleValue, formatOptions);
        });
      } else {
        return this.getSingleOrMultipleValueText(propertyValue);
      }
    },
    getValueText: function() {
      var column = this.options.column;
      if (column.type === -7 || column.attributes?.type === -7) {
        return this.getValueData().formattedValue;
      } else {
        return this.getValueData();
      }
    },
    getContentView: function() {
      return this;
    }
  }, {
    flexibleWidth: false,
    columnClassName: "csui-table-cell-date-d2",
    getValue: function(model, column) {
      var value = TemplatedCellView.getValue(model, column);
      if (column.type === -7 || column.attributes?.type === -7) {
        return value && date.deserializeDate(value);
      } else {
        return value;
      }
    }
  });
  return GenericCellView;
});