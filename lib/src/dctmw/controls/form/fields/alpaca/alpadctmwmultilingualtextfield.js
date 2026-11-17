/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/alpaca/alpcsuimultilingual.textfield", "dctmw/controls/form/fields/dctmwmultilingualtextfield.view" ], function(_, $, Backbone, Marionette, Alpaca, CsuiMultilingualTextField, DctmwMultilingualTextFieldView) {
  "use strict";
  Alpaca.Fields.DctmwMultilingualTextField = CsuiMultilingualTextField.extend({
    getFieldType: function() {
      return "dctmw_multilingual_string";
    },
    showField: function() {
      var id = this.id, id4Label, id4Description = this.options ? this.options.descriptionId : "", labelElement = $(this.field[0]).find("label");
      if (labelElement && labelElement.length === 1) {
        id4Label = labelElement.attr("for") + "Label";
        labelElement.attr("id", id4Label);
      }
      this.fieldView = new DctmwMultilingualTextFieldView({
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
    }
  });
  Alpaca.registerFieldClass("dctmw_multilingual_string", Alpaca.Fields.DctmwMultilingualTextField, "bootstrap-csui");
  Alpaca.registerFieldClass("dctmw_multilingual_string", Alpaca.Fields.DctmwMultilingualTextField, "bootstrap-edit-horizontal");
  return $.alpaca.Fields.DctmwMultilingualTextField;
});