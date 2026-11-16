/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/log", "d2/utils/format.utils" ], function(module, _, Backbone, log, formatUtils) {
  "use strict";
  log = log(module.id);
  var ExpressionGeneratorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        expressionGenerator: function() {
          return this;
        },
        processExpressions: function(expressions) {
          var expList = [];
          for (var control in expressions) {
            if (Object.prototype.hasOwnProperty.call(expressions, control)) {
              var exp = expressions[control];
              if (!_.isEmpty(exp)) {
                for (var key in exp) {
                  if (Object.prototype.hasOwnProperty.call(exp, key)) {
                    var methodName = key;
                    var expMethod = exp[key];
                    var expMethods = _.isArray(expMethod) ? expMethod : [ expMethod ];
                    for (var index in expMethods) {
                      var method = expMethods[index];
                      var e = this.parse(method, methodName);
                      expList.push({
                        sourceControl: control,
                        methodName: key,
                        function: e.method,
                        controls: e.controls,
                        events: [ "change" ]
                      });
                    }
                  }
                }
              }
            }
          }
          return expList;
        },
        parse: function(method, methodName) {
          var re = /("getValue\(([\w\-]*)\)")|('getValue\(([\w\-]*)\)')|getValue\(([\w\-]*)\)/g;
          var myArray;
          var controls = [];
          while ((myArray = re.exec(method)) !== null) {
            var cName = myArray[2] || myArray[4] || myArray[5];
            controls.push(cName);
            var matchStr = myArray[0];
            var replaceStr = "getValue('" + cName + "')";
            method = method.replace(matchStr, replaceStr);
          }
          if (methodName === "setValid") {
            var todayRE = /(\.(?:equals|notEquals|isGreaterThan|isGreaterOrEqualsThan|isLessThan|isLessOrEqualsThan)\(([^)]*)\))/g;
            while ((myArray = todayRE.exec(method)) !== null) {
              if (myArray && myArray.length === 3 && myArray[2]) {
                var _date = myArray[2];
                _date = _date.replace(/'/g, "");
                if (formatUtils.isDateValue(_date)) {
                  method = method.replace(_date, "$TODAY");
                }
              }
            }
          }
          controls = _.uniq(controls);
          return {
            method: method,
            controls: controls
          };
        }
      });
    }
  };
  return ExpressionGeneratorMixin;
});