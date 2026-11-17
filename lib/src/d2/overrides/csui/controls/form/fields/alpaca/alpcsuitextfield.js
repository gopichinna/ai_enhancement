/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/form/fields/alpaca/alpcsuitextfield", "d2/utils/format.utils", "d2/utils/mass.update.utils", "i18n!d2/utils/impl/nls/lang" ], function(_, CsuiTextField, formatUtils, MassUpdateUtils, lang) {
  const prototype = CsuiTextField.prototype, oPerformDateValidation = prototype.performDateValidation;
  _.extend(prototype, {
    performAdditionalValidation: function(baseValidationStatus) {
      if (!baseValidationStatus && this.options.massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.getValue())) {
        var valInfo = this.validation;
        valInfo["stringTooLong"]["status"] = true;
        valInfo["stringTooLong"]["message"] = "";
        baseValidationStatus = true;
      }
      return baseValidationStatus;
    },
    performDateValidation: function(isValid, value) {
      const arrayValidations = this.validation;
      if (!isValid && arrayValidations["disallowValue"] && (!MassUpdateUtils.fieldHasMultipleValues(value) || !this.options.massUpdateFileCount)) {
        arrayValidations["disallowValue"]["status"] = false;
        arrayValidations["disallowValue"]["message"] = _.str.sformat(lang.massUpdateInvalidDate, formatUtils.getCurrentDateFormat());
      } else {
        isValid = oPerformDateValidation.apply(this, arguments);
      }
      return isValid;
    }
  });
});