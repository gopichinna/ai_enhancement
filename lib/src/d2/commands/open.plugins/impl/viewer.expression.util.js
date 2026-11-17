/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/moment", "d2/utils/format.utils", "dctmw/models/mixins/expressions/expression.generator.mixin", "d2/models/mixins/expressions/expression" ], function(_, moment, FormatUtils, ExpressionGeneratorMixin, ExpressionModel) {
  "use strict";
  function viewerUtils(documentObject) {
    this.model = documentObject;
  }
  _.extend(viewerUtils.prototype, {
    evaluateExpression: function(expConfig) {
      var expressionParse = this.parse(expConfig);
      var value = this.evaluate(expressionParse.method, this.getValue.bind(this));
      return value;
    },
    getValue: function(controlName) {
      var value = this.model.get(controlName);
      var control = this.getControl(value);
      return new ExpressionModel(value, control);
    },
    getControl: function(value) {
      var typeFromVal = this.findType(value);
      var type = {
        options: {
          _type: typeFromVal
        }
      };
      var control = type;
      if (typeFromVal === "array") {
        control = [];
        var me = this;
        _.each(value, function(val) {
          var subTypeFromVal = me.findType(val);
          var subType = _.clone(type);
          subType.options["_type"] = subTypeFromVal;
          control.push(subType);
        });
      }
      return control;
    },
    findType: function(value) {
      var type;
      if (!_.isUndefined(value) && !_.isNull(value)) {
        if (_.isArray(value)) {
          type = "array";
        } else if (_.isNumber(value)) {
          type = "integer";
        } else if (value && FormatUtils.isValidDate(value)) {
          type = "datetime";
        } else if (_.isString(value) || _.isBoolean(value)) {
          type = "string";
        }
      }
      return type || "string";
    },
    evaluate: function(fn, valFn) {
      var getValue = valFn;
      var value;
      try {
        value = eval(fn);
      } catch (e) {
        console.error("Error evaluating " + fn, e);
      }
      return value;
    }
  });
  ExpressionGeneratorMixin.mixin(viewerUtils.prototype);
  return viewerUtils;
});