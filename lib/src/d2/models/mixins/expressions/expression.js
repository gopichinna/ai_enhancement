/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "d2/utils/format.utils" ], function(_, Backbone, formatUtils) {
  var ARRAY = "array";
  var STRING = "string";
  var DATE = "date";
  var DATETIME = "datetime";
  var DOUBLE = "double";
  var INTEGER = "integer";
  var ExpressionModel = Backbone.Model.extend({
    constructor: function(value, control, isValidationCheck) {
      this.value = value;
      this.type = control && control.options ? control.options._type : this.findType(value);
      if (this.type === ARRAY && control && control[0] && control[0].options && control[0].options._type) {
        this.subType = control[0].options._type;
      }
      this.isValidationCheck = isValidationCheck;
      Backbone.Model.apply(this, arguments);
    },
    hasEmptyValues: function(source, destination) {
      if (this.isValidationCheck) {
        return _.isUndefined(source) || _.isNull(source) || _.isString(source) && _.isEmpty(source) || _.isUndefined(destination) || _.isNull(destination) || _.isString(destination) && _.isEmpty(destination);
      } else {
        return _.isUndefined(source) || _.isNull(source) || _.isUndefined(destination) || _.isNull(destination);
      }
    },
    findType: function(value) {
      var type;
      if (!_.isUndefined(value) && !_.isNull(value)) {
        if (_.isArray(value)) {
          type = ARRAY;
        } else if (_.isString(value) || _.isBoolean(value)) {
          type = STRING;
        } else if (_.isDate(value)) {
          type = DATE;
        }
      }
      return type || STRING;
    },
    equals: function(val) {
      if (val instanceof ExpressionModel) {
        val = val.value;
      }
      if (val === "#####") {
        return this.value === "#####" || _.contains(this.value, "#####");
      }
      if (this.hasEmptyValues(this.value, val)) {
        if (this.isValidationCheck) {
          return true;
        } else {
          var leftVal = _.isUndefined(this.value) || _.isNull(this.value) ? "" : this.value;
          var rightVal = _.isUndefined(val) || _.isNull(val) ? "" : val;
          return leftVal === rightVal;
        }
      }
      switch (this.type) {
       case ARRAY:
        if (!_.isArray(val)) {
          val = _.isEmpty(val) ? [] : val.toString().split("|");
        }
        var srcArray = _.clone(this.value);
        var desArray = _.clone(val);
        if (srcArray.length !== desArray.length) {
          return false;
        }
        srcArray.sort();
        desArray.sort();
        for (var i = 0; i < srcArray.length; i++) {
          if (_.isNull(srcArray[i]) || _.isNull(desArray[i]) || _.isUndefined(srcArray[i]) || _.isUndefined(desArray[i])) {
            return false;
          }
          if (this.subType && (this.subType === "date" || this.subType === "datetime")) {
            var dateOnly = this.subType === "date";
            if (!formatUtils.compareDate(srcArray[i].toString(), desArray[i].toString(), "=", dateOnly)) {
              return false;
            }
          } else if (srcArray[i].toString() !== desArray[i].toString()) {
            return false;
          }
        }
        return true;

       case DATE:
        if (this.value === "" && val === "") {
          return true;
        }
        return formatUtils.compareDate(this.value, val, "=", true);

       case DATETIME:
        if (this.value === "" && val === "") {
          return true;
        }
        return formatUtils.compareDate(this.value, val, "=");

       case DOUBLE:
       case INTEGER:
        return parseFloat(this.value) === parseFloat(val);

       default:
        if (_.isArray(val)) {
          return false;
        }
        return this.value.toString() === val.toString();
      }
    },
    notEquals: function(val) {
      if (this.isValidationCheck && this.hasEmptyValues(this.value, val)) {
        return true;
      }
      if (ARRAY === this.type) {
        for (var i = 0; i < this.value.length; i++) {
          if (this.value[i] && this.value[i].toString().indexOf(val.toString()) !== -1) {
            return true;
          }
        }
        return false;
      }
      return !this.equals(val);
    },
    contains: function(val) {
      if (val instanceof ExpressionModel) {
        val = val.value;
      }
      if (this.hasEmptyValues(this.value, val)) {
        return !!this.isValidationCheck;
      }
      switch (this.type) {
       case ARRAY:
        for (var i = 0; i < this.value.length; i++) {
          if (this.value[i] && this.value[i].toString().indexOf(val.toString()) !== -1) {
            return true;
          }
        }
        return false;

       default:
        return this.value.toString().indexOf(val.toString()) !== -1;
      }
    },
    notContains: function(val) {
      if (val instanceof ExpressionModel) {
        val = val.value;
      }
      if (this.isValidationCheck && this.hasEmptyValues(this.value, val)) {
        return true;
      }
      return !this.contains(val);
    },
    isGreaterThan: function(val) {
      if (val instanceof ExpressionModel) {
        val = val.value;
      }
      if (this.hasEmptyValues(this.value, val)) {
        return !!this.isValidationCheck;
      }
      switch (this.type) {
       case ARRAY:
        console.error(this.type + ".prototype.isGreaterThan() not defined ! ");
        break;

       case DATE:
        return formatUtils.compareDate(this.value, val, ">", true);

       case DATETIME:
        return formatUtils.compareDate(this.value, val, ">");

       case DOUBLE:
       case INTEGER:
        return parseFloat(this.value) > parseFloat(val);

       default:
        return parseFloat(this.value) > parseFloat(val);
      }
    },
    isGreaterOrEqualsThan: function(val) {
      if (val instanceof ExpressionModel) {
        val = val.value;
      }
      if (this.value === "#####" && val === "#####") {
        return true;
      }
      if (this.hasEmptyValues(this.value, val)) {
        return !!this.isValidationCheck;
      }
      switch (this.type) {
       case ARRAY:
        console.error(this.type + ".prototype.isGreaterOrEqualsThan() not defined ! ");
        break;

       case DATE:
        return formatUtils.compareDate(this.value, val, ">=", true);

       case DATETIME:
        return formatUtils.compareDate(this.value, val, ">=");

       case DOUBLE:
       case INTEGER:
        return parseFloat(this.value) >= parseFloat(val);

       default:
        return parseFloat(this.value) >= parseFloat(val);
      }
    },
    isLessThan: function(val) {
      if (val instanceof ExpressionModel) {
        val = val.value;
      }
      if (this.hasEmptyValues(this.value, val)) {
        return !!this.isValidationCheck;
      }
      switch (this.type) {
       case ARRAY:
        console.error(this.type + ".prototype.isLessThan() not defined ! ");
        break;

       case DATE:
        return formatUtils.compareDate(this.value, val, "<", true);

       case DATETIME:
        return formatUtils.compareDate(this.value, val, "<");

       case DOUBLE:
       case INTEGER:
        return parseFloat(this.value) < parseFloat(val);

       default:
        return parseFloat(this.value) < parseFloat(val);
      }
    },
    isLessOrEqualsThan: function(val) {
      if (val instanceof ExpressionModel) {
        val = val.value;
      }
      if (this.value === "#####" && val === "#####") {
        return true;
      }
      if (this.hasEmptyValues(this.value, val)) {
        return !!this.isValidationCheck;
      }
      switch (this.type) {
       case ARRAY:
        console.error(this.type + ".prototype.isLessOrEqualsThan() not defined ! ");
        break;

       case DATE:
        return formatUtils.compareDate(this.value, val, "<=", true);

       case DATETIME:
        return formatUtils.compareDate(this.value, val, "<=");

       case DOUBLE:
       case INTEGER:
        return parseFloat(this.value) <= parseFloat(val);

       default:
        return parseFloat(this.value) <= parseFloat(val);
      }
    },
    is: function(val) {
      return this.equals(val);
    },
    isNot: function(val) {
      return this.notEquals(val);
    },
    beginWith: function(val) {
      if (val instanceof ExpressionModel) {
        val = val.value;
      }
      if (this.hasEmptyValues(this.value, val)) {
        return !!this.isValidationCheck;
      }
      switch (this.type) {
       case ARRAY:
        return this.value[0].toString() === val.toString();

       default:
        return this.value.toString().indexOf(val.toString()) === 0;
      }
    },
    endWith: function(val) {
      if (val instanceof ExpressionModel) {
        val = val.value;
      }
      if (this.hasEmptyValues(this.value, val)) {
        return !!this.isValidationCheck;
      }
      switch (this.type) {
       case ARRAY:
        return this.value[this.value.length - 1].toString() === val.toString();

       default:
        return this.value.toString().indexOf(val.toString()) === 0;
      }
    }
  });
  return ExpressionModel;
});