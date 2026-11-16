/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/models/form", "d2/controls/form/fields/d2richtextfield.view" ], function(module, _, $, Backbone, Marionette, Alpaca, FormModel, D2RichTextFieldView) {
  Alpaca.Fields.D2RichTextField = Alpaca.Fields.TextAreaField.extend({
    constructor: function D2RichTextField(container, data, options, schema, view, connector, onError) {
      options.readonly = true;
      schema.readonly = true;
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "richtext";
    },
    postRender: function(callback) {
      this.base(callback);
      this.showField();
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
      this.options.id = "lbl" + _.uniqueId(id);
      var id4Label, labelElement = $(this.field[0]).find("label");
      if (labelElement && labelElement.length === 1) {
        id4Label = labelElement.attr("for") + "Label";
        labelElement.attr("id", id4Label);
      }
      this.fieldView = new D2RichTextFieldView({
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
    focus: function() {
      this.fieldView.setFocus();
    },
    setValue: function(value) {
      value === null ? this.base("") : this.base(value);
    },
    destroy: function() {
      this.base();
      if (this.region) {
        this.region.destroy();
      }
    }
  });
  Alpaca.registerFieldClass("richtext", Alpaca.Fields.D2RichTextField, "bootstrap-csui");
  return $.alpaca.Fields.D2RichTextField;
});