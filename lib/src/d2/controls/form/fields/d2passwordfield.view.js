/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/controls/form/fields/dctmwpasswordfield.view" ], function(_, DctmwPasswordFieldView) {
  "use strict";
  var D2PasswordFieldView = DctmwPasswordFieldView.extend({
    constructor: function D2PasswordFieldView() {
      DctmwPasswordFieldView.prototype.constructor.apply(this, arguments);
    },
    getEditValue: function() {
      var val = DctmwPasswordFieldView.prototype.getEditValue.apply(this, arguments), model = this.options.model || this.model;
      if (model.get("options").massUpdateFileCount && _.isEmpty(val) && this.showMultiplePlaceholder) {
        val = this.ui.writeField.attr("placeholder");
      }
      return val;
    }
  });
  return D2PasswordFieldView;
});