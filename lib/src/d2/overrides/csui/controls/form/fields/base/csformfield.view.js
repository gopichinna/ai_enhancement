/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "csui/controls/form/fields/base/csformfield.view" ], function($, FormFieldView) {
  var prototype = FormFieldView.prototype;
  prototype.setValue = function(value, validate, silent) {
    var bIsValid = true;
    if (validate) {
      if (this.alpacaField) {
        this.oldVal = this.curVal;
        var defaultValidate = this.alpacaField.options.validate;
        if (this.alpacaField.options.inContainer) {
          var editVal = this.getEditValue();
          if (editVal != null && editVal.trim && editVal.trim()) {
            this.alpacaField.options.validate = true;
          } else {
            var arrayValidations = this.alpacaField.validation;
            for (var validation in arrayValidations) {
              if (arrayValidations[validation] !== undefined) {
                arrayValidations[validation]["status"] = true;
                arrayValidations[validation]["message"] = "";
              }
            }
          }
        }
        bIsValid = this.alpacaField.setValueAndValidate(value, validate);
        this.alpacaField.options.validate = defaultValidate;
      }
    }
    if (bIsValid) {
      this.$el.removeClass("cs-formfield-invalid");
      if (value !== this.curVal) {
        this.curVal = value;
      }
      this.model.set("data", value, {
        silent: !!silent
      });
      this.$el.trigger($.Event("field:valid"), this);
    } else {
      this.model.set("data", value, {
        silent: !!silent
      });
      this.$el.addClass("cs-formfield-invalid");
      var event = $.Event("field:invalid");
      this.$el.trigger(event, this);
    }
    return bIsValid;
  };
});