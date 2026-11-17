/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/form/fields/alpaca/alpcsuitextfield", "dctmw/utils/form.utils", "dctmw/utils/format.utils" ], function(_, CsuiTextField, FormUtils, FormatUtils) {
  "use strict";
  const prototype = CsuiTextField.prototype, oldHandleValidate = prototype.handleValidate, oldIsRequired = prototype.isRequired, oldIsValidationParticipant = prototype.isValidationParticipant;
  _.extend(prototype, {
    performAdditionalValidation: function(isValid) {
      return isValid;
    },
    performDateValidation: function(isValid) {
      const arrayValidations = this.validation;
      if (isValid && arrayValidations["disallowValue"]) {
        arrayValidations["disallowValue"]["status"] = true;
        arrayValidations["disallowValue"]["message"] = "";
      }
      return isValid;
    },
    handleValidate: function() {
      var isValid = oldHandleValidate.apply(this, arguments);
      isValid = this.performAdditionalValidation(isValid, this.getValue());
      if (this.options._type === "date" && !this.isEmpty()) {
        const value = this.getValue();
        isValid = value && FormatUtils.getDateValidated(value);
        this.performDateValidation(isValid, value);
      }
      return FormUtils.handleValidationForRequiredField(this, isValid);
    },
    _validateOptional: function() {
      return FormUtils._validateOptional(this);
    },
    isValidationParticipant: function() {
      var result = oldIsValidationParticipant.apply(this, arguments);
      return result && !this.schema.disabled;
    },
    isRequired: function() {
      var result = oldIsRequired.apply(this, arguments);
      return result && !this.schema.disabled;
    },
    setValueAndValidate: function(value, validate) {
      this.setValue(value);
      var bIsValid = true;
      if (validate) {
        bIsValid = this.validate();
        this.refreshValidationState(false);
      }
      this.fieldView.ui.writeField.val(value);
      return bIsValid;
    }
  });
});