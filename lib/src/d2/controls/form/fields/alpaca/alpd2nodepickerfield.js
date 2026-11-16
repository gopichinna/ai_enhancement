/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/alpaca/alpcsuitextfield", "d2/controls/form/fields/d2nodepickerfield.view" ], function(_, $, Backbone, Marionette, Alpaca, AlpacaCsuiTextField, D2NodePickerFieldView) {
  "use strict";
  Alpaca.Fields.D2NodePickerField = Alpaca.Fields.CsuiTextField.extend({
    constructor: function D2NodePickerField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2nodepicker";
    },
    getValue: function() {
      return this.data;
    },
    showField: function() {
      var id = this.id;
      var id4Label, labelElement = $(this.field[0]).find("label");
      if (labelElement && labelElement.length === 1) {
        id4Label = labelElement.attr("for") + "Label";
        labelElement.attr("id", id4Label);
      }
      this.fieldView = new D2NodePickerFieldView({
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
        isFileOpenDialog: this.options.isFileOpenDialog,
        dataId: this.name,
        path: this.path,
        alpaca: {
          data: this.data,
          options: this.options,
          schema: this.schema
        },
        context: this.connector.config.context,
        originatingView: this.parent.options && this.parent.options.originatingView
      });
      var $field = $("<div>").addClass("alpaca-control");
      this.getControlEl().replaceWith($field);
      this.region = new Marionette.Region({
        el: $field
      });
      this.region.show(this.fieldView);
      return;
    },
    _validateOptional: function() {
      if (this.options.multiSelect) {
        return Alpaca.Fields.D2ListField.prototype._validateOptional.apply(this, arguments);
      } else {
        return Alpaca.Fields.CsuiTextField.prototype._validateOptional.apply(this, arguments);
      }
    },
    setValueAndValidate: function(value, validate) {
      this.setValue(value);
      var bIsValid = true;
      if (validate) {
        bIsValid = this.validate();
        this.refreshValidationState(false);
      }
      return bIsValid;
    }
  });
  Alpaca.registerFieldClass("d2nodepicker", Alpaca.Fields.D2NodePickerField, "bootstrap-csui");
  return Alpaca.Fields.D2NodePickerField;
});