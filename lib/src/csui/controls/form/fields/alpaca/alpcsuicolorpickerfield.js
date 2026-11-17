/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/color.picker.field.view", "csui/controls/form/fields/alpaca/alpcsuifield" ], function(module, _, $, Backbone, Marionette, Alpaca, ColorPickerFieldView, Field) {
  var colorField = Field.extend({
    getFieldType: function() {
      return "csui-color-picker";
    },
    showField: function() {
      return this._showField(ColorPickerFieldView);
    },
    setValue: function(value) {
      Alpaca.Fields.TextField.prototype.setValue.call(this, value);
      this.csuiValue = value;
    }
  });
  Alpaca.registerFieldClass("csui-color-picker", colorField);
  return colorField;
});