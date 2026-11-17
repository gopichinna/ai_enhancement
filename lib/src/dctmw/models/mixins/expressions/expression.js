/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "dctmw/utils/format.utils" ], function(_, Backbone, formatUtils) {
  var ARRAY = "array";
  var STRING = "string";
  var DATE = "date";
  var DATETIME = "datetime";
  var DOUBLE = "double";
  var INTEGER = "integer";
  var BOOLEAN = "boolean";
  var keyMap = {
    T: "1",
    F: "0",
    true: "1",
    false: "0",
    True: "1",
    False: "0",
    TRUE: "1",
    FALSE: "0"
  };
  var ExpressionModel = Backbone.Model.extend({
    constructor: function(value, control, isValidationCheck) {
      this.value = value;
      this.type = control && control.options ? control.options._type : this.findType(value);
      if (this.type === ARRAY && control && control[0] && control[0].options && control[0].options._type) {
        this.subType = control[0].options._type;
      }
      this.isValidationCheck = isValidationCheck;
      this.useDefaultFormat = control && control.options && control.options._useDefaultFormat ? control.options._useDefaultFormat : false;
      Backbone.Model.apply(this, arguments);
    },
    hasEmptyValues: function(source, destination) {
      source = this.type === ARRAY && !_.isUndefined(source) && source?.length == 1 ? _.isEmpty(source[0]) ? source[0] : source : source;
      if (this.isValidationCheck || this.useDefaultFormat) {
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
      if (this.hasEmptyValues(this.value, val)) {
        if (this.isValidationCheck) {
          return true;
        } else {
          var leftInputVal = this.type === ARRAY && !_.isUndefined(this.value) && this.value?.length == 1 ? this.value[0] : this.value;
          var leftVal = _.isUndefined(leftInputVal) || _.isNull(leftInputVal) || _.isEmpty(leftInputVal) ? "" : leftInputVal;
          var rightVal = _.isUndefined(val) || _.isNull(val) || _.isEmpty(val) ? "" : val;
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
        if (this.useDefaultFormat && this.subType && (this.subType === "date" || this.subType === "datetime")) {
          for (var k = 0; k < desArray.length; k++) {
            desArray[k] = formatUtils.defaultFormatDate(desArray[k], "MM-DD-YYYY");
          }
          desArray = _.sortBy(desArray, function(num) {
            return num._d;
          });
        } else if (this.useDefaultFormat && this.subType && this.subType === "boolean") {
          for (var j = 0; j < desArray.length; j++) {
            desArray[j] = keyMap[desArray[j]] || desArray[j];
          }
          desArray.sort();
        } else desArray.sort();
        for (var i = 0; i < srcArray.length; i++) {
          if (_.isNull(srcArray[i]) || _.isNull(desArray[i]) || _.isUndefined(srcArray[i]) || _.isUndefined(desArray[i])) {
            return false;
          }
          if (this.subType && (this.subType === "date" || this.subType === "datetime")) {
            var dateOnly = this.subType === "date";
            var secondDateParameter = this.useDefaultFormat ? desArray[i]._i.toString() : desArray[i].toString();
            if (!formatUtils.compareDate(srcArray[i].toString(), secondDateParameter, "=", dateOnly, this.useDefaultFormat)) {
              return false;
            }
          } else if (this.subType && this.subType === "boolean") {
            if (!this.compareValues(srcArray[i], desArray[i])) return false;
          } else if (srcArray[i].toString() !== desArray[i].toString()) {
            return false;
          }
        }
        return true;

       case DATE:
        if (this.value === "" && val === "") {
          return true;
        }
        return formatUtils.compareDate(this.value, val, "=", true, this.useDefaultFormat);

       case DATETIME:
        if (this.value === "" && val === "") {
          return true;
        }
        return formatUtils.compareDate(this.value, val, "=", false, this.useDefaultFormat);

       case DOUBLE:
       case INTEGER:
        return parseFloat(this.value) === parseFloat(val);

       case BOOLEAN:
        return this.compareValues(this.value, val);

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
          if (this.subType && (this.subType === "date" || this.subType === "datetime")) {
            var dateOnly = this.subType === "date";
            if (formatUtils.compareDate(this.value[i].toString(), val.toString(), "=", dateOnly, this.useDefaultFormat)) {
              return true;
            }
          } else if (this.subType && this.subType === "boolean") {
            if (this.compareValues(this.value[i], val)) return true;
          } else if (this.value[i] && this.value[i].toString().indexOf(val.toString()) !== -1) {
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
        return formatUtils.compareDate(this.value, val, ">", true, this.useDefaultFormat);

       case DATETIME:
        return formatUtils.compareDate(this.value, val, ">", false, this.useDefaultFormat);

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
      if (this.hasEmptyValues(this.value, val)) {
        return !!this.isValidationCheck;
      }
      switch (this.type) {
       case ARRAY:
        console.error(this.type + ".prototype.isGreaterOrEqualsThan() not defined ! ");
        break;

       case DATE:
        return formatUtils.compareDate(this.value, val, ">=", true, this.useDefaultFormat);

       case DATETIME:
        return formatUtils.compareDate(this.value, val, ">=", false, this.useDefaultFormat);

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
        return formatUtils.compareDate(this.value, val, "<", true, this.useDefaultFormat);

       case DATETIME:
        return formatUtils.compareDate(this.value, val, "<", false, this.useDefaultFormat);

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
      if (this.hasEmptyValues(this.value, val)) {
        return !!this.isValidationCheck;
      }
      switch (this.type) {
       case ARRAY:
        console.error(this.type + ".prototype.isLessOrEqualsThan() not defined ! ");
        break;

       case DATE:
        return formatUtils.compareDate(this.value, val, "<=", true, this.useDefaultFormat);

       case DATETIME:
        return formatUtils.compareDate(this.value, val, "<=", false, this.useDefaultFormat);

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
        if (this.subType && this.subType === "date") {
          return formatUtils.compareDate(this.value[0].toString(), val.toString(), "=", true, this.useDefaultFormat);
        } else if (this.subType && this.subType === "boolean") {
          return this.compareValues(this.value[0], val.toString());
        }
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
        if (this.subType && this.subType === "date") {
          return formatUtils.compareDate(this.value[this.value.length - 1].toString(), val.toString(), "=", true, this.useDefaultFormat);
        } else if (this.subType && this.subType === "boolean") {
          return this.compareValues(this.value[this.value.length - 1], val.toString());
        }
        return this.value[this.value.length - 1].toString() === val.toString();

       default:
        var lastIndex = this.value.toString().lastIndexOf(val.toString());
        return lastIndex == -1 ? false : lastIndex === this.value.toString().length - val.toString().length;
      }
    },
    dateDiff: function(val) {
      if (val instanceof ExpressionModel) {
        val = val.value;
      }
      if (this.hasEmptyValues(this.value, val)) {
        return !!this.isValidationCheck;
      }
      switch (this.type) {
       case DATE:
       case DATETIME:
        return formatUtils.dateDifference(this.value, val, this.useDefaultFormat);

       default:
        console.error(this.type + ".prototype.dateDiff() not defined ! ");
      }
    },
    compareValues: function(clientSideValue, serverSideValue) {
      var clientSideStr = clientSideValue.toString();
      var serverSideStr = serverSideValue.toString();
      var normalizedClientVal = keyMap[clientSideStr] || clientSideStr;
      var normalizedServerVal = keyMap[serverSideStr] || serverSideStr;
      return normalizedClientVal === normalizedServerVal;
    },
    UPPER: function() {
      if (_.isUndefined(this.value) || _.isNull(this.value) || _.isEmpty(this.value)) return this.value; else {
        if (this.type === ARRAY && this.subType === STRING) {
          var upperValue = [];
          for (var i = 0; i < this.value.length; i++) {
            upperValue.push(this.value[i].toUpperCase());
          }
          return upperValue;
        }
        return this.value.toUpperCase();
      }
    },
    LOWER: function() {
      if (_.isUndefined(this.value) || _.isNull(this.value) || _.isEmpty(this.value)) return this.value; else {
        if (this.type === ARRAY && this.subType === STRING) {
          var lowerValue = [];
          for (var i = 0; i < this.value.length; i++) {
            lowerValue.push(this.value[i].toLowerCase());
          }
          return lowerValue;
        }
        return this.value.toLowerCase();
      }
    }
  });
  return ExpressionModel;
});