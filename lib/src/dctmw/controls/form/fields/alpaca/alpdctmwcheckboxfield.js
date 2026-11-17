/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "dctmw/controls/form/fields/dctmwcheckboxfield.view", "i18n!dctmw/controls/form/impl/nls/lang" ], function(_, $, Backbone, Marionette, Alpaca, CheckboxFieldView, lang) {
  "use strict";
  Alpaca.Fields.DctmwCheckboxField = Alpaca.Fields.CheckBoxField.extend({
    constructor: function CsuiCheckboxField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "dctmwcheckbox";
    },
    getFieldViewClass: function() {
      return CheckboxFieldView;
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
    dctmwCheckboxDataConverter: function(data) {
      return {
        id: data.value,
        name: data.text
      };
    },
    showField: function() {
      var collectionData = [], enums = [], optionLabels = [];
      if (_.isFunction(this.options.dataSource)) {
        this.options.dataSource(dataArray => {
          collectionData = _.map(dataArray, data => {
            enums.push(data.value);
            optionLabels.push(data.text);
            return this.dctmwCheckboxDataConverter(data);
          });
        });
        this.schema.enum = enums;
        this.options.optionLabels = optionLabels;
      }
      var collection = new Backbone.Collection(collectionData), selection = new Backbone.Model({
        id: this.name,
        data: _.isArray(this.data) ? this.data : []
      }), hasValue = !_.isEmpty(this.data);
      var id4Label, labelElement = $(this.field[0]).find("label");
      if (labelElement && labelElement.length === 1) {
        id4Label = labelElement.attr("for") + "Label";
        labelElement.attr("id", id4Label);
      }
      var id = this.id, fieldViewClass = this.getFieldViewClass();
      this.fieldView = new fieldViewClass({
        model: new Backbone.Model({
          data: this.data,
          options: this.options,
          schema: this.schema,
          id: id
        }),
        id: _.uniqueId(id),
        alpacaField: this,
        labelId: id4Label,
        selected: selection,
        collection: collection,
        mode: this.options.mode,
        path: this.path,
        dataId: this.name,
        alpaca: {
          data: this.data,
          options: this.options,
          schema: this.schema
        },
        hasValue: hasValue,
        originatingView: this.parent && this.parent.options && this.parent.options.originatingView
      });
      var $field = $("<div>").addClass("alpaca-control");
      this.getControlEl().replaceWith($field);
      this.region = new Marionette.Region({
        el: $field
      });
      this.region.show(this.fieldView);
    },
    setValueAndValidate: function(value, validate) {
      this.setValue(value instanceof Backbone.Model ? value.get("data") : value);
      var bIsValid = true;
      if (validate) {
        bIsValid = this.validate();
        this.refreshValidationState(false);
      }
      return bIsValid;
    },
    _validator: function(callback) {
      var value = this.getValue();
      if (this.schema.required && _.isEmpty(value)) {
        callback({
          status: false,
          message: lang.requiredFieldErrorMessage
        });
      } else {
        callback({
          status: true
        });
      }
    },
    validate: function() {
      var isValid = this.base();
      this.validation = _.omit(this.validation, "invalidValueOfEnum");
      return isValid;
    },
    setValue: function(value) {
      value === null ? this.base([]) : this.base(value);
    },
    getValue: function() {
      return this.data;
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
  Alpaca.registerFieldClass("dctmwcheckbox", Alpaca.Fields.DctmwCheckboxField, "bootstrap-csui");
  return Alpaca.Fields.DctmwCheckboxField;
});