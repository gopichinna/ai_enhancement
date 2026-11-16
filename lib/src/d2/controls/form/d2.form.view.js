/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "csui/controls/form/form.view", "d2/widgets/metadata/general.panels/d2/d2.general.form.view", "i18n!d2/widgets/metadata/general.panels/d2/impl/nls/lang", "css!d2/controls/form/impl/d2form/d2.form" ], function(_, Backbone, FormView, D2GeneralFormView, lang) {
  "use strict";
  var D2FormView = D2GeneralFormView.extend({
    className: function() {
      var classname = "cs-form csui-general-form d2-form";
      if (this.options.topAlignedLabel) {
        classname += " csui-top-align-label";
      }
      return classname;
    },
    constructor: function D2FormView(options) {
      options = options || {};
      options.visiblityEvent = true;
      FormView.prototype.constructor.call(this, options);
      _.defaults(this.options, {
        originatingView: this
      });
      if (!this.model.collection) {
        var formCollection = new Backbone.Collection();
        formCollection.set([ this.model ]);
      }
      this.listenTo(this, "change:field", this._changeField);
    },
    initializeExpressions: function() {
      this._keyPathMap = this.model.get("_keyPathMap");
      this.expressionExecutor(this.options);
      this.expressionGenerator(this.options);
      this.expressionValidator(this.options);
      var modelExpr = this.model.get("expressions");
      this.expressions = this.processExpressions(modelExpr);
      var exp = _.partition(this.expressions, function(e) {
        return e && e.methodName === "setValid";
      });
      this.expressions = exp[1];
      _.each(exp[0], function(ve) {
        if (ve && ve.sourceControl) {
          var validator;
          var c = this.getFieldForPath(this.model.get("options"), "fields", ".", ve.sourceControl);
          if (!c._custom_validator) {
            return;
          }
          var errMsg = c._custom_validator.message ? c._custom_validator.message : lang.validationErrorMsg;
          if (c._custom_validator.regEx === false) {
            validator = this.createExpressionValidator(ve.function, errMsg);
            if (c._custom_validator.isDateValidator) {
              this.expressions.push(ve);
            }
          } else {
            validator = this.createRegExValidator(c._custom_validator.expression, errMsg);
          }
          c.validator = validator;
          c.validate = true;
          c.hideInitValidationError = true;
          delete c._custom_validator;
        }
      }, this);
      this.initFormRequired = this.hasFormRequired();
      this.initExpressions();
    },
    onBeforeRender: function() {
      this.initializeExpressions();
      if (_.isFunction(D2GeneralFormView.prototype.onBeforeRender)) {
        D2GeneralFormView.prototype.onBeforeRender.apply(this, arguments);
      }
    },
    getParentFormForControl: function(controlName) {
      var controlPathObj = this._keyPathMap[controlName];
      return this.model.get("id") === controlPathObj?.formId ? this : null;
    }
  });
  return D2FormView;
});