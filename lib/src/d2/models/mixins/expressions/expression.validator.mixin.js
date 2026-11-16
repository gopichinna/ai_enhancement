/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/log", "d2/models/mixins/expressions/expression", "d2/utils/mass.update.utils" ], function(module, _, Backbone, log, ExpressionModel, MassUpdateUtils) {
  "use strict";
  log = log(module.id);
  var ExpressionValidatorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        expressionValidator: function() {
          return this;
        },
        createExpressionValidator: function(condition, message) {
          var formView = this;
          var evtHandler = function(targetAlpControl) {
            var getValue = function(controlName) {
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
                    var rowControl = formView.shouldApplyRowBasedEvaluation(targetAlpControl, controlName);
                    if (rowControl) {
                      control = rowControl;
                      value = rowControl.getValue();
                    } else {
                      control = sourceAlpControl;
                      value = _.pluck(sourceAlpControl, "data");
                    }
                  } else {
                    value = sourceAlpControl.getValue();
                    control = sourceAlpControl;
                  }
                }
              }
              value = _.isArray(control) && control[0].options && control[0].options.massUpdateFileCount || control.options && control.options.massUpdateFileCount ? MassUpdateUtils.convertMultipleValues(value) : value;
              return new ExpressionModel(value, control, true);
            };
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
        createRegExValidator: function(condition, message) {
          var validator = function(callback) {
            var value = this.getValue();
            value = this.options && this.options.massUpdateFileCount ? MassUpdateUtils.convertMultipleValues(value) : value;
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