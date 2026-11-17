/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/controls/form/fields/base/csformfield.editable.behavior", "csui/controls/form/fields/base/csformfield.states.behavior", "csui/controls/form/pub.sub", "dctmw/utils/utils", "dctmw/controls/form/fields/models/field.options", "dctmw/controls/form/fields/models/field.option", "dctmw/controls/form/fields/listfieldview/dctmwlistfieldsearch.view", "dctmw/controls/form/fields/listfieldview/dctmwlistfieldselection.view", "dctmw/controls/form/fields/listfieldview/dctmwlistfieldoptions.view", "i18n!dctmw/controls/form/impl/nls/lang", "hbs!dctmw/controls/form/impl/dctmwlist/dctmwlistfield", "css!dctmw/controls/form/impl/dctmwlist/dctmwlistfield" ], function(_, $, Backbone, Marionette, base, FormFieldEditableBehavior, FormFieldStatesBehavior, PubSub, utils, FieldOptionCollection, FieldOptionModel, SearchInputView, SelectionView, OptionsView, lang, listFieldTemplate) {
  "use strict";
  const DctmwListFieldView = Marionette.LayoutView.extend({
    template: listFieldTemplate,
    className: "cs-formfield dctmw-listfield",
    ui: {
      writeArea: ".cs-field-write",
      readField: ".cs-field-read button",
      writeField: ".cs-field-write input",
      selectedContainer: ".dctmw-listfield-selectedvalues",
      dropDown: ".drop-down-button",
      listOptionsContainer: ".dctmw-listfield-options-container",
      listOptions: ".dctmw-listfield-options"
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
      searchInput: ".dctmw-listfield-search-box",
      selectionView: ".dctmw-listfield-selected-container",
      optionsView: ".dctmw-listfield-options-container"
    },
    events: function() {
      return {
        "focusout @ui.writeArea": "onDeactivateOptions"
      };
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
        writeonlyMode: this.mode === "writeonly"
      };
    },
    constructor: function DctmwListFieldView(options) {
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
        this.onSelectionCollectionChange(col, options, reorderOptions);
        this.selectionView?.currentView.updateCountLabel();
      });
    },
    onSelectionCollectionChange: function(col, options) {
      if (options && options.changes && options.changes.removed.length === 1) {
        var removedModel = options.changes.removed[0];
        this.onSelectionUpdate(removedModel, false);
      }
      this.trySetValue();
    },
    onAddNewOptions: function(event) {
      if ($(this.ui.listOptionsContainer).is(":visible")) {
        if (event.keyCode === 13) {
          $(".dctmw-listfield-options").each(function() {
            $(this).find("li").each(function() {
              if ($(this).hasClass("active")) {
                return false;
              }
            });
          });
          this.optionsView.currentView.onClickAddOption(event);
        }
      }
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
    getFieldOptionsCollection: function() {
      return new FieldOptionCollection([], {
        top: this.alpacaField.options.rows ? this.alpacaField.options.rows + 2 : this.getVisibleOptionsCount()
      });
    },
    updateOptionsForOptionView: function(options) {
      var collection = this.getFieldOptionsCollection();
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
      return 30;
    },
    getOptionMatchCheckerForHierarchyList: function() {
      var self = this;
      return function(model, searchRegex) {
        var status = true;
        if (!_.isNull(searchRegex)) {
          status = self.isMatchingForHierarchyList(model, searchRegex, 0);
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
        var status = true;
        if (!_.isNull(searchRegex)) {
          status = model.get("name").toString().match(searchRegex);
        }
        model.set("exactMatch", false);
        return status;
      };
    },
    getChildViewOptions: function() {
      return {
        parentView: this,
        collection: this.options.collection,
        model: this.options.model,
        selected: this.options.selected,
        rows: this.options.alpaca.options.rows || 8,
        mode: this.mode,
        isEditableList: this.isEditableCombo,
        alpacaField: this.options.alpacaField,
        async: this.options.alpaca.options.async,
        showHorizontal: this.alpacaField.options.showHorizontal,
        showOptionsInHierarchy: this.alpacaField.options.showOptionsInHierarchy,
        maxSelection: this.options.alpaca.options.maxSelection,
        isMassUpdate: this.options.alpaca.options.isMassUpdate
      };
    },
    _showSelectionViewOnRender: function() {
      this.childViewOptions = this.getChildViewOptions();
      this.selectionView.show(this.getSelectionView(this.childViewOptions));
    },
    _showSearchInputViewOnRender: function() {
      if (this.mode === "writeonly") {
        this.searchInput.show(this.getSearchInputView(this.childViewOptions));
      }
    },
    onRender: function() {
      this._showSelectionViewOnRender();
      this._showSearchInputViewOnRender();
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
    clearSelection: function() {
      this.selectedCollection.reset();
      this.selectionView.currentView.hide();
      var selectedModels = this.collection.where({
        selected: true
      });
      _.each(selectedModels, function(selModel) {
        selModel.set("selected", false);
      });
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
        this.clearSelection();
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
    getValidationErrorMessage: function() {
      return {
        invalidNumberTypeError: lang.listFieldValidationErrorInvalidNumberTypeValues,
        invalidValueError: lang.checkboxFieldValidationErrorInvalidValues
      };
    },
    getInvalidEntries: function() {
      return this.selectedCollection.where({
        invalid: true
      });
    },
    validateOptions: function() {
      const errorMessages = this.getValidationErrorMessage(), invalidEntries = this.getInvalidEntries() || [];
      let message = errorMessages.invalidValueError, returnStatus = true;
      if (invalidEntries) {
        var invalidTypeEntries = _.filter(invalidEntries, invalidEntry => {
          return invalidEntry.get("invalidType") === true;
        });
        if (invalidTypeEntries.length > 0) {
          var fieldDataType = this.alpacaField?.options?._type, invalidTypeErrorMessage;
          if (fieldDataType === "double" || fieldDataType === "integer") {
            invalidTypeErrorMessage = errorMessages.invalidNumberTypeError;
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
    onSelectionUpdate: function(model, isModelSelected) {
      if (model.get("id") === "none") {
        return;
      }
      let optionModel = this.collection.get(model);
      if (isModelSelected) {
        var newSelectionModel = model.clone();
        this.selectedCollection.add(newSelectionModel);
        if (!optionModel.get("selected")) {
          optionModel.set("selected", true);
        }
      } else {
        this.selectedCollection.remove(model);
        if (optionModel?.get("selected")) {
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
      this.showSelectionList();
      PubSub.trigger("update:scroll:position");
    },
    showSelectionList: function(fixHeight) {
      if (this.optionsView?.currentView?.isVisible()) {
        this.searchInput?.currentView?.setValue("");
      }
      if (!this.selectedCollection?.isSortedResult && this.selectedCollection.models.length > 100) {
        this.optionsView?.currentView?.ui.lazyloader.show();
        this.optionsView?.currentView?.ui.staticOptions.hide();
        this.optionsView?.currentView?.ui.options.hide();
        let clearIntervalFlag = false;
        let intervalFunction = setInterval(() => {
          if (clearIntervalFlag) {
            clearInterval(intervalFunction);
          }
          if ($(this.optionsView?.currentView.ui.lazyloader).is(":visible")) {
            this.selectionView?.currentView.show();
            clearIntervalFlag = true;
          }
        }, 100);
        this.listenToOnce(this.selectionView?.currentView, "selection:view:rendered", () => {
          this.optionsView?.currentView?.hideOptions();
        });
      } else {
        this.optionsView?.currentView?.hideOptions();
        this.selectionView?.currentView?.show(fixHeight);
      }
      this.searchInput.currentView.showToolbar("showOptionsViewButton");
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
      if (this.alpacaField.options.emptyDataSource) {
        event.preventDefault();
        event.stopPropagation();
        var searchText = utils.sanitizeInputText(event.target.value);
        if (searchText.length > 0) {
          var newModel = new FieldOptionModel({
            id: searchText,
            name: searchText,
            uniqueOptionId: _.uniqueId(this.alpacaField.name + "_option_")
          });
          this.collection.add(newModel);
          newModel.set("selected", true);
          this.showSelectionList(true);
          $(event.target).val("");
        }
      } else {
        this.optionsView.currentView.onClickAddOption(event);
      }
    },
    onShow: function() {
      this.selectionView.currentView.updateHeight();
    },
    allowSaveOnEnter: function() {
      return false;
    },
    doComboReload: function(args) {
      var options = {
        attrBeforeChange: args,
        reload: true
      };
      this.createOptionsView();
      this.optionsView.currentView.pullData(options).done(response => {
        this._handleDataOnReload(response);
      });
    },
    _handleDataOnReload: function() {
      this.$el.trigger($.Event("field:valid"), this);
      this.selectionView.currentView.setDefaultValuesOnWrite();
    },
    setFocus: function() {
      if (this.searchInput.currentView) {
        this.searchInput.currentView.setFocus();
      } else {
        this.selectionView.currentView.setFocus();
      }
    }
  });
  return DctmwListFieldView;
});