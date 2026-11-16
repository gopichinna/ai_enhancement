/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/models/form", "d2/controls/form/fields/d2passwordfield.view", "d2/utils/form.utils" ], function(module, _, $, Backbone, Marionette, Alpaca, FormModel, PasswordFieldView, FormUtils) {
  Alpaca.Fields.D2PasswordField = Alpaca.Fields.PasswordField.extend({
    constructor: function D2PasswordField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "password";
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
      this.fieldView = new PasswordFieldView({
        model: new Backbone.Model({
          data: this.data,
          options: this.options,
          schema: this.schema,
          inputType: "text",
          id: id
        }),
        id: _.uniqueId(id),
        alpacaField: this,
        labelId: id4Label,
        value: this.data,
        readonly: true,
        dataId: this.name,
        path: this.path,
        alpaca: {
          data: this.data,
          options: this.options,
          schema: this.schema
        }
      });
      var $field = $("<div>").addClass("alpaca-control");
      this.getControlEl().replaceWith($field);
      this.region = new Marionette.Region({
        el: $field
      });
      this.region.show(this.fieldView);
      return;
    },
    _validatePattern: function() {
      var fieldView = this.fieldView, val = fieldView && fieldView.ui.writeField.val(), model = fieldView && (fieldView.options.model || fieldView.model);
      if (fieldView && model && model.get("options").massUpdateFileCount && _.isEmpty(val) && fieldView.showMultiplePlaceholder) {
        return true;
      }
      return this.base();
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
    focus: function() {
      this.fieldView.setFocus();
    },
    destroy: function() {
      this.base();
      if (this.region) {
        this.region.destroy();
      }
    },
    handleValidate: function() {
      var ret = this.base();
      return FormUtils.handleValidationForRequiredField(this, ret);
    },
    _validateOptional: function() {
      return FormUtils._validateOptional(this);
    }
  });
  Alpaca.registerFieldClass("d2password", Alpaca.Fields.D2PasswordField, "bootstrap-csui");
  Alpaca.registerFieldClass("d2password", Alpaca.Fields.D2PasswordField, "bootstrap-edit-horizontal");
  return $.alpaca.Fields.D2PasswordField;
});