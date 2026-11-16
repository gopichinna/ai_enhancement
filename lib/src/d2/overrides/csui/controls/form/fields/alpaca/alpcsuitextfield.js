/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/form/fields/alpaca/alpcsuitextfield", "d2/utils/form.utils", "d2/utils/format.utils", "d2/utils/mass.update.utils", "i18n!d2/utils/impl/nls/lang" ], function(_, $, CsuiTextField, FormUtils, formatUtils, MassUpdateUtils, lang) {
  var prototype = CsuiTextField.prototype;
  var oldHandleValidate = prototype.handleValidate;
  var oldIsRequired = prototype.isRequired;
  var oldIsValidationParticipant = prototype.isValidationParticipant;
  prototype.handleValidate = function() {
    var isValid = oldHandleValidate.apply(this, arguments);
    if (!isValid && this.options.massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.getValue())) {
      var valInfo = this.validation;
      valInfo["stringTooLong"]["status"] = true;
      valInfo["stringTooLong"]["message"] = "";
      isValid = true;
    }
    if (this.options._type === "date" && !this.isEmpty()) {
      var arrayValidations = this.validation;
      var value = this.getValue();
      isValid = value && formatUtils.getDateValidated(value);
      if (!isValid && arrayValidations["disallowValue"] && (!MassUpdateUtils.fieldHasMultipleValues(value) || !this.options.massUpdateFileCount)) {
        arrayValidations["disallowValue"]["status"] = false;
        arrayValidations["disallowValue"]["message"] = _.str.sformat(lang.massUpdateInvalidDate, formatUtils.getCurrentDateFormat());
      } else {
        arrayValidations["disallowValue"]["status"] = true;
        arrayValidations["disallowValue"]["message"] = "";
      }
    }
    return FormUtils.handleValidationForRequiredField(this, isValid);
  };
  prototype._validateOptional = function() {
    return FormUtils._validateOptional(this);
  };
  prototype.isValidationParticipant = function() {
    var result = oldIsValidationParticipant.apply(this, arguments);
    return result && !this.schema.disabled;
  };
  prototype.isRequired = function() {
    var result = oldIsRequired.apply(this, arguments);
    return result && !this.schema.disabled;
  };
});