/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/controls/form/fields/base/csformfield.editable.behavior", "csui/controls/form/fields/base/csformfield.states.behavior", "csui/controls/form/pub.sub", "dctmw/utils/utils", "d2/controls/form/fields/models/field.options", "d2/controls/form/fields/listfieldview/d2listfieldsearch.view", "d2/controls/form/fields/listfieldview/d2listfieldselection.view", "d2/controls/form/fields/listfieldview/d2listfieldoptions.view", "d2/utils/mass.update.utils", "d2/models/mixins/expressions/expression", "i18n!d2/controls/form/impl/nls/lang", "hbs!d2/controls/form/impl/d2list/d2listfield", "css!d2/controls/form/impl/d2list/d2listfield" ], function(_, $, Backbone, Marionette, base, FormFieldEditableBehavior, FormFieldStatesBehavior, PubSub, utils, FieldOptionCollection, searchInputView, selectionView, optionsView, MassUpdateUtils, ExpressionModel, lang, listFieldTemplate) {
  "use strict";
  var D2ListFieldView = Marionette.LayoutView.extend({
    template: listFieldTemplate,
    className: "cs-formfield d2-listfield",
    ui: {
      writeArea: ".cs-field-write",
      readField: ".cs-field-read button",
      writeField: ".cs-field-write input",
      selectedContainer: ".d2-listfield-selectedvalues",
      dropDown: ".drop-down-button",
      listOptionsContainer: ".d2-listfield-options-container",
      listOptions: ".d2-listfield-options"
    },
    behaviors: {
      FormFieldEditable: {
        behaviorClass: FormFieldEditableBehavior.extend({
          onMouseupRead: function(e) {
            e.stopPropagation();
            e.preventDefault();
          }
        })
      },
      FormFieldStates: {
        behaviorClass: FormFieldStatesBehavior
      }
    },
    regions: {
      searchInput: ".d2-listfield-search-box",
      selectionView: ".d2-listfield-selected-container",
      optionsView: ".d2-listfield-options-container"
    },
    events: function() {
      if (utils.isMobile()) {
        if (this.mode !== "readonly") {
          return {
            "click @ui.dropDown": "onActivateOptions"
          };
        }
      } else {
        return {
          "focusout @ui.writeArea": "onDeactivateOptions"
        };
      }
    },
    childEvents: {
      "activate:options": "onActivateOptions",
      "deactivate:options": "onDeactivateOptions",
      "update:search:filter": "onUpdateSearchFilter",
      "activate:typein": "onActivateTypeIn",
      "add:new:item": "onAddNewItem",
      "activate:selected:view": "onShowSelectedView",
      "focus:active:container": "onFocusActiveContainer"
    },
    templateHelpers: function() {
      return {
        writeonlyMode: this.mode === "writeonly",
        isMobile: utils.isMobile()
      };
    },
    constructor: function D2ListFieldView(options) {
      this.mode = this.options.mode;
      this.mode = options.alpaca && options.alpaca.schema.readonly ? "readonly" : "read";
      if (options.alpaca && options.alpaca.options.setRequiredFieldsEditable && options.mode !== "readonly") {
        this.mode = "writeonly";
      }
      this.alpacaField = options.alpacaField;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.selectedCollection = this.options.selected;
      this.isEditableCombo = options.alpaca.options.isEditable;
      this.oldVal = [];
      this.curVal = [];
      _.each(_.clone(this.model.get("data")), function(d) {
        this.curVal.push(d);
        this.oldVal.push(d);
      }, this);
      this.listenTo(this.model, "change", this._raiseValueChanged);
      this.listenTo(this.collection, "change:selected", this.onSelectionUpdate);
      this.listenTo(this.selectedCollection, "update selectioncollection:change", function(col, options, reorderOptions) {
        if (options && options.changes && options.changes.removed.length === 1) {
          var removedModel = options.changes.removed[0];
          this.onSelectionUpdate(removedModel, false);
        }
        this.updateMultipleValues(options, reorderOptions);
        this.trySetValue();
      });
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
    onAddNewOptions: function(event) {
      if ($(this.ui.listOptionsContainer).is(":visible")) {
        if (event.keyCode === 13) {
          var hasFocus = false;
          $(".d2-listfield-options").each(function() {
            $(this).find("li").each(function() {
              var element = $(this).hasClass("active");
              if (element) {
                hasFocus = true;
                return false;
              }
            });
          });
          if (!hasFocus) {
            this.optionsView.currentView.onClickAddOption(event);
          }
        }
      }
    },
    getSelectionView: function(options) {
      return new selectionView(options);
    },
    getSearchInputView: function(options) {
      return new searchInputView(options);
    },
    getOptionView: function(options) {
      this.updateOptionsForOptionView(options);
      return new optionsView(options);
    },
    updateOptionsForOptionView: function(options) {
      var collection = new FieldOptionCollection([], {
        top: !utils.isMobile() && this.alpacaField.options.rows ? this.alpacaField.options.rows + 2 : this.getVisibleOptionsCount()
      });
      if (!this.childViewOptions.showOptionsInHierarchy) {
        collection.setOptionMacthChecker(this.getOptionMatchChecker());
      } else {
        collection.setOptionMacthChecker(this.getOptionMatchCheckerForHierarchyList());
      }
      if (options.collection?.length > 0 || options.isEditableList) {
        var optionsData = options.collection.map(function(model) {
          return model.attributes;
        });
        collection.populate(optionsData, {
          reset: true
        });
      }
      options.fieldCollection = options.collection;
      collection.hasMoreRecords = options.fieldCollection.hasMoreRecords;
      _.extend(options, {
        collection: collection
      });
    },
    getVisibleOptionsCount: function() {
      if (utils.isMobile()) {
        return Math.ceil($(".cs-perspective-panel").height() / 50) + 10;
      }
      return 30;
    },
    getOptionMatchCheckerForHierarchyList: function() {
      var self = this;
      return function(model, searchRegex) {
        var status = false;
        if (!_.isNull(searchRegex)) {
          if (self.isMatchingForHierarchyList(model, searchRegex, 0)) {
            status = true;
          } else {
            status = false;
          }
        } else {
          status = true;
        }
        model.set("exactMatch", false);
        return status;
      };
    },
    isMatchingForHierarchyList: function(model, searchRegex, level) {
      var optionValue, optionsLabel, modelChildren;
      if (level === 0) {
        optionValue = model.get("id");
        optionsLabel = model.get("name");
        modelChildren = model.get("options")?.children;
      } else {
        optionValue = model.v;
        optionsLabel = model.l;
        modelChildren = model.children;
      }
      if (Object.prototype.hasOwnProperty.call(this.alreadyVisitedNodes, optionValue)) {
        return this.alreadyVisitedNodes[optionValue];
      }
      var status = false;
      if (optionsLabel.toString().match(searchRegex)) {
        status = true;
      } else {
        var self = this, matchCount = 0;
        level++;
        _.each(modelChildren, function(child) {
          if (self.isMatchingForHierarchyList(child, searchRegex, level)) {
            matchCount++;
          }
        });
        status = matchCount ? true : false;
      }
      this.alreadyVisitedNodes[optionValue] = status;
      return status;
    },
    getOptionMatchChecker: function() {
      return function(model, searchRegex) {
        var status = false;
        if (!_.isNull(searchRegex)) {
          if (model.get("name").toString().match(searchRegex)) {
            status = true;
          } else {
            status = false;
          }
        } else {
          status = true;
        }
        model.set("exactMatch", false);
        return status;
      };
    },
    onRender: function() {
      this.childViewOptions = {
        parentView: this,
        collection: this.options.collection,
        model: this.options.model,
        selected: this.options.selected,
        rows: this.options.alpaca.options.rows,
        mode: this.mode,
        isEditableList: this.isEditableCombo,
        alpacaField: this.options.alpacaField,
        async: this.options.alpaca.options.async,
        isAutoSelectSingle: this.options.alpaca.options.isAutoSelectSingle,
        isAutoSelectMulti: this.options.alpaca.options.isAutoSelectMulti,
        showHorizontal: this.alpacaField.options.showHorizontal,
        showOptionsInHierarchy: this.alpacaField.options.showOptionsInHierarchy,
        maxSelection: this.options.alpaca.options.maxSelection
      };
      this.selectionView.show(this.getSelectionView(this.childViewOptions));
      if (this.mode === "writeonly") {
        this.searchInput.show(this.getSearchInputView(this.childViewOptions));
        if (utils.isMobile()) {
          if (this.selectionView.currentView.collection.length > 0) {
            this.searchInput.$el.hide();
            this.$el.find(".drop-down-button").removeClass("binf-hidden");
          } else {
            this.$el.find(".drop-down-button").addClass("binf-hidden");
          }
        }
        if (this.model.get("options").massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.getValue()) && !this.model.get("options").maxObjectThresholdReached) {
          this.searchInput.$el.hide();
        }
      }
      this.bindUIElements();
      this.initialValue = this.getValue();
    },
    getEditValue: function() {
      this.curVal = _.pluck(this.selectedCollection.models, "id");
      return this.curVal;
    },
    getValue: function() {
      var ret = _.pluck(this.selectedCollection.models, "id");
      return ret;
    },
    getValueLabel: function() {
      return this.selectedCollection.pluck("name");
    },
    trySetValue: function() {
      this.setValue(this.getEditValue());
    },
    setStateRead: function() {
      return false;
    },
    setStateWrite: function() {
      return false;
    },
    setValue: function(value) {
      var bValid;
      bValid = this.options.alpacaField.setValueAndValidate(value, true);
      if (bValid) {
        this.$el.removeClass("cs-formfield-invalid");
        this.$el.trigger($.Event("field:valid"), this);
      } else {
        this.$el.addClass("cs-formfield-invalid");
        this.$el.trigger($.Event("field:invalid"));
      }
      if (value === null) {
        this.selectedCollection.reset();
        this.selectionView.currentView.hide();
        var selectedModels = this.collection.where({
          selected: true
        });
        _.each(selectedModels, function(selModel) {
          selModel.set("selected", false);
        });
        if (utils.isMobile()) {
          this.searchInput.$el.show();
          this.$el.find(".drop-down-button").addClass("binf-hidden");
        }
      }
      this.updateModal(value);
      return bValid;
    },
    updateModal: function(values, silent) {
      this._setModelData(_.map(values, function(v) {
        return v;
      }), silent);
    },
    _setModelData: function(data, silent) {
      this.model.set("data", _.map(_.clone(data), function(v) {
        return v;
      }), {
        silent: !!silent
      });
    },
    validateOptions: function() {
      var invalidEntries = [];
      if (this.alpacaField.options.massUpdateFileCount > 0 && MassUpdateUtils.fieldHasMultipleValues(this.alpacaField.getValue())) {
        _.each(this.alpacaField.options.multiFileCountData, function(objectValue) {
          if (objectValue.count > 0 && _.isString(objectValue.category) && /Error/.test(objectValue.category)) {
            invalidEntries.push(objectValue.value);
          }
        });
      } else {
        invalidEntries = this.selectedCollection.where({
          invalid: true
        });
      }
      var message = this.alpacaField.options.hasMultipleValues ? lang.massUpdateFieldInvalidValueError : lang.checkboxFieldValidationErrorInvalidValues, returnStatus = true;
      if (invalidEntries) {
        var invalidTypeEntries = _.filter(invalidEntries, invalidEntry => {
          return invalidEntry.get("invalidType") === true;
        });
        if (invalidTypeEntries.length > 0) {
          var fieldDataType = this.alpacaField?.options?._type, invalidTypeErrorMessage;
          if (fieldDataType === "double" || fieldDataType === "integer") {
            invalidTypeErrorMessage = lang.listFieldValidationErrorInvalidNumberTypeValues;
          }
          if (invalidTypeEntries.length === invalidEntries.length) {
            message = invalidTypeErrorMessage;
          } else {
            message = message + "<br/>" + invalidTypeErrorMessage;
          }
        }
      }
      if (this.enabled) {
        returnStatus = _.isEmpty(invalidEntries);
      }
      return {
        status: returnStatus,
        message: message
      };
    },
    enableDisableField: function(enabled) {
      this.enabled = enabled;
      this.searchInput.currentView && this.searchInput.currentView.enableDisableField(enabled);
      this.selectionView.currentView && this.selectionView.currentView.enableDisableField(enabled);
      this.optionsView.currentView && this.optionsView.currentView.enableDisableField(enabled);
    },
    _raiseValueChanged: function() {
      var data = {
        fieldvalue: this.model.get("data"),
        fieldid: this.options.dataId,
        fieldpath: this.options.path,
        targetfieldpath: this.options.path,
        fieldView: this
      };
      this.trigger("field:changed", data);
      PubSub.trigger(this.options.dataId + "dependentattrchanged", this);
      var event = $.Event("field:changed");
      _.extend(event, data);
      this.$el.trigger(event);
    },
    onSelectionUpdate: function(model, isModelSelected, options) {
      if (model.get("id") === "none") {
        return;
      }
      var optionModel = this.collection.get(model);
      if (utils.isMobile() && isModelSelected && this.selectedCollection.length >= this.options.alpaca.options.maxSelection) {
        var prevSelectedModel = this.selectedCollection.pop({
          silent: true
        });
        this.collection.get(prevSelectedModel).set("selected", false);
      }
      if (isModelSelected) {
        var newSelectionModel = model.clone();
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
    getOldValue: function() {
      return this.oldVal;
    },
    onActivateOptions: function() {
      this.createOptionsView();
      if (this.enabled) {
        this.selectionView.currentView.hide();
        this.optionsView.currentView.showOptions(this.options.alpaca.options.label);
        this.searchInput.currentView.showToolbar("showConsolidatedViewButton");
      }
      PubSub.trigger("update:scroll:position", this.optionsView.currentView.$el.height(), this.optionsView.currentView.$el.offset().top);
    },
    createOptionsView: function() {
      if (!this.optionsView.currentView) {
        this.optionsView.show(this.getOptionView(this.childViewOptions));
        this.bindUIElements();
      }
    },
    onShowSelectedView: function() {
      if (this.optionsView.currentView.isVisible()) {
        this.searchInput.currentView.setValue("");
        this.searchInput.currentView.setFocus();
      }
      this.optionsView.currentView.hideOptions();
      this.selectionView.currentView.show(true);
      this.searchInput.currentView.showToolbar("showActiveConsolidatedViewButton");
    },
    onDeactivateOptions: function(event) {
      if (event && event.target && event.target.tagName.indexOf("INPUT") == -1) {
        return;
      }
      if (base.isFirefox() && $(event.target).hasClass("ps-scrollbar-y-rail") && this.ui.writeArea.has(event.target).length) {
        return;
      }
      if (!this.optionsView.currentView) {
        return;
      }
      var $focused = $(":focus");
      if ($focused && $focused.children(".csui-normal-scrolling").is(this.optionsView.currentView.$el.children(".csui-normal-scrolling"))) {
        return;
      }
      if ($.contains(this.$el[0], event.relatedTarget)) {
        return;
      }
      if (this.optionsView.currentView.isVisible()) {
        this.searchInput.currentView.setValue("");
        if (utils.isMobile()) {
          this.ui.writeField.trigger("blur");
        }
      }
      this.optionsView.currentView.hideOptions();
      this.selectionView.currentView.show();
      this.searchInput.currentView.showToolbar("showOptionsViewButton");
      PubSub.trigger("update:scroll:position");
    },
    onUpdateSearchFilter: function(view, keyword) {
      if (this.searchInput.currentView.isConsolidatedViewActive()) {
        this.selectionView.currentView.search(keyword);
      } else {
        this.createOptionsView();
        this.optionsView.currentView.search(keyword);
      }
    },
    onFocusActiveContainer: function() {
      if (this.selectionView.currentView.isVisible()) {
        this.selectionView.currentView.setFocus();
      } else {
        this.optionsView.currentView.setFocus();
      }
    },
    onActivateTypeIn: function() {
      this.searchInput.currentView.addNewItemPlaceHolder();
    },
    onAddNewItem: function(view, event) {
      this.optionsView.currentView.onClickAddOption(event);
    },
    onShow: function() {
      this.selectionView.currentView.updateHeight();
    },
    allowSaveOnEnter: function() {
      return false;
    },
    doComboReload: function(args) {
      var self = this, options = {
        attrBeforeChange: args,
        reload: true
      };
      this.createOptionsView();
      this.optionsView.currentView.pullData(options).done(function(response) {
        if (self.childViewOptions.isAutoSelectSingle) {
          var isValueMatch = self.isDependentValueMatch(response);
          self._triggerValidation(isValueMatch);
        }
        self.$el.trigger($.Event("field:valid"), self);
        self.selectionView.currentView.setDefaultValuesOnWrite();
      });
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
      model.set("invalid", !isMatch);
      this.trySetValue();
    },
    getSelectedValue: function() {
      let model = this.selectedCollection.first();
      return model.get("name");
    },
    setFocus: function() {
      if (this.model.get("options").massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.getValue()) && !this.model.get("options").maxObjectThresholdReached && this.selectionView.currentView) {
        this.selectionView.currentView.setFocus();
      } else if (this.searchInput.currentView) {
        this.searchInput.currentView.setFocus();
      } else {
        this.selectionView.currentView.setFocus();
      }
    }
  });
  return D2ListFieldView;
});