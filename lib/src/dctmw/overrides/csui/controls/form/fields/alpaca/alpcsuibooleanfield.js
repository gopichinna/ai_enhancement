/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/form/fields/alpaca/alpcsuibooleanfield" ], function(_, $, CsuiBooleanField) {
  var prototype = CsuiBooleanField.prototype;
  var originalSetValueAndValidate = prototype.setValueAndValidate;
  var oldIsRequired = prototype.isRequired;
  var oldIsValidationParticipant = prototype.isValidationParticipant;
  prototype.setValueAndValidate = function(value, validate) {
    value = value === null ? false : value;
    return originalSetValueAndValidate.call(this, value, validate);
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