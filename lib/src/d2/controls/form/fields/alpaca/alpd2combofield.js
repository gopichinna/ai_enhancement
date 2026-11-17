/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/d2combofield.view", "csui/controls/form/fields/alpaca/alpcsuiselectfield", "nuc/utils/url", "d2/utils/combo.datasource.utils", "d2/utils/constants", "i18n!d2/controls/form/impl/nls/lang", "i18n!d2/utils/impl/nls/lang", "dctmw/controls/form/fields/alpaca/alpdctmwcombofield" ], function(_, $, Backbone, Marionette, Alpaca, D2ComboFieldView, CsuiSelectField, Url, ComboDataSourceUtils, constants, lang, MassUpdateLang) {
  "use strict";
  Alpaca.Fields.D2ComboField = Alpaca.Fields.DctmwComboField.extend({
    constructor: function D2SelectField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2combo";
    },
    getFieldViewClass: function() {
      return D2ComboFieldView;
    },
    getValidatorMessages: function() {
      return {
        invalidValueMessage: this.options.hasMultipleValues ? lang.massUpdateFieldInvalidValueError : lang.radioFieldValidationErrorInvalidValue,
        duplicateValue: lang.onlyUniqueValues
      };
    },
    buildSelectOptions: function(results) {
      let selectionOptions = _.map(results, value => {
        return {
          value: value.value,
          text: value.text,
          category: value.category,
          isDefault: value.s
        };
      });
      if (selectionOptions.length === 1 && (this.options.autoSelectIfSingle || this.options.ds && this.options.ds.assistance_type === "taxonomy")) {
        selectionOptions[0].isDefault = true;
      }
      if (this.options.massUpdateFileCount && this.options.multiFileCountData) {
        var langPrefix = this.options.massUpdateDocumentType === constants.MassUpdateOptions.FOLDER_PROPERTIES ? "Folder" : this.options.massUpdateDocumentType === constants.MassUpdateOptions.ITEM_PROPERTIES ? "Item" : "";
        selectionOptions.splice(0, 0, {
          value: this.options.type === "d2list" ? MassUpdateLang.multipleValues : MassUpdateLang["multipleValuesSelectNewValue" + langPrefix],
          text: this.options.type === "d2list" ? MassUpdateLang.multipleValues : MassUpdateLang["multipleValuesSelectNewValue" + langPrefix]
        });
      }
      return selectionOptions;
    },
    collectionDataExtractor: function(option) {
      return {
        id: option.value,
        name: option.text,
        comboId: _.uniqueId("comboitem"),
        category: option.category,
        uniqueOptionId: _.uniqueId(this.name + "_option_"),
        isDefault: option.isDefault
      };
    },
    buildFieldViewOptions: function(opts) {
      let options = this.base(opts);
      let valueExistsInDB = this.options.valueExistsInDB;
      options.valueExistsInDB = valueExistsInDB;
      return options;
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
      if (this.options.ds && this.options.ds.async === true && !_.isUndefined(this.options.ds.url) && this.dataSourceLoading === true) {
        this.options.optionLabels = [];
        this.schema.enum = [];
        this.selectOptions = [];
        callback();
      } else {
        this.base(model, callback);
      }
    },
    getSelectionModel: function(opts) {
      let collection = opts.collection, selection = {};
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
      return selection;
    },
    loadDataFromDataSource: function() {
      let collectionData = this.base();
      if (!collectionData && this.options.ds && (this.options.ds.assistance_type === "taxonomy" || this.options.ds.assistance_type === "dictionary") && this.data) {
        var dataArray = ComboDataSourceUtils.getValues(this);
        if (dataArray.length) {
          collectionData = this.collectionDataPopulator(dataArray);
        }
      }
      return collectionData;
    },
    showField: function() {
      this.base();
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