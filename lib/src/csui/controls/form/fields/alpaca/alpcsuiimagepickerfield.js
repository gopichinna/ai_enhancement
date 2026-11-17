/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/image.picker.field.view", "csui/controls/form/fields/alpaca/alpcsuifield" ], function(Alpaca, ImagePickerFieldView, Field) {
  var ImageField = Field.extend({
    getFieldType: function() {
      return "csui-image-picker";
    },
    showField: function() {
      return this._showField(ImagePickerFieldView);
    }
  });
  Alpaca.registerFieldClass("csui-image-picker", ImageField);
  return ImageField;
});