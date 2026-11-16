/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/d2combofield.view", "csui/controls/form/fields/alpaca/alpcsuiselectfield", "nuc/utils/url", "d2/utils/combo.datasource.utils", "d2/utils/constants", "i18n!d2/controls/form/impl/nls/lang", "i18n!d2/utils/impl/nls/lang" ], function(_, $, Backbone, Marionette, Alpaca, D2ComboFieldView, CsuiSelectField, Url, ComboDataSourceUtils, constants, lang, MassUpdateLang) {
  "use strict";
  Alpaca.Fields.D2ComboField = Alpaca.Fields.SelectField.extend({
    constructor: function D2SelectField(container, data, options, schema, view, connector, onError) {
      this.removeDefaultNone = options.removeDefaultNone !== undefined && options.removeDefaultNone;
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2combo";
    },
    getFieldViewClass: function() {
      return D2ComboFieldView;
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
    pullData: function(options) {
      var deferred = $.Deferred(), me = this;
      if (me.options.ds) {
        var context = this.connector.config.context;
        var connector = context && context.getObject("connector") || this.connector.config.formView.node.connector;
        me.options.ds.connector = connector;
        _.extend(me.options.ds, options);
        ComboDataSourceUtils.getData(me).done(function(results) {
          var collectionData = new Backbone.Collection();
          if (results) {
            me.selectOptions = [];
            if (Alpaca.isArray(results)) {
              $.each(results, function(index, value) {
                me.selectOptions.push({
                  value: value.value,
                  text: value.text,
                  category: value.category,
                  isDefault: value.s
                });
              });
              if (me.selectOptions.length === 1 && (me.options.autoSelectIfSingle || me.options.ds && me.options.ds.assistance_type === "taxonomy")) {
                me.selectOptions[0].isDefault = true;
              }
              if (me.options.massUpdateFileCount && me.options.multiFileCountData) {
                var langPrefix = me.options.massUpdateDocumentType === constants.MassUpdateOptions.FOLDER_PROPERTIES ? "Folder" : me.options.massUpdateDocumentType === constants.MassUpdateOptions.ITEM_PROPERTIES ? "Item" : "";
                me.selectOptions.splice(0, 0, {
                  value: me.options.type === "d2list" ? MassUpdateLang.multipleValues : MassUpdateLang["multipleValuesSelectNewValue" + langPrefix],
                  text: me.options.type === "d2list" ? MassUpdateLang.multipleValues : MassUpdateLang["multipleValuesSelectNewValue" + langPrefix]
                });
              }
              me.schema.enum = [];
              me.options.optionLabels = [];
              for (var i = 0; i < me.selectOptions.length; i++) {
                me.schema.enum.push(me.selectOptions[i].value);
                me.options.optionLabels.push(me.selectOptions[i].text);
              }
              collectionData = _.map(me.selectOptions, function(option) {
                return new Backbone.Model({
                  id: option.value,
                  name: option.text,
                  comboId: _.uniqueId("comboitem"),
                  category: option.category,
                  uniqueOptionId: _.uniqueId(me.name + "_option_"),
                  isDefault: option.isDefault
                });
              });
              collectionData.hasMoreRecords = me.hasMoreRecords;
            }
          }
          deferred.resolve(collectionData);
        }).fail(function(error) {
          deferred.reject(error);
        });
        return deferred.promise();
      }
    },
    findTaxonomyAncestors: function(alpacaField, ancestors, ancestorsFlag) {
      var self = this;
      var metadataView = alpacaField.connector.config.formView.options.originatingView;
      var form;
      if (metadataView.tabContent && metadataView.tabContent.children) {
        metadataView.tabContent.children.each(function(tab) {
          form = tab.content.form;
          if (form) {
            self.parseChildElements(form.children, alpacaField, ancestors, ancestorsFlag);
          }
        });
      } else if (metadataView.contentView) {
        form = metadataView.contentView.form;
        if (form) {
          self.parseChildElements(form.children, alpacaField, ancestors, ancestorsFlag);
        }
      } else {
        form = alpacaField.connector.config.formView.form;
        if (form) {
          self.parseChildElements(form.children, alpacaField, ancestors, ancestorsFlag);
        }
      }
      return ancestors;
    },
    parseChildElements: function(controls, alpacaField, ancestors, ancestorsFlag) {
      var self = this;
      var index = -1;
      if (alpacaField.options.isGridField) {
        index = _.last(alpacaField.parent.path.split("[")).split("]")[0];
      }
      _.each(controls, function(control) {
        if (!control.isContainerField && control.type === "d2combo" && control.options.ds && control.options.ds.assistance_type === "taxonomy") {
          var controlId = ancestorsFlag ? control.options.ds.assistanceTaxoAttrAfter : control.options.ds.assistanceTaxoAttrBefore;
          if (controlId === alpacaField.propertyId) {
            if (control.options.ds.assistanceTaxoAttrAfter) {
              self.forward = true;
            }
            if (control.options.ds.assistanceTaxoAttrBefore) {
              self.backward = true;
            }
            var ancestorIndex = -1;
            if (control.options.isGridField) {
              ancestorIndex = _.last(control.parent.path.split("[")).split("]")[0];
            }
            var condition = ancestorsFlag ? ancestorIndex === -1 || ancestorIndex === index : index === -1 || ancestorIndex === index;
            if (condition) {
              var exists = _.some(ancestors, function(node) {
                return node.name === control.name;
              });
              if (!exists) {
                ancestors.push(control);
                self.findTaxonomyAncestors(control, ancestors, ancestorsFlag);
              }
            }
          }
        }
        if (control.children) {
          if (control.schema && control.schema._d2Containertype === "d2grid") {
            var rows = control.children;
            _.each(rows, function(row) {
              var columns = row.children;
              self.parseChildElements(columns, alpacaField, ancestors, ancestorsFlag);
            });
          } else {
            self.parseChildElements(control.children, alpacaField, ancestors, ancestorsFlag);
          }
        }
      });
    },
    loadTaxonomyChildren: function() {
      if (this.options.ds && this.options.ds.assistance_type === "taxonomy") {
        this.forward = !!this.options.ds.assistanceTaxoAttrAfter;
        this.backward = !!this.options.ds.assistanceTaxoAttrBefore;
        this.taxonomyChildren = this.findTaxonomyAncestors(this, [], false);
        this.taxonomyChildren = this.taxonomyChildren.length > 0 ? this.taxonomyChildren.reverse() : this.taxonomyChildren;
        this.taxonomyAncestors = this.findTaxonomyAncestors(this, [], true);
        this.taxonomyAncestors = this.taxonomyAncestors.length > 0 ? this.taxonomyAncestors.reverse() : this.taxonomyAncestors;
        if (!(this.options.ds.assistanceTaxoAttrAfter && this.options.ds.assistanceTaxoAttrBefore)) {
          var formView = this.connector.config.formView;
          if (this.options.ds.assistanceTaxoAttrAfter && this.taxonomyChildren.length === 0) {
            var nextField = ComboDataSourceUtils.findDependentControl(formView, this.options.ds.assistanceTaxoAttrAfter);
            while (nextField) {
              nextField = Array.isArray(nextField) ? nextField[0] : nextField;
              this.taxonomyChildren.push(nextField);
              if (nextField.options?.ds.assistanceTaxoAttrAfter) {
                nextField = ComboDataSourceUtils.findDependentControl(formView, nextField.options.ds.assistanceTaxoAttrAfter);
              } else {
                nextField = null;
              }
            }
          }
          if (this.options.ds.assistanceTaxoAttrBefore && this.taxonomyAncestors.length === 0) {
            var prevField = ComboDataSourceUtils.findDependentControl(formView, this.options.ds.assistanceTaxoAttrBefore);
            while (prevField) {
              prevField = Array.isArray(prevField) ? prevField[0] : prevField;
              this.taxonomyAncestors.push(prevField);
              if (prevField.options?.ds.assistanceTaxoAttrBefore) {
                prevField = ComboDataSourceUtils.findDependentControl(formView, prevField.options.ds.assistanceTaxoAttrBefore);
              } else {
                prevField = null;
              }
            }
          }
        }
      }
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
    showField: function() {
      if (this.fieldView) {
        this.fieldView.destroy();
        this.fieldView = null;
      }
      var me = this, collectionData = [], enums = [], optionLabels = [], populateCollectionData = function(dataArray) {
        collectionData = _.map(dataArray, function(data) {
          enums.push(data.value);
          optionLabels.push(data.text || data.value);
          return {
            id: data.value,
            name: data.text || data.value,
            uniqueOptionId: _.uniqueId(me.name + "_option_"),
            category: data.category
          };
        });
      };
      var bNullValueFound = false;
      if (_.isFunction(this.options.dataSource)) {
        this.options.dataSource(populateCollectionData);
        this.schema.enum = enums;
        this.options.optionLabels = optionLabels;
      } else if (this.options.ds && (this.options.ds.assistance_type === "taxonomy" || this.options.ds.assistance_type === "dictionary") && this.data) {
        var dataArray = ComboDataSourceUtils.getValues(this);
        if (dataArray.length) {
          populateCollectionData.call(this, dataArray);
          this.schema.enum = enums;
          this.options.optionLabels = optionLabels;
        }
      }
      var collection = new Backbone.Collection(collectionData), selection = {}, hasValue = true, valueExistsInDB = this.options.valueExistsInDB;
      if (this.data !== null && this.data !== "") {
        selection = new Backbone.Model({
          id: this.data,
          name: collection.get(this.data) && collection.get(this.data).get("name") || this.data,
          category: collection.get(this.data) && collection.get(this.data).get("category")
        });
      } else if (this.removeDefaultNone) {
        selection = new Backbone.Model({
          id: this.options.mode === "create" ? collection.models[0].attributes.id : null,
          name: collection.models[0].attributes.name
        });
        hasValue = this.options.mode === "create";
      } else {
        if (this.options.autoSelectIfSingle && this.options.dataSource && this.options.mode === "update") {
          this.options.dataSource(function(values) {
            if (values.length === 1) {
              var value = values[0];
              selection = new Backbone.Model({
                id: value.value,
                name: value.text,
                category: value.category
              });
            } else {
              selection = new Backbone.Model({
                id: "",
                name: ""
              });
            }
          });
        } else {
          selection = new Backbone.Model({
            id: "",
            name: ""
          });
        }
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
        hasValue: hasValue,
        valueExistsInDB: valueExistsInDB
      });
      var isValidInput = _.bind(function(callback) {
        if (!this.fieldView.validateOptions()) {
          {
            var invalidValueMessage = this.options.hasMultipleValues ? lang.massUpdateFieldInvalidValueError : lang.radioFieldValidationErrorInvalidValue;
            callback({
              status: false,
              message: invalidValueMessage
            });
          }
        } else {
          callback({
            status: true
          });
        }
      }, this);
      var isDuplicate = _.bind(function(callback) {
        if (this.fieldView.isDuplicate()) {
          callback({
            status: false,
            message: lang.onlyUniqueValues
          });
        } else {
          callback({
            status: true
          });
        }
      }, this);
      if (this.options.validator && _.isFunction(this.options.validator)) {
        this.customValidation = _.bind(this.options.validator, this);
      }
      if (this.connector.config.formView.options.mode === "create") {
        this.options.validator = function(callback) {
          var valArray = [ isValidInput, this.customValidation, isDuplicate ];
          for (var f in valArray) {
            if (Object.prototype.hasOwnProperty.call(valArray, f)) {
              if (valArray[f] && _.isFunction(valArray[f])) {
                valArray[f](callback);
              }
              if (this.validation["custom"] && !this.validation["custom"]["status"]) {
                break;
              }
            }
          }
        };
      }
      var $field = $("<div>").addClass("alpaca-control");
      this.getControlEl().replaceWith($field);
      this.region = new Marionette.Region({
        el: $field
      });
      this.region.show(this.fieldView);
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
    }
  });
  Alpaca.registerFieldClass("d2combo", Alpaca.Fields.D2ComboField, "bootstrap-csui");
  return Alpaca.Fields.D2ComboField;
});