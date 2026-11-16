/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/lib/handlebars", "csui/controls/form/fields/base/csformfield.view", "csui/controls/color.picker/color.picker.view" ], function(require, _, $, Marionette, Handlebars, FormFieldView, ColorPickerview) {
  var ColorPickerFieldView = FormFieldView.extend({
    constructor: function ColorPickerFieldView(options) {
      FormFieldView.prototype.constructor.apply(this, arguments);
    },
    template: Handlebars.compile(""),
    onRender: function() {
      const colorPickerRegion = new Marionette.Region({
        el: this.el
      });
      this.colorPickerview = new ColorPickerview({
        defaultColor: this.model && this.model.get("data")
      });
      colorPickerRegion.show(this.colorPickerview);
      this.listenTo(this.colorPickerview, "change", function(color) {
        this.setValue(color, true);
      });
    }
  });
  return ColorPickerFieldView;
});