/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/form/fields/alpaca/alpcsuitextareafield", "d2/utils/mass.update.utils" ], function(_, CsuiTextArea, MassUpdateUtils) {
  var prototype = CsuiTextArea.prototype;
  _.extend(prototype, {
    performAdditionalValidation: function(baseValidationStatus) {
      if (!baseValidationStatus && this.options.massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.getValue())) {
        this.validation["stringTooLong"]["status"] = true;
        this.validation["stringTooLong"]["message"] = "";
        baseValidationStatus = true;
      }
      return baseValidationStatus;
    }
  });
});