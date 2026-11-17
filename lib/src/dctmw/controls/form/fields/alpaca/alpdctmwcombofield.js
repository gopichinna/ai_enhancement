/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "dctmw/controls/form/fields/dctmwcombofield.view", "dctmw/utils/utils", "dctmw/utils/dctmw.datasource.utils", "i18n!dctmw/controls/form/impl/nls/lang" ], function(_, $, Backbone, Marionette, Alpaca, DctmwComboFieldView, utils, DctmwDataSourceUtils, lang) {
  "use strict";
  Alpaca.Fields.DctmwComboField = Alpaca.Fields.SelectField.extend({
    constructor: function DctmwSelectField(container, data, options, schema, view, connector, onError) {
      this.removeDefaultNone = options.removeDefaultNone !== undefined && options.removeDefaultNone;
      options.emptyDataSource = !_.isFunction(options.dataSource) && !options.ds;
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "dctmwcombo";
    },
    getFieldViewClass: function() {
      return DctmwComboFieldView;
    },
    postRender: function(callback) {
      this.base(callback);
      this.showField();
      this.field.parent().addClass("csui-field-" + this.getFieldType());
    },
    setup: function() {
      var me = this;
      me.base();
    },
    isValidationParticipant: function() {
      var result = this.base();
      return result && !this.schema.disabled;
    },
    isRequired: function() {
      var result = this.base();
      return result && !this.schema.disabled;
    },
    beforeRenderControl: function(model, callback) {
      var me = this;
      if (me.options.ds && me.options.ds.async === true && !_.isUndefined(me.options.ds.url) && me.dataSourceLoading === true) {
        me.options.optionLabels = [];
        me.schema.enum = [];
        me.selectOptions = [];
        callback();
      } else {
        me.base(model, callback);
      }
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
    _validateUniqueItems: function() {
      if (this.schema.items && this.schema.uniqueItems) {
        var hash = {};
        for (var i = 0, l = this.children.length; i < l; ++i) {
          if (!Object.prototype.hasOwnProperty.call(hash, this.children[i])) {
            hash[this.children[i]] = true;
          } else {
            return false;
          }
        }
      }
      return true;
    },
    setValue: function(value) {
      value === null ? this.base("") : this.base(value);
    },
    setValueAndValidate: function(value, validate) {
      if (value instanceof Object) {
        if (Object.prototype.hasOwnProperty.call(value, "id")) {
          this.setValue(value.id);
          if (value instanceof Backbone.Model) {
            this.fieldView.ui.writeField.val(value.get("name"));
          }
        } else {
          this.setValue(value);
          this.fieldView.ui.writeField.val(value);
        }
      } else {
        this.setValue(value);
        this.fieldView.ui.writeField.val(value);
      }
      var bIsValid = true;
      if (validate) {
        this.refreshValidationState(false);
        bIsValid = this.validate();
      }
      return bIsValid;
    },
    focus: function() {
      this.fieldView.setFocus();
    },
    destroy: function() {
      this.base();
      if (this.region) {
        this.fieldView.destroy();
        this.region.destroy();
      }
    },
    showField: function() {
      if (this.fieldView) {
        this.fieldView.destroy();
        this.fieldView = null;
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
      const fieldViewClass = this.getFieldViewClass(), fieldViewOptions = this.buildFieldViewOptions({
        id4Label: id4Label
      });
      this.fieldView = new fieldViewClass(fieldViewOptions);
      this._initValidators();
      var $field = $("<div>").addClass("alpaca-control");
      this.getControlEl().replaceWith($field);
      this.region = new Marionette.Region({
        el: $field
      });
      this.region.show(this.fieldView);
    },
    pullData: function(options) {
      const deferred = $.Deferred(), ds = this.options.ds;
      if (ds) {
        if (!ds.connector) {
          const context = ds.context || this.connector.config.context || this.connector.config.formView.node?.context, connector = context?.getObject("connector") || this.connector.config.formView.node?.connector;
          ds.connector = connector;
        }
        _.extend(this.options.ds, options);
        DctmwDataSourceUtils.getData(this).done(results => {
          let collectionData = new Backbone.Collection();
          if (results) {
            this.selectOptions = [];
            if (Alpaca.isArray(results)) {
              this.selectOptions = this.buildSelectOptions(results);
              collectionData = this.collectionDataPopulator(this.selectOptions);
              collectionData.hasMoreRecords = this.hasMoreRecords;
            }
          }
          deferred.resolve(collectionData);
        }).fail(deferred.reject);
        return deferred.promise();
      }
    },
    loadDataFromDataSource: function() {
      let collectionData = null;
      if (_.isFunction(this.options.dataSource)) {
        this.options.dataSource(dataArray => {
          collectionData = this.collectionDataPopulator(dataArray);
        });
      }
      return collectionData;
    },
    collectionDataPopulator: function(dataArray) {
      let enums = [], optionLabels = [], collectionData = _.map(dataArray, data => {
        enums.push(data.value);
        optionLabels.push(data.text || data.value);
        return new Backbone.Model(this.collectionDataExtractor(data));
      });
      this.schema.enum = enums;
      this.options.optionLabels = optionLabels;
      return collectionData;
    },
    collectionDataExtractor: function(option) {
      return {
        id: option.value,
        name: option.text,
        comboId: _.uniqueId("comboitem"),
        uniqueOptionId: _.uniqueId(this.name + "_option_"),
        isDefault: option.isDefault
      };
    },
    buildCollection: function() {
      const collectionData = this.loadDataFromDataSource() || [], collection = new Backbone.Collection(collectionData);
      return collection;
    },
    buildFieldViewOptions: function(opts) {
      const id = this.id, {
        id4Label
      } = opts;
      let hasValue = true, collection = this.buildCollection(), selected = this.getSelectionModel({
        collection: collection,
        ...opts
      }) || this.getDefaultSelectionModel();
      if ((this.data === null || this.data === "") && this.removeDefaultNone) {
        hasValue = this.options.mode === "create";
      }
      return {
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
        selected: selected,
        collection: collection,
        includeNone: !this.removeDefaultNone,
        dataId: this.name,
        alpaca: {
          data: this.data,
          options: this.options,
          schema: this.schema
        },
        hasValue: hasValue
      };
    },
    getSelectionModel: function(opts) {
      let data = null, collection = opts.collection;
      if (this.data !== null && this.data !== "") {
        data = {
          id: this.data,
          name: collection.get(this.data) && collection.get(this.data).get("name") || this.data,
          category: collection.get(this.data) && collection.get(this.data).get("category")
        };
      } else if (this.removeDefaultNone && collection.models.length) {
        data = {
          id: this.options.mode === "create" ? collection.models.at(0).get("id") : null,
          name: collection.models.at(0).get("name")
        };
      }
      return data ? new Backbone.Model(data) : null;
    },
    getDefaultSelectionModel: function() {
      return new Backbone.Model({
        id: "",
        name: ""
      });
    },
    getValidatorMessages: function() {
      return {
        invalidValueMessage: lang.radioFieldValidationErrorInvalidValue,
        duplicateValue: lang.onlyUniqueValues
      };
    },
    _initValidators: function() {
      const msg = this.getValidatorMessages(), isValidInput = callback => {
        if (!this.fieldView.validateOptions()) {
          {
            callback({
              status: false,
              message: msg.invalidValueMessage
            });
          }
        } else {
          callback({
            status: true
          });
        }
      }, isDuplicate = callback => {
        if (this.fieldView.isDuplicate()) {
          callback({
            status: false,
            message: msg.duplicateValue
          });
        } else {
          callback({
            status: true
          });
        }
      };
      if (this.options.validator && _.isFunction(this.options.validator)) {
        this.customValidation = _.bind(this.options.validator, this);
      }
      if (this.connector.config.formView.options.mode === "create") {
        this._overrideValidator([ isValidInput, this.customValidation, isDuplicate ]);
      }
    },
    _overrideValidator: function(validators) {
      this.options.validator = function(callback) {
        var valArray = validators;
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
    },
    buildSelectOptions: function(results) {
      return _.map(results, ({
        value,
        text,
        s,
        invalid
      }) => {
        return {
          value: value,
          text: text,
          isDefault: s,
          invalid: invalid
        };
      });
    },
    ignoreInputEvent: function() {
      return true;
    }
  });
  Alpaca.registerFieldClass("dctmwcombo", Alpaca.Fields.DctmwComboField, "bootstrap-csui");
  return Alpaca.Fields.DctmwComboField;
});