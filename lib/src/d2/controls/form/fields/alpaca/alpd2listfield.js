/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/listfieldview/d2listfield.view", "csui/controls/form/fields/alpaca/alpcsuiselectfield", "d2/controls/form/fields/alpaca/alpd2combofield", "d2/utils/combo.datasource.utils", "i18n!d2/controls/form/impl/nls/lang" ], function(_, $, Backbone, Marionette, Alpaca, D2ListFieldView, CsuiSelectField, ComboField, ComboDataSourceUtils, lang) {
  "use strict";
  Alpaca.Fields.D2ListField = Alpaca.Fields.D2ComboField.extend({
    constructor: function D2SelectField(container, data, options, schema, view, connector, onError) {
      this.removeDefaultNone = options.removeDefaultNone !== undefined && options.removeDefaultNone;
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2list";
    },
    getFieldViewClass: function() {
      return D2ListFieldView;
    },
    showField: function() {
      var me = this, collectionData = [], enums = [], optionLabels = [];
      var bNullValueFound = false;
      var populateCollectionData = function(dataArray) {
        collectionData = _.map(dataArray, function(data) {
          enums.push(data.value);
          optionLabels.push(data.text);
          return {
            id: data.value,
            name: data.text,
            uniqueOptionId: _.uniqueId(me.name + "_option_"),
            category: data.category,
            invalid: _.isString(data.category) && /Error/.test(data.category),
            selected: data.selected,
            preItemText: data.preItemText,
            options: data.options
          };
        });
      };
      if (_.isFunction(this.options.dataSource)) {
        this.options.dataSource(populateCollectionData);
        this.schema.enum = enums;
        this.options.optionLabels = optionLabels;
      } else if (this.options.ds && this.options.ds.assistance_type === "dictionary" && this.data) {
        var dataArray = ComboDataSourceUtils.getValues(this);
        if (dataArray.length) {
          populateCollectionData.call(this, dataArray);
          this.schema.enum = enums;
          this.options.optionLabels = optionLabels;
        }
      }
      var collectionOptions = {};
      if (_.isBoolean(this.options.retainOptionsOrder) && this.options.retainOptionsOrder !== true) {
        collectionOptions["comparator"] = "name";
      }
      var collection = new Backbone.Collection(collectionData, collectionOptions), selection = new Backbone.Collection(), hasValue = true;
      selection.isSortedResult = this.options.isSorted;
      if (this.options.isSorted) {
        selection.comparator = "name";
      }
      if (this.data !== null && this.data !== "") {
        _.each(this.data, function(selectedKey) {
          var selModel = collection.get(selectedKey);
          if (selModel) {
            selection.add(collection.get(selectedKey).clone());
          } else {
            selection.add(new Backbone.Model({
              id: selectedKey,
              name: selectedKey,
              invalid: false
            }));
          }
        });
      } else if (this.removeDefaultNone) {
        selection = new Backbone.Model({
          id: this.options.mode === "create" ? collection.models[0].attributes.id : null,
          name: collection.models[0].attributes.name
        });
        hasValue = this.options.mode === "create";
      } else {
        selection = new Backbone.Model({
          id: null,
          name: "<" + lang.selectFieldDefaultLabel + ">"
        });
      }
      var id4Label, labelElement = $(this.field[0]).find("label");
      if (labelElement && labelElement.length === 1) {
        id4Label = labelElement.attr("for") + "Label";
        labelElement.attr("id", id4Label);
      }
      var id = this.id;
      this.options.id = "lbl" + _.uniqueId(id);
      labelElement = $(this.field[0]).find("label");
      if (labelElement && labelElement.length === 1) {
        id4Label = labelElement.attr("for") + "Label";
        labelElement.attr("id", id4Label);
      }
      var fieldViewClass = this.getFieldViewClass();
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
        mode: this.options.mode,
        path: this.path,
        selected: selection,
        collection: collection,
        includeNone: !bNullValueFound && !this.removeDefaultNone,
        dataId: this.name,
        alpaca: {
          data: this.data,
          options: this.options,
          schema: this.schema
        },
        hasValue: hasValue
      });
      var isValidData = function(callback) {
        var validationStatus = this.fieldView && this.fieldView.validateOptions && this.fieldView.validateOptions();
        callback(validationStatus);
      };
      if (this.options.validator && _.isFunction(this.options.validator)) {
        this.customValidation = _.bind(this.options.validator, this);
      }
      this.options.validator = function(callback) {
        var valArray = [ isValidData, this.customValidation ];
        for (var f in valArray) {
          if (Object.prototype.hasOwnProperty.call(valArray, f)) {
            if (valArray[f] && _.isFunction(valArray[f])) {
              valArray[f].call(this, callback);
            }
            if (this.validation["custom"] && !this.validation["custom"]["status"]) {
              break;
            }
          }
        }
      };
      var $field = $("<div>").addClass("alpaca-control");
      this.getControlEl().replaceWith($field);
      this.region = new Marionette.Region({
        el: $field
      });
      this.region.show(this.fieldView);
      return;
    },
    setValueAndValidate: function(value, validate) {
      this.setValue(value instanceof Backbone.Model ? value.get("data") : value);
      var bIsValid = true;
      if (validate) {
        this.refreshValidationState(false);
        bIsValid = this.validate();
      }
      return bIsValid;
    },
    _validator: function(callback) {
      var value = this.getValue();
      if (this.schema.required && _.isEmpty(value)) {
        callback({
          status: false,
          message: lang.checkboxFieldValidationErrorRequired
        });
      } else {
        callback({
          status: true
        });
      }
    },
    setValue: function(value) {
      value === null ? this.base([]) : this.base(value);
    },
    getValue: function() {
      return this.fieldView ? this.fieldView.getValue() : this.data;
    },
    validate: function() {
      var ret = this.base();
      if (this.options.isEditable) {
        if (!!this.validation["invalidValueOfEnum"] && !this.validation["invalidValueOfEnum"]["status"]) {
          this.validation["invalidValueOfEnum"]["message"] = "";
          this.validation["invalidValueOfEnum"]["status"] = true;
          ret = this.validation["notOptional"]["status"];
        }
        for (var validation in this.validation) {
          if (this.validation[validation]["status"] === false) {
            if (validation !== "notOptional") {
              this.validation[validation]["status"] = true;
              this.validation[validation]["message"] = "";
            }
          }
        }
      }
      this.validation = _.omit(this.validation, "invalidValueOfEnum");
      return ret;
    },
    onShow: function() {
      this.fieldView.onShow();
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
  Alpaca.registerFieldClass("d2list", Alpaca.Fields.D2ListField, "bootstrap-csui");
  return Alpaca.Fields.D2ListField;
});