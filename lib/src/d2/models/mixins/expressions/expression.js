/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/models/mixins/expressions/expression" ], function(_, DctmwExpressionModel) {
  var ExpressionModel = DctmwExpressionModel.extend({
    equals: function(val) {
      if (val instanceof ExpressionModel) {
        val = val.value;
      }
      if (val === "#####") {
        return this.value === "#####" || _.contains(this.value, "#####");
      }
      return DctmwExpressionModel.prototype.equals.call(this, val);
    },
    isGreaterOrEqualsThan: function(val) {
      if (val instanceof ExpressionModel) {
        val = val.value;
      }
      if (this.value === "#####" && val === "#####") {
        return true;
      }
      return DctmwExpressionModel.prototype.isGreaterOrEqualsThan.call(this, val);
    },
    isLessOrEqualsThan: function(val) {
      if (val instanceof ExpressionModel) {
        val = val.value;
      }
      if (this.value === "#####" && val === "#####") {
        return true;
      }
      return DctmwExpressionModel.prototype.isLessOrEqualsThan.call(this, val);
    }
  });
  return ExpressionModel;
});