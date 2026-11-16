/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/alpaca/alpcsuitextareafield", "d2/controls/form/fields/d2querybuilderfield.view" ], function(_, $, Backbone, Marionette, Alpaca, CsuiTextAreaField, D2QueryBuilderFieldView) {
  "use strict";
  Alpaca.Fields.D2QueryBuilderField = Alpaca.Fields.CsuiTextAreaField.extend({
    constructor: function D2QueryBuilderField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2querybuilder";
    },
    _getQueryValidationInfo: function() {
      return this.fieldView && this.fieldView.validateQuery();
    },
    handleValidate: function() {
      var baseStatus = this.base();
      var valInfo = this.validation;
      var queryValidtion = this._getQueryValidationInfo();
      valInfo["invalidQuery"] = {
        status: queryValidtion.status,
        message: queryValidtion.message
      };
      return baseStatus && valInfo["invalidQuery"].status;
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
      this.fieldView = new D2QueryBuilderFieldView({
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
      var $field = $("<div>").addClass("alpaca-control");
      this.getControlEl().replaceWith($field);
      this.region = new Marionette.Region({
        el: $field
      });
      this.region.show(this.fieldView);
      return;
    }
  });
  Alpaca.registerFieldClass("d2querybuilder", Alpaca.Fields.D2QueryBuilderField, "bootstrap-csui");
  return Alpaca.Fields.D2QueryBuilderField;
});