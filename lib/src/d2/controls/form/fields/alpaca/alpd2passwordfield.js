/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/d2passwordfield.view", "dctmw/controls/form/fields/alpaca/alpdctmwpasswordfield" ], function(_, Alpaca, D2PasswordFieldView) {
  "use strict";
  Alpaca.Fields.D2PasswordField = Alpaca.Fields.DctmwPasswordField.extend({
    constructor: function D2PasswordField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2password";
    },
    getFieldViewClass: function() {
      return D2PasswordFieldView;
    },
    _validatePattern: function() {
      const fieldView = this.fieldView, val = fieldView && fieldView.ui.writeField.val(), model = fieldView && (fieldView.options.model || fieldView.model);
      if (fieldView && model && model.get("options").massUpdateFileCount && _.isEmpty(val) && fieldView.showMultiplePlaceholder) {
        return true;
      }
      return this.base();
    }
  });
  Alpaca.registerFieldClass("d2password", Alpaca.Fields.D2PasswordField, "bootstrap-csui");
  Alpaca.registerFieldClass("d2password", Alpaca.Fields.D2PasswordField, "bootstrap-edit-horizontal");
  return Alpaca.Fields.D2PasswordField;
});