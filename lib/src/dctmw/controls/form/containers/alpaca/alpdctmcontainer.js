/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/jsonpath", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/alpaca/alpcsuiobjectfield" ], function(module, _, $, jsonPath, Alpaca) {
  Alpaca.Fields.DctmContainerField = Alpaca.Fields.CsuiObjectField.extend({
    postRender: function(callback) {
      this.base(callback);
      this.field.off("field:changed");
    },
    resolveRequiredFields: function() {
      var oldRequiredStatus = this.options.required, required = false;
      var reqFieldIds = _.filter(jsonPath(this.schema, "$..[?(@.required===true)]"), function(control) {
        return !control.hidden && !control.disabled;
      });
      if (reqFieldIds.length > 0) {
        required = true;
      }
      this.options.required = required;
      return oldRequiredStatus !== this.options.required;
    }
  });
  return Alpaca.Fields.DctmContainerField;
});