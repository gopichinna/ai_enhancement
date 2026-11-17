/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/alpaca/alpcsuibooleanfield", "d2/controls/form/fields/massupdatefields/d2massupdatebooleanfield.view" ], function($, _, Backbone, Marionette, Alpaca, CsuiBooleanField, D2MassUpdateBooleanFieldView) {
  "use strict";
  Alpaca.Fields.D2MassUpdateBooleanField = CsuiBooleanField.extend({
    constructor: function D2MassUpdateBooleanField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2massupdateboolean";
    },
    showField: function() {
      var id = this.id;
      var id4Label, id4Description = this.options ? this.options.descriptionId : "", labelElement = $(this.field[0]).find("label");
      if (labelElement && labelElement.length === 1) {
        id4Label = labelElement.attr("for") + "Label";
        labelElement.attr("id", id4Label);
      }
      this.fieldView = new D2MassUpdateBooleanFieldView({
        model: new Backbone.Model({
          data: this.data,
          options: this.options,
          schema: this.schema,
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
      this.region = new Marionette.Region({
        el: $(".alpaca-control", this.containerItemEl)
      });
      this.containerItemEl.find(".alpaca-control").empty();
      this.region.show(this.fieldView);
      if (this.options.setRequiredFieldsEditable && this.schema.required) {
        this.fieldView.setStateRead(false);
      }
      return;
    }
  });
  Alpaca.registerFieldClass("d2massupdateboolean", Alpaca.Fields.D2MassUpdateBooleanField, "bootstrap-csui");
  return Alpaca.Fields.D2MassUpdateBooleanField;
});