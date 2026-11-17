/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/log", "csui/controls/form/pub.sub", "d2/models/mixins/expressions/expression", "dctmw/models/mixins/expressions/expression.executor.mixin", "d2/utils/mass.update.utils" ], function(module, _, Backbone, log, PubSub, ExpressionModel, DctmwExpressionExecutorMixin, MassUpdateUtils) {
  "use strict";
  log = log(module.id);
  var ExpressionExecutorMixin = {
    mixin: function(prototype) {
      prototype = DctmwExpressionExecutorMixin.mixin(prototype);
      return _.extend(prototype, {
        getValueForConditionEvaluation: function(sourceView, targetControl) {
          var me = this;
          return function(sourceControlName) {
            var sourceControlPathObj = sourceView._keyPathMap[sourceControlName];
            if (sourceControlPathObj) {
              var sourceViewForm = me.getParentFormForControl(sourceControlName);
              var alpControl = sourceViewForm.getAlpacaControlByPath(sourceControlPathObj.fieldPath);
              var value;
              if (_.isArray(alpControl)) {
                var rowControl = sourceViewForm.shouldApplyRowBasedEvaluation(targetControl, sourceControlName);
                alpControl = rowControl ? [ rowControl ] : alpControl;
                value = _.pluck(alpControl, "data");
              } else {
                value = alpControl.getValue();
              }
              value = _.isArray(alpControl) && alpControl[0].options && alpControl[0].options.massUpdateFileCount || alpControl.options && alpControl.options.massUpdateFileCount ? MassUpdateUtils.convertMultipleValues(value) : value;
              return new ExpressionModel(value, alpControl);
            }
          };
        },
        getValueForEvaluateBeforeRender: function() {
          var me = this;
          return function(controlName) {
            var controlPathObj = me._keyPathMap[controlName];
            if (controlPathObj) {
              var formId = controlPathObj.formId;
              var fieldPath = controlPathObj.fieldPath;
              var formModel = me.model.collection.get(formId);
              var val = me.getFieldForPath(formModel.get("data"), "", ".", fieldPath);
              var option = me.getFieldForPath(formModel.get("options"), "fields", ".", fieldPath);
              var type = {
                options: {
                  _type: option._type
                }
              };
              var control = type;
              if (option._repeating === true) {
                control = [];
                _.each(val, function() {
                  control.push(_.clone(type));
                });
              }
              val = option && option.massUpdateFileCount ? MassUpdateUtils.convertMultipleValues(val) : val === null ? "" : val;
              return new ExpressionModel(val, control);
            }
          };
        }
      });
    }
  };
  return ExpressionExecutorMixin;
});