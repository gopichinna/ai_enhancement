/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/types/date", "csui/controls/form/fields/impl/datebasefield.view" ], function(date, DateBaseFieldView) {
  "use strict";
  var DateFieldView = DateBaseFieldView.extend({
    format: date.exactDateFormat,
    inputType: "date",
    constructor: function DateFieldView(options) {
      DateBaseFieldView.apply(this, arguments);
    },
    getDisplayValue: function() {
      return this.$el.find(":input")[0].value;
    },
    getValue: function() {
      var val = this.model.get("data"), uiVal = this._convertFromModelToInput(val), value = this._convertFromInputToModel(uiVal);
      return value;
    },
    _convertFromInputToModel: function(value) {
      return value ? date.serializeDate(value, undefined, function() {
        return false;
      }) : null;
    },
    _convertFromModelToInput: function(value) {
      return value ? date.formatExactDate(date.deserializeDate(value)) : "";
    }
  });
  return DateFieldView;
});