/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/checkbox/checkbox.view", "csui/utils/base" ], function(module, _, $, Backbone, Marionette, Alpaca, CheckBoxView, base) {
  Alpaca.Fields.CsuiBooleanFieldV2 = Alpaca.Fields.CheckBoxField.extend({
    constructor: function CsuiBooleanFieldV2(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    setup: function() {
      this.base();
      this.csuiValue = this.data;
      this.setValue(this.data);
    },
    getFieldType: function() {
      return "checkboxV2";
    },
    postRender: function(callback) {
      this.base(callback);
      this.showField();
      this.field.parent().addClass("csui-field-" + this.getFieldType());
    },
    showField: function() {
      var id = this.id;
      var labelElement = $(this.field[0]).find("label"), labelElementValue;
      if (labelElement && labelElement.length == 1) {
        labelElementValue = labelElement[0].innerText;
      }
      this.fieldView = new CheckBoxView({
        model: new Backbone.Model({
          data: this.data,
          options: this.options,
          schema: this.schema,
          id: id
        }),
        id: _.uniqueId(id),
        alpacaField: this,
        label: "",
        ariaLabel: this.options.label || labelElementValue,
        infoMessage: this.options.helper,
        value: this.data,
        checked: this.data,
        readonly: false,
        dataId: this.name,
        path: this.path,
        alpaca: {
          data: this.data,
          options: this.options,
          schema: this.schema
        }
      });
      this.region = new Marionette.Region({
        el: $(".alpaca-control", this.containerItemEl)
      });
      this.containerItemEl.find(".alpaca-control").empty();
      this.region.show(this.fieldView);
      if (this.options.setRequiredFieldsEditable && this.schema.required) {
        this.fieldView.setStateRead(false);
      }
      return;
    },
    setValueAndValidate: function(value, validate) {
      this.setValue(value);
      this.csuiValue = value;
      return true;
    },
    setValue: function(value) {
      Alpaca.Fields.CheckBoxField.prototype.setValue.call(this, value);
      this.csuiValue = value;
    },
    getValue: function() {
      var bRet = this.csuiValue;
      return bRet;
    },
    focus: function() {
      this.fieldView.setFocus();
    },
    destroy: function() {
      this.base();
      if (this.region) {
        this.region.destroy();
      }
    }
  });
  Alpaca.registerFieldClass("checkboxV2", Alpaca.Fields.CsuiBooleanFieldV2, "bootstrap-csui");
  return $.alpaca.Fields.CsuiBooleanFieldV2;
});