/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/alpaca/alpcsuitextfield", "dctmw/controls/form/fields/dctmwlabelfield.view" ], function(_, $, Backbone, Marionette, Alpaca, AlpacaCsuiTextField, DctmwLabelFieldView) {
  "use strict";
  Alpaca.Fields.DctmwLabelField = Alpaca.Fields.CsuiTextField.extend({
    constructor: function DctmwLabelField(container, data, options, schema, view, connector, onError) {
      schema.disabled = true;
      schema.readonly = true;
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "dctmwlabel";
    },
    showField: function() {
      var id = this.id;
      var id4Label, labelElement = $(this.field[0]).find("label");
      if (labelElement && labelElement.length === 1) {
        id4Label = labelElement.attr("for") + "Label";
        labelElement.attr("id", id4Label);
      }
      this.fieldView = new DctmwLabelFieldView({
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
    }
  });
  Alpaca.registerFieldClass("dctmwlabel", Alpaca.Fields.DctmwLabelField, "bootstrap-csui");
  return Alpaca.Fields.DctmwLabelField;
});