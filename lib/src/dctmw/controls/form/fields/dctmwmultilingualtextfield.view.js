/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/form/fields/multilingual.textfield.view" ], function(MultilingualTextFieldView) {
  "use strict";
  var DctmwMultilingualTextFieldView = MultilingualTextFieldView.extend({
    constructor: function DctmwMultilingualTextFieldView() {
      MultilingualTextFieldView.prototype.constructor.apply(this, arguments);
    },
    templateHelpers: function() {
      var helpers = MultilingualTextFieldView.prototype.templateHelpers.apply(this, arguments);
      if (!this.model.get("data")) {
        helpers.multilangEnValue = "";
        this.displayValue = "";
      }
      return helpers;
    }
  });
  return DctmwMultilingualTextFieldView;
});