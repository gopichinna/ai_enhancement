/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/lib/backbone", "csui/controls/form/fields/alpaca/alpcsuitextfield", "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/d2singleselecttreefield.view" ], function($, _, Marionette, Backbone, AlpacaCsuiTextField, Alpaca, D2SingleSelectTreeFieldView) {
  "use strict";
  Alpaca.Fields.D2SingleSelectTreeField = Alpaca.Fields.CsuiTextField.extend({
    constructor: function CsuiTextField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2singleselecttreefield";
    },
    getValue: function() {
      return this.fieldView.getValue();
    },
    showField: function() {
      var id = this.id;
      var id4Label, id4Description = this.options ? this.options.descriptionId : "", labelElement = $(this.field[0]).find("label");
      if (labelElement && labelElement.length === 1) {
        id4Label = labelElement.attr("for") + "Label";
        labelElement.attr("id", id4Label);
      }
      this.fieldView = new D2SingleSelectTreeFieldView({
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
      return;
    }
  });
  Alpaca.registerFieldClass("d2singleselecttreefield", Alpaca.Fields.D2SingleSelectTreeField, "bootstrap-csui");
  return Alpaca.Fields.D2SingleSelectTreeField;
});