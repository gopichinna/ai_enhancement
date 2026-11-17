/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/models/form", "csui/controls/form/pub.sub", "csui/controls/form/fields/textfield.view", "csui/utils/base" ], function(module, _, $, Backbone, Marionette, Alpaca, FormModel, PubSub, TextFieldView, base) {
  Alpaca.Fields.CsuiTextField = Alpaca.Fields.TextField.extend({
    constructor: function CsuiTextField(container, data, options, schema, view, connector, onError) {
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
    showField: function() {
      var id = this.id;
      var id4Label, id4Description = this.options ? this.options.descriptionId : "", labelElement = $(this.field[0]).find("label");
      if (labelElement && labelElement.length == 1) {
        id4Label = labelElement.attr("for") + "Label";
        labelElement.attr("id", id4Label);
      }
      this.fieldView = new TextFieldView({
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
        descriptionId: id4Description,
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
      this.fieldView.formView?.options?.isUniqueFormIdRequired && PubSub.trigger(this.options.fieldKey + "tkl:asyncBuildRelation", this.fieldView);
      return;
    },
    setValueAndValidate: function(value, validate) {
      value = value?.trim();
      this.setValue(value);
      var bIsValid = true;
      if (validate) {
        bIsValid = this.validate();
        this.refreshValidationState(false);
      }
      this.fieldView.ui.writeField.val(value);
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
    }
  });
  Alpaca.registerFieldClass("text", Alpaca.Fields.CsuiTextField, "bootstrap-csui");
  Alpaca.registerFieldClass("text", Alpaca.Fields.CsuiTextField, "bootstrap-edit-horizontal");
  return $.alpaca.Fields.CsuiTextField;
});