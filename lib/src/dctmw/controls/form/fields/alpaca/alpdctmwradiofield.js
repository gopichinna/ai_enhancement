/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "dctmw/controls/form/fields/dctmwradiofield.view", "i18n!dctmw/controls/form/impl/nls/lang" ], function(_, $, Backbone, Marionette, Alpaca, RadioFieldView, lang) {
  "use strict";
  Alpaca.Fields.DctmwRadioField = Alpaca.Fields.RadioField.extend({
    constructor: function CsuiRadioField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "dctmwradio";
    },
    getFieldViewClass: function() {
      return RadioFieldView;
    },
    isValidationParticipant: function() {
      var result = this.base();
      return result && !this.schema.disabled;
    },
    isRequired: function() {
      var result = this.base();
      return result && !this.schema.disabled;
    },
    setup: function() {
      var origData = this.data;
      this.base();
      if (origData !== this.data && this.isRequired() && this.options.removeDefaultNone === true) {
        this.data = origData;
      }
    },
    postRender: function(callback) {
      this.base(callback);
      this.showField();
      this.removeExtraDivs();
    },
    removeExtraDivs: function() {
      var colElements = this.fieldView.$el.closest(".binf-col-sm-9").siblings();
      colElements.each(function(index, element) {
        if (this.tagName === "DIV" && this.className === "binf-col-sm-9" && _.isNull(element.firstChild)) {
          element.parentNode.removeChild(element);
        }
      });
    },
    dctmwGetCollectionData: function() {
      return _.zip(this.schema["enum"], this.options.optionLabels).map(function(cur) {
        return {
          id: cur[0],
          name: cur[1]
        };
      });
    },
    showField: function() {
      var collectionData = [];
      if (this.options.optionLabels) {
        collectionData = this.dctmwGetCollectionData();
      }
      var collection = new Backbone.Collection(collectionData), selection = {}, hasValue = true;
      if (this.data !== null && this.data !== "") {
        selection = new Backbone.Model({
          id: this.data,
          name: collection.get(this.data) && collection.get(this.data).get("name")
        });
      } else {
        selection = new Backbone.Model({
          id: null,
          name: "<" + lang.selectFieldDefaultLabel + ">"
        });
      }
      var id4Label, labelElement = this.field.find("> label");
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
        hasValue: hasValue
      });
      var $field = $("<div>").addClass("alpaca-control");
      this.getControlEl().replaceWith($field);
      this.region = new Marionette.Region({
        el: $field
      });
      this.region.show(this.fieldView);
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
    _validator: function(callback) {
      var value = this.getValue();
      if (this.schema.required && value === "") {
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
      var ret = this.base();
      this.validation = _.omit(this.validation, "invalidValueOfEnum");
      return ret;
    },
    setValue: function(value) {
      value === null ? this.base("") : this.base(value);
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
  Alpaca.registerFieldClass("dctmwradio", Alpaca.Fields.DctmwRadioField, "bootstrap-csui");
  return Alpaca.Fields.DctmwRadioField;
});