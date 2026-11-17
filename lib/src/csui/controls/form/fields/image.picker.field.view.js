/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette", "csui/controls/form/fields/base/csformfield.view", "csui/controls/image.picker/image.picker.view", "hbs!csui/controls/image.picker/impl/image.picker.view" ], function(Marionette, FormFieldView, ImagePickerViewer, template) {
  var ImagePickerFieldView = FormFieldView.extend({
    constructor: function ImagePickerFieldView(options) {
      FormFieldView.prototype.constructor.apply(this, arguments);
    },
    template: template,
    onRender: function() {
      var imageRegion = new Marionette.Region({
        el: this.el
      });
      if (!!this.options?.alpaca?.data) {
        this.options.imgData = this.options.alpaca.data;
      }
      this.imagePicker = new ImagePickerViewer(this.options);
      imageRegion.show(this.imagePicker);
      this.listenTo(this.imagePicker, "change", function(url) {
        this.setValue(url, true);
      });
    }
  });
  return ImagePickerFieldView;
});