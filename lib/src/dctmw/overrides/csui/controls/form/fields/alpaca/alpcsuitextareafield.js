/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/form/fields/alpaca/alpcsuitextareafield", "dctmw/utils/form.utils" ], function(_, CsuiTextArea, FormUtils) {
  "use strict";
  const prototype = CsuiTextArea.prototype, oldHandleValidate = prototype.handleValidate, oldIsRequired = prototype.isRequired, oldIsValidationParticipant = prototype.isValidationParticipant;
  _.extend(prototype, {
    handleValidate: function() {
      var isValid = oldHandleValidate.apply(this, arguments);
      isValid = this.performAdditionalValidation(isValid);
      return FormUtils.handleValidationForRequiredField(this, isValid);
    },
    performAdditionalValidation: function(isValid) {
      return isValid;
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
    }
  });
});