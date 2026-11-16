/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/alpaca/alpcsuitextareafield", "d2/utils/form.utils", "d2/utils/mass.update.utils" ], function(_, $, Alpaca, CsuiTextArea, FormUtils, MassUpdateUtils) {
  var prototype = CsuiTextArea.prototype;
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