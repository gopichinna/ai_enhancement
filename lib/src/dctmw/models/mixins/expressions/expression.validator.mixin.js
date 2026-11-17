/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/log", "dctmw/models/mixins/expressions/expression" ], function(module, _, Backbone, log, ExpressionModel) {
  "use strict";
  log = log(module.id);
  var ExpressionValidatorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        expressionValidator: function() {
          return this;
        },
        getValueForCreateExpressionValidator: function(targetAlpControl) {
          var formView = this;
          return function(controlName) {
            var value;
            var control;
            if (targetAlpControl.propertyId === controlName) {
              value = targetAlpControl.getValue();
              control = targetAlpControl;
            } else {
              var controlPathObj = formView._keyPathMap[controlName];
              if (controlPathObj) {
                var sourceForm = formView.getParentFormForControl(controlName);
                var sourceAlpControl = sourceForm.getAlpacaControlByPath(controlPathObj.fieldPath);
                if (_.isArray(sourceAlpControl)) {
                  control = sourceAlpControl;
                  value = _.pluck(sourceAlpControl, "data");
                } else {
                  value = sourceAlpControl.getValue();
                  control = sourceAlpControl;
                }
              }
            }
            return new ExpressionModel(value, control, true);
          };
        },
        createExpressionValidator: function(condition, message) {
          var formView = this;
          var evtHandler = function(targetAlpControl) {
            var getValue = formView.getValueForCreateExpressionValidator(targetAlpControl);
            return formView.evaluate(condition, getValue);
          };
          var validator = function(callback) {
            var value = evtHandler(this);
            if (!value) {
              callback({
                status: false,
                message: message
              });
            } else {
              callback({
                status: true
              });
            }
          };
          return validator;
        },
        getPreExpressionValue: function(control) {
          return control.getValue();
        },
        createRegExValidator: function(condition, message) {
          var me = this;
          var validator = function(callback) {
            var value = me.getPreExpressionValue(this);
            var reg;
            try {
              reg = new RegExp("^(" + condition + ")$");
            } catch (e) {
              console.error("Error creating regex for " + condition, e);
            }
            if (reg) {
              value = typeof value === "number" ? value.toString() : value;
              if (!_.isUndefined(value) && !_.isNull(value) && !_.isEmpty(value) && !reg.test(value)) {
                callback({
                  status: false,
                  message: message
                });
              } else {
                callback({
                  status: true
                });
              }
            }
          };
          return validator;
        }
      });
    }
  };
  return ExpressionValidatorMixin;
});