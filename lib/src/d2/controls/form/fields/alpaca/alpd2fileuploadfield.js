/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/models/form", "nuc/utils/base", "d2/controls/form/fields/d2fileuploadfield.view", "d2/utils/creation.utils" ], function(module, _, $, Backbone, Marionette, Alpaca, FormModel, base, D2FileUploadView, CreationUtils) {
  Alpaca.Fields.D2FileUpload = Alpaca.Fields.TextField.extend({
    constructor: function D2FileUpload(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2fileupload";
    },
    setValueAndValidate: function(value, validate) {
      this.setValue(value);
      var bIsValid = true;
      if (validate) {
        bIsValid = this.validate();
        this.refreshValidationState(false);
      }
      return bIsValid;
    },
    postRender: function(callback) {
      this.base(callback);
      this.showField();
    },
    showField: function() {
      var id = this.id;
      this.options.id = "lbl" + _.uniqueId(id);
      var id4Label, labelElement = $(this.field[0]).find("label");
      if (labelElement && labelElement.length === 1) {
        id4Label = labelElement.attr("for") + "Label";
        labelElement.attr("id", id4Label);
      }
      this.fieldView = new D2FileUploadView({
        model: new Backbone.Model({
          data: this.data,
          options: this.options,
          schema: this.schema,
          id: id
        }),
        id: _.uniqueId(id),
        alpacaField: this,
        labelId: id4Label,
        value: this.data,
        readonly: false,
        dataId: this.name,
        path: this.path,
        propertyId: this.propertyId,
        alpaca: {
          data: this.data,
          options: this.options,
          schema: this.schema
        }
      });
      var me = this;
      this.options.validator = function(callback) {
        callback(CreationUtils.filterFiles(me.fieldView.files));
      };
      var $field = $("<div>").addClass("alpaca-control");
      this.getControlEl().replaceWith($field);
      this.region = new Marionette.Region({
        el: $field
      });
      this.region.show(this.fieldView);
      return;
    }
  });
  Alpaca.registerFieldClass("d2fileupload", Alpaca.Fields.D2FileUpload, "bootstrap-csui");
  Alpaca.registerFieldClass("d2fileupload", Alpaca.Fields.D2FileUpload, "bootstrap-edit-horizontal");
  return $.alpaca.Fields.D2FileUpload;
});