/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/lib/alpaca/js/alpaca.lite", "dctmw/controls/form/fields/listfieldview/dctmwlistfield.view", "i18n!dctmw/controls/form/impl/nls/lang", "dctmw/controls/form/fields/alpaca/alpdctmwcombofield" ], function(_, $, Backbone, Alpaca, DctmwListFieldView, lang) {
  Alpaca.Fields.DctmwListField = Alpaca.Fields.DctmwComboField.extend({
    constructor: function DctmwSelectField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "dctmwlist";
    },
    getFieldViewClass: function() {
      return DctmwListFieldView;
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
      return this.base();
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
    },
    _initValidators: function() {
      var isValidData = function(callback) {
        var validationStatus = this.fieldView && this.fieldView.validateOptions && this.fieldView.validateOptions();
        callback(validationStatus);
      };
      if (this.options.validator && _.isFunction(this.options.validator)) {
        this.customValidation = _.bind(this.options.validator, this);
      }
      this._overrideValidator([ isValidData, this.customValidation ]);
    },
    collectionDataExtractor: function(data) {
      return {
        id: data.value,
        name: data.text,
        uniqueOptionId: _.uniqueId(this.name + "_option_"),
        invalid: data.invalid,
        selected: data.selected,
        preItemText: data.preItemText,
        options: data.options
      };
    },
    buildCollection: function() {
      const collectionData = this.loadDataFromDataSource() || [], collectionOptions = {};
      if (_.isBoolean(this.options.retainOptionsOrder) && this.options.retainOptionsOrder !== true) {
        collectionOptions["comparator"] = "name";
      }
      return new Backbone.Collection(collectionData, collectionOptions);
    },
    buildFieldViewOptions: function(opts) {
      return this.base(opts);
    },
    getSelectionModel: function(opts) {
      let selection = new Backbone.Collection(), collection = opts.collection;
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
              invalid: false,
              selected: true
            }));
          }
        });
      } else if (this.removeDefaultNone) {
        selection = new Backbone.Model({
          id: this.options.mode === "create" ? collection.at(0).get("id") : null,
          name: collection.at(0).get("name")
        });
      }
      return selection;
    },
    getDefaultSelectionModel: function() {
      return new Backbone.Model({
        id: null,
        name: "<" + lang.selectFieldDefaultLabel + ">"
      });
    }
  });
  Alpaca.registerFieldClass("dctmwlist", Alpaca.Fields.DctmwListField, "bootstrap-csui");
  return Alpaca.Fields.DctmwListField;
});