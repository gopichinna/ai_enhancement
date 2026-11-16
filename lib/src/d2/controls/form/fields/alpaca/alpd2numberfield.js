/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/textfield.view", "d2/utils/form.utils", "d2/utils/mass.update.utils" ], function(_, $, Backbone, Marionette, Alpaca, TextFieldView, FormUtils, MassUpdateUtils) {
  "use strict";
  Alpaca.Fields.d2NumberField = Alpaca.Fields.NumberField.extend({
    constructor: function d2NumberField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "text";
    },
    postRender: function(callback) {
      this.base(callback);
      this.showField();
      this.field.parent().addClass("csui-field-" + this.getFieldType());
    },
    isValidationParticipant: function() {
      var result = this.base();
      return result && !this.schema.disabled;
    },
    isRequired: function() {
      var result = this.base();
      return result && !this.schema.disabled;
    },
    showField: function() {
      var id = this.id;
      var id4Label, labelElement = $(this.field[0]).find("label");
      if (labelElement && labelElement.length === 1) {
        id4Label = labelElement.attr("for") + "Label";
        labelElement.attr("id", id4Label);
      }
      this.schema.maximum = !!this.schema.maximum && this.schema.maximum < Number.MAX_SAFE_INTEGER ? this.schema.maximum : Number.MAX_SAFE_INTEGER;
      this.schema.minimum = !!this.schema.minimum && this.schema.minimum > Number.MIN_SAFE_INTEGER ? this.schema.minimum : Number.MIN_SAFE_INTEGER;
      this.fieldView = new TextFieldView({
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
    getValue: function() {
      var val = this._getControlVal(false);
      if (val === null || val === "") {
        return null;
      }
      if (this.options.massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(val)) {
        return val;
      }
      return this.options._type === "integer" ? parseInt(val) : parseFloat(val);
    },
    _validateNumber: function() {
      var status = this.base(), valInfo = this.validation, value = this.fieldView && this.fieldView.getValue();
      if (!status && this.options.massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(value)) {
        status = true;
        valInfo["stringNotANumber"] = {
          message: "",
          status: status
        };
      }
      return status;
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
    handleValidate: function() {
      var ret = this.base();
      if (!ret) {
        var arrayValidations = this.validation;
        if (this.fieldView.ui.writeField.val() !== "") {
          arrayValidations["notOptional"]["status"] = true;
          arrayValidations["notOptional"]["message"] = "";
          return ret;
        }
        for (var validation in arrayValidations) {
          if (arrayValidations[validation]["status"] === false) {
            if (validation !== "notOptional") {
              arrayValidations[validation]["status"] = true;
              arrayValidations[validation]["message"] = "";
            }
          }
        }
      }
      return ret;
    },
    _validateOptional: function() {
      return FormUtils._validateOptional(this);
    },
    destroy: function() {
      this.base();
      if (this.region) {
        this.region.destroy();
      }
    }
  });
  Alpaca.registerFieldClass("d2number", Alpaca.Fields.d2NumberField, "bootstrap-csui");
  Alpaca.registerFieldClass("d2number", Alpaca.Fields.d2NumberField, "bootstrap-edit-horizontal");
  return $.alpaca.Fields.d2NumberField;
});