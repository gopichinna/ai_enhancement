/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/log", "d2/models/mixins/expressions/expression", "dctmw/models/mixins/expressions/expression.validator.mixin", "d2/utils/mass.update.utils" ], function(module, _, Backbone, log, ExpressionModel, DctmwExpressionValidatorMixin, MassUpdateUtils) {
  "use strict";
  log = log(module.id);
  var ExpressionValidatorMixin = {
    mixin: function(prototype) {
      prototype = DctmwExpressionValidatorMixin.mixin(prototype);
      return _.extend(prototype, {
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
        },
        getPreExpressionValue: function(control) {
          var value = control.getValue();
          value = control.options && control.options.massUpdateFileCount ? MassUpdateUtils.convertMultipleValues(value) : value;
          return value;
        }
      });
    }
  };
  return ExpressionValidatorMixin;
});