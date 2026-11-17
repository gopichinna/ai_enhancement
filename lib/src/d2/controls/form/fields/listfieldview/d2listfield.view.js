/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/controls/form/fields/listfieldview/dctmwlistfield.view", "d2/controls/form/fields/listfieldview/d2listfieldsearch.view", "d2/controls/form/fields/listfieldview/d2listfieldselection.view", "d2/controls/form/fields/listfieldview/d2listfieldoptions.view", "d2/utils/mass.update.utils", "d2/models/mixins/expressions/expression", "i18n!d2/controls/form/impl/nls/lang" ], function(_, DctmwListFieldView, SearchInputView, SelectionView, OptionsView, MassUpdateUtils, lang) {
  "use strict";
  const D2ListFieldView = DctmwListFieldView.extend({
    className: function() {
      return _.result(DctmwListFieldView.prototype, "className") + " d2-listfield";
    },
    constructor: function D2ListFieldView(options) {
      DctmwListFieldView.prototype.constructor.call(this, options);
    },
    getSelectionView: function(options) {
      return new SelectionView(options);
    },
    getSearchInputView: function(options) {
      return new SearchInputView(options);
    },
    getOptionView: function(options) {
      this.updateOptionsForOptionView(options);
      return new OptionsView(options);
    },
    onSelectionCollectionChange: function(col, options, reorderOptions) {
      if (options && options.changes && options.changes.removed.length === 1) {
        var removedModel = options.changes.removed[0];
        this.onSelectionUpdate(removedModel, false);
      }
      this.updateMultipleValues(options, reorderOptions);
      this.trySetValue();
    },
    updateMultipleValues: function(options, reorderOptions) {
      if (this.model.get("options").massUpdateFileCount && this.model.get("options").multiFileCountData && !(options && options.silentMultiFileChanges)) {
        if (reorderOptions && !this.alpacaField.options.isSorted) {
          MassUpdateUtils.fieldHasMultipleValues(reorderOptions.valueBefore) && delete reorderOptions.valueBefore;
          if (!this.alpacaField.preOrder) {
            this.alpacaField.preOrder = JSON.parse(JSON.stringify(this.alpacaField.options.initialOrder));
          }
          if (reorderOptions.valueBefore || reorderOptions.valueAfter) {
            if (!((!reorderOptions.valueBefore || this.alpacaField.preOrder.indexOf(reorderOptions.valueBefore) < this.alpacaField.preOrder.indexOf(reorderOptions.valueMoved)) && (!reorderOptions.valueAfter || this.alpacaField.preOrder.indexOf(reorderOptions.valueAfter) > this.alpacaField.preOrder.indexOf(reorderOptions.valueMoved)))) {
              this.alpacaField.preOrder.splice(_.indexOf(this.alpacaField.preOrder, reorderOptions.valueMoved), 1);
              if (reorderOptions.valueBefore) {
                this.alpacaField.preOrder.splice(_.indexOf(this.alpacaField.preOrder, reorderOptions.valueBefore) + 1, 0, reorderOptions.valueMoved);
              } else {
                this.alpacaField.preOrder.splice(_.indexOf(this.alpacaField.preOrder, reorderOptions.valueAfter), 0, reorderOptions.valueMoved);
              }
            }
          }
        }
        if (options && options.changes && options.changes.removed) {
          this.alpacaField.preRemoved = this.alpacaField.preRemoved || [];
          _.each(options.changes.removed, function(remove) {
            var value = remove.get("id"), label = remove.get("name");
            if (MassUpdateUtils.fieldHasMultipleValues(value)) {
              return;
            }
            if (!this.alpacaField.preOrder) {
              this.alpacaField.preOrder = JSON.parse(JSON.stringify(this.alpacaField.options.initialOrder));
            }
            if (_.contains(this.initialValue, value) || !_.contains(this.alpacaField.preAddedNew, value)) {
              this.alpacaField.preRemoved.push(value);
              this.alpacaField.preAdded = _.without(this.alpacaField.preAdded, value);
              var singleCountData = _.find(this.alpacaField.options.multiFileCountData, function(valueCount) {
                return valueCount.value === value;
              });
              singleCountData.objectIds = [];
              singleCountData.count = 0;
            } else {
              this.alpacaField.preAddedNew = _.without(this.alpacaField.preAddedNew, value);
              this.alpacaField.preAddedNewLabels = _.without(this.alpacaField.preAddedNewLabels, label);
              this.alpacaField.preAdded = _.without(this.alpacaField.preAdded, value);
              delete this.alpacaField.options.multiFileCountData[value];
              this.alpacaField.preOrder = _.without(this.alpacaField.preOrder, value);
            }
          }.bind(this));
        }
        if (options && options.changes && options.changes.added) {
          _.each(options.changes.added, function(add) {
            var value = add.get("id"), label = add.get("name");
            if (MassUpdateUtils.fieldHasMultipleValues(value)) {
              return;
            }
            if (!this.alpacaField.preOrder) {
              this.alpacaField.options.initialOrder = this.alpacaField.options.initialOrder || [];
              this.alpacaField.preOrder = JSON.parse(JSON.stringify(this.alpacaField.options.initialOrder));
            }
            this.alpacaField.preOrder = _.without(this.alpacaField.preOrder, value);
            this.alpacaField.preOrder.push(value);
            var singleCountData = _.find(this.alpacaField.options.multiFileCountData, function(valueCount) {
              return valueCount.value === value;
            });
            if (singleCountData) {
              singleCountData.objectIds = _.pluck(this.alpacaField.options.massUpdateNodes, "r_object_id");
              singleCountData.count = this.alpacaField.options.massUpdateFileCount;
            }
            if (_.contains(this.alpacaField.preRemoved, value)) {
              this.alpacaField.preRemoved.splice(_.indexOf(this.alpacaField.preRemoved, value), 1);
            } else {
              this.alpacaField.preAdded = this.alpacaField.preAdded || [];
              this.alpacaField.preAdded.push(value);
              if (!singleCountData) {
                this.alpacaField.preAddedNew = this.alpacaField.preAddedNew || [];
                this.alpacaField.preAddedNew.push(value);
                this.alpacaField.preAddedNewLabels = this.alpacaField.preAddedNew || [];
                this.alpacaField.preAddedNewLabels.push(label);
                this.alpacaField.options.multiFileCountData[value] = {
                  count: this.alpacaField.options.massUpdateFileCount,
                  objectIds: _.pluck(this.alpacaField.options.massUpdateNodes, "r_object_id"),
                  totalCount: this.alpacaField.options.massUpdateFileCount,
                  value: value,
                  label: label
                };
              }
            }
          }.bind(this));
        }
        if (this.alpacaField.options.isSorted) {
          delete this.alpacaField.preOrder;
        }
      }
    },
    getChildViewOptions: function() {
      let options = DctmwListFieldView.prototype.getChildViewOptions.call(this);
      options.isAutoSelectSingle = this.options.alpaca.options.isAutoSelectSingle;
      options.isAutoSelectMulti = this.options.alpaca.options.isAutoSelectMulti;
      return options;
    },
    _showSearchInputViewOnRender: function() {
      DctmwListFieldView.prototype._showSearchInputViewOnRender.call(this);
      if (this.mode === "writeonly") {
        if (this.model.get("options").massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.getValue()) && !this.model.get("options").maxObjectThresholdReached) {
          this.searchInput.$el.hide();
        }
      }
    },
    getInvalidEntries: function() {
      if (this.alpacaField.options.massUpdateFileCount > 0 && MassUpdateUtils.fieldHasMultipleValues(this.alpacaField.getValue())) {
        return _.filter(this.alpacaField.options.multiFileCountData, objectValue => {
          return objectValue.count > 0 && _.isString(objectValue.category) && /Error/.test(objectValue.category);
        });
      } else {
        return DctmwListFieldView.prototype.getInvalidEntries.call(this);
      }
    },
    getValidationErrorMessage: function() {
      const errorMessages = DctmwListFieldView.prototype.getValidationErrorMessage.call(this);
      if (this.alpacaField.options.hasMultipleValues) {
        errorMessages.invalidValueError = lang.massUpdateFieldInvalidValueError;
      }
      return errorMessages;
    },
    onSelectionUpdate: function(model, isModelSelected, options) {
      if (model.get("id") === "none") {
        return;
      }
      const optionModel = this.collection.get(model);
      if (isModelSelected) {
        const newSelectionModel = model.clone();
        if (this.model.get("options").massUpdateFileCount && this.model.get("options").multiFileCountData && MassUpdateUtils.fieldHasMultipleValues(model.get("id"))) {
          this.selectedCollection.add(newSelectionModel, {
            at: 0,
            silentMultiFileChanges: options && options.silentMultiFileChanges
          });
          if (!_.filter(this.model.get("options").multiFileCountData, function(countData) {
            return countData.count !== countData.totalCount;
          }).length) {
            optionModel.set("selected", false);
            return;
          }
        } else {
          this.selectedCollection.add(newSelectionModel, {
            silentMultiFileChanges: options && options.silentMultiFileChanges
          });
        }
        if (!optionModel.get("selected")) {
          optionModel.set("selected", true);
        }
      } else {
        this.selectedCollection.remove(model, {
          silentMultiFileChanges: options && options.silentMultiFileChanges
        });
        if (optionModel.get("selected")) {
          optionModel.set("selected", false);
        }
      }
    },
    _handleDataOnReload: function(response) {
      if (this.childViewOptions.isAutoSelectSingle) {
        var isValueMatch = this.isDependentValueMatch(response);
        this._triggerValidation(isValueMatch);
      }
      DctmwListFieldView.prototype._handleDataOnReload.call(this, response);
    },
    isDependentValueMatch: function(updatedData) {
      var updatedValue = this.getUpdatedData(updatedData);
      var selectedValue = this.getSelectedValue();
      return updatedValue === selectedValue;
    },
    getUpdatedData: function(data) {
      var value;
      data.map(opts => {
        value = opts.get("name");
      });
      return value;
    },
    _triggerValidation: function(isMatch) {
      let model = this.selectedCollection.first();
      model?.set("invalid", !isMatch);
      this.trySetValue();
    },
    getSelectedValue: function() {
      let model = this.selectedCollection.first();
      return model?.get("name");
    },
    setFocus: function() {
      if (this.model.get("options").massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.getValue()) && !this.model.get("options").maxObjectThresholdReached && this.selectionView.currentView) {
        this.selectionView.currentView.setFocus();
      } else {
        DctmwListFieldView.prototype.setFocus.call(this);
      }
    }
  });
  return D2ListFieldView;
});