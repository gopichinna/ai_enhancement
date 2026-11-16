/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/form/fields/base/csformfield.editable.behavior", "csui/controls/form/fields/base/csformfield.states.behavior", "csui/controls/form/fields/base/csformarrayfield.editable.behavior", "csui/controls/form/fields/base/csformarrayfield.states.behavior", "csui/controls/form/pub.sub", "nuc/utils/base", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/tile/behaviors/infinite.scrolling.behavior", "d2/controls/form/fields/models/field.option", "d2/controls/form/fields/models/field.options", "d2/controls/form/fields/massupdatefields/mass.update.field.mixin", "d2/utils/combo.datasource.utils", "d2/utils/mass.update.utils", "dctmw/utils/utils", "i18n!d2/controls/form/impl/nls/lang", "i18n!csui/controls/form/impl/nls/lang", "hbs!d2/controls/form/impl/d2combo/d2combofield.item", "hbs!d2/controls/form/impl/d2combo/d2combofield", "css!d2/controls/form/impl/d2combo/d2combofield", "csui/lib/binf/js/binf" ], function(_, $, Backbone, Marionette, FormFieldEditableBehavior, FormFieldStatesBehavior, FormArrayFieldEditable2Behavior, FormArrayFieldStatesBehavior, PubSub, base, PerfectScrollingBehavior, InfiniteScrollingBehavior, FieldOptionModel, FieldOptionCollection, MassUpdateFieldMixin, ComboDataSourceUtils, MassUpdateUtils, utils, Lang, CsuiLang, ComboItemViewTemplate, ComboViewTemplate) {
  "use strict";
  var itemView = Marionette.ItemView.extend({
    template: ComboItemViewTemplate,
    tagName: "li",
    className: "d2-combofield-option",
    attributes: function() {
      return {
        id: this.model.get("id")
      };
    },
    events: {
      mousedown: "onClickOption"
    },
    constructor: function() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, "change", function() {
        this.render();
      });
    },
    onRender: function() {
      var searchText = this.model.collection.getOptionsFilter("searchText"), searchRegex = searchText && new RegExp(searchText, "gi"), name = this.model.get("name"), optionContainer = this.$el.find("a span.d2-combofield-text-container");
      if (searchRegex) {
        optionContainer.html(name.replace(searchRegex, function(matchT) {
          return "<span class='d2-highlight-options'>" + matchT + "</span>";
        }));
        searchRegex.source.trim().toLowerCase() === name.trim().toLowerCase() ? this.model.set("exactMatch", true) : this.model.set("exactMatch", false);
      }
      if (this.options.originatingView.options.model.get("options").massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.model.get("id"))) {
        this.$el.hide();
      }
    },
    onClickOption: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.triggerMethod("click:item");
    }
  });
  var D2ComboFieldView = Marionette.CompositeView.extend({
    constructor: function D2ComboFieldView(options) {
      if (!!options.model.attributes.options && !!options.model.attributes.options.isMultiFieldItem) {
        this.behaviors = _.extend({
          FormFieldEditable: {
            behaviorClass: FormArrayFieldEditable2Behavior
          },
          FormFieldStates: {
            behaviorClass: FormArrayFieldStatesBehavior
          }
        }, this.behaviors);
      } else {
        this.behaviors = _.extend({
          FormFieldEditable: {
            behaviorClass: FormFieldEditableBehavior
          },
          FormFieldStates: {
            behaviorClass: FormFieldStatesBehavior
          }
        }, this.behaviors);
      }
      this.optionsCollection = options.collection;
      var topCount = this.getVisibleOptionsCount();
      if (options.alpacaField && options.alpacaField.options && options.alpacaField.options.ignoreProgressiveLoad === true) {
        topCount = 0;
      }
      options.collection = new FieldOptionCollection([], {
        top: topCount
      });
      options.collection.setOptionMacthChecker(this.getOptionMatchChecker());
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.mode = this.options.mode;
      this.mode = this.options.alpaca && this.options.alpaca.schema.readonly ? "readonly" : "read";
      if (this.options.alpaca) {
        if (options.alpaca.options.setRequiredFieldsEditable && this.mode !== "readonly") {
          this.mode = "writeonly";
        }
      }
      this.model = new Backbone.Model();
      this.alpacaField = this.options.alpacaField;
      if (this.options.selected) {
        this._updateModel(this.options.selected);
      } else {
        this.resetSelection();
      }
      this.curVal = this.model.clone();
      this.oldVal = this.model.clone();
      this.listenTo(this.model, "change", function() {
        this.collection.trigger("reset");
      });
      this.listenTo(this.model, "change", function() {
        this._raiseValueChanged();
      });
      this.throttleFrequency = this.alpacaField.options.ds ? this.alpacaField.options.queryDelay || 1e3 : 0;
      this.isEditableCombo = options.alpaca.options.isEditable;
      if (this.isEditableCombo) {
        this.suggestions = new Backbone.Collection();
      }
      this.metadataView = this.alpacaField.connector.config.formView.options.originatingView;
      this.listenTo(this.metadataView, "taxo:upChangeEvent", this.doComboReset);
      this.listenTo(this.metadataView, "taxo:downChangeEvent", this.doComboReload);
      if (this.curVal.id !== null) {
        this.listenToOnce(this, "after:visible", function() {
          if (this.alpacaField.options.ds && this.alpacaField.options.ds.assistance_type === "taxonomy") {
            this.alpacaField.loadTaxonomyChildren();
            this.raiseTaxonomyEvents(true, true);
          }
        });
      }
      if (!this.options.valueExistsInDB) {
        this.listenToOnce(this, "after:visible", function() {
          if (this.alpacaField.options?.autoSelectIfSingle === true && this.optionsCollection.length === 1) {
            this.raiseValueChangedExplicitly = true;
            this.setValue(this.optionsCollection.first(), true);
          }
        });
        if (this.mode === "read") {
          this.setValue(this.optionsCollection.first().get("id"), true);
        }
      }
      this.enable = !this.alpacaField.schema.disabled;
      this.searchText = "";
      var self = this;
      this.errorList = [];
      _.map(this.optionsCollection.models, function(options) {
        if (_.isString(options.get("category")) && /Error/.test(options.get("category"))) {
          self.errorList.push(options.id);
        }
      });
      this.onSearchInputChange = _.throttle(_.bind(this.onSearchInputChange, this), this.throttleFrequency);
    },
    className: "cs-formfield d2-combofield",
    childView: itemView,
    childViewOptions: function() {
      return {
        originatingView: this
      };
    },
    childViewContainer: ".d2-combofield-options",
    template: ComboViewTemplate,
    onChildviewClickItem: function(childView) {
      this.eventSource = undefined;
      this.setValue(childView.model, true);
      this._updateSelectedOption(childView.model);
    },
    templateHelpers: function() {
      var data = Lang.noValue, dataId = "", isRequired = this.alpacaField && this.alpacaField.isRequired(), isReadOnly = this.mode === "readonly", requiredTxt = isRequired ? Lang.requiredField : "", searchText = utils.sanitizeInputText(this.searchText);
      if (this.model) {
        data = this.model.get("name") || this.model.get("id");
        dataId = this.model.get("id");
      } else {
        data = Lang.selectFieldDefaultLabel;
      }
      this.includeNone = !isRequired && this.options.includeNone;
      return {
        searchPlaceHolder: Lang.mobileInlineSearchPlaceHolder,
        controlId: this.alpacaField.propertyId,
        isReadOnly: this.mode === "readonly",
        hasData: data !== "" && data !== null && this.options.hasValue,
        data: data,
        dataId: dataId,
        emptyLabel: this.mode === "writeonly" && this.enable ? this._getPlaceHolder() : CsuiLang.noValueSet,
        noneLabel: Lang.selectFieldDefaultLabel,
        noValue: Lang.noValue,
        writeonlyMode: this.mode === "writeonly",
        idBtnLabel: this.options.labelId,
        readModeAria: isReadOnly ? _.str.sformat(Lang.fieldReadOnlyAria, this.alpacaField.options.label, _.isEmpty(data) ? Lang.noValue : data) + requiredTxt : _.str.sformat(Lang.fieldEditAria, this.alpacaField.options.label, data) + requiredTxt,
        ariaRequired: isRequired,
        addNewLabel: searchText.length > 0 ? _.str.sformat(Lang.addNewItem, searchText) : Lang.addNew,
        addNewId: _.uniqueId("listitem"),
        disabled: !this.enable,
        isEditable: this.isEditableCombo,
        showMobileContainer: utils.isMobile()
      };
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-scrollable-options",
        suppressScrollX: true
      },
      InfiniteScrolling: {
        behaviorClass: InfiniteScrollingBehavior,
        contentParent: ".d2-scrollable-options",
        content: ".d2-combofield-options"
      }
    },
    ui: function() {
      var ui = {
        options: ".d2-combofield-options",
        writeFieldInner: ".cs-field-write-inner",
        writeField: ".cs-field-write input",
        readField: ".cs-field-read button",
        comboOptionsContainer: ".d2-combofield-options-container",
        comboOptions: ".d2-combofield-options-list",
        lazyloader: ".d2-lazy-loading",
        scrollContainer: ".d2-scrollable-options",
        addNewOption: ".d2-add-new-option",
        noneOption: ".d2-none-item",
        noneIconContainer: ".d2-none-item .d2-listfield-icon-container",
        dropDownSearchResultCount: ".d2-searchResultCountDetails",
        selectAddNewOption: ".d2mob-add-new-options"
      };
      if (utils.isMobile()) {
        ui["writeField"] = '.cs-field-write input[type!="search"]';
        ui["mobileSearchField"] = '.cs-field-write input[type="search"]';
        ui["searchClearIcon"] = ".csui-icon.cancel";
      }
      return ui;
    },
    events: function() {
      var events = {
        "mousedown @ui.addNewOption": "onClickAddOption",
        "mousedown @ui.noneOption": "onClickNoneOption",
        "mousedown @ui.writeField": "onMouseDownWriteField",
        "keydown @ui.writeField": "accessibility",
        "focusout @ui.writeField": "focusOutAction",
        "focusin @ui.writeField": "focusInAction"
      };
      if (utils.isMobile()) {
        _.extend(events, {
          "click .csui-search": "showInputField",
          "click @ui.searchClearIcon": "clearSearchText",
          "input @ui.mobileSearchField": "onSearchInputChange"
        });
      }
      return events;
    },
    openSearchView: function(displayView) {
      displayView ? !this.isOpen && this.$el.find(".d2-combofield-mobile-options-container").animate({
        scrollTop: 0
      }, 50) : this.isOpen && this.$el.find(".d2-combofield-mobile-options-container").animate({
        scrollTop: 56
      }, 50);
      this.isOpen = displayView;
    },
    onRender: function() {
      if (this.options.model.get("options").multiFileCountData) {
        this.ui.addNewOption.remove();
      }
      this.ui.lazyloader.hide();
      var optionsContainerId = _.uniqueId("comboOptionsContainer");
      this.ui.comboOptions.attr("id", optionsContainerId);
      this.ui.writeField.attr("aria-owns", optionsContainerId);
      this.ui.writeField.attr("aria-expanded", false);
      $(this.ui.writeField).on("keyup", {
        view: this
      }, _.throttle(_.bind(this.search, this), this.throttleFrequency));
      this.hideOptionsSelectedByOtherRow();
      this._behaviors[2]._destroyScrollbar();
      this.trigger("update:scrollbar");
      this.listenTo(PubSub, "update:scroll:position", function() {
        if (this.options.isDropDownOpen) {
          this.adjustPosition();
        }
      }.bind(this));
      if (utils.isMobile()) {
        this.shouldOpenSearchView();
      }
    },
    shouldOpenSearchView: function() {
      var self = this;
      var position = this.ui.scrollContainer.scrollTop();
      this.ui.scrollContainer.on("scroll", function() {
        var displayView = self.ui.scrollContainer.scrollTop() < 10 || self.ui.scrollContainer.scrollTop() < position || self.ui.mobileSearchField.val();
        self.openSearchView(displayView);
        position = self.ui.scrollContainer.scrollTop();
      });
    },
    onMouseDownWriteField: function(event) {
      if (!this.enable) {
        return;
      }
      if (this.isChildContainerVisible()) {
        this.hideOptions(event);
      } else {
        this.searchText = "";
        var me = this;
        this.ui.comboOptionsContainer.addClass("binf-show");
        $.when(this.fetchDataFromSource({
          filter: this.searchText,
          ignoreDependencyEvents: true
        })).done(function() {
          me.showOptions(event);
        });
        this.triggerMethod("ensure:scrollbar");
        this.triggerMethod("update:scrollbar");
      }
    },
    isChildContainerVisible: function() {
      return this.ui.comboOptionsContainer.is(":visible");
    },
    accessibility: function(event) {
      var validKeys = [ 38, 40, 113, 13 ];
      if (validKeys.indexOf(event.keyCode) !== -1) {
        if ((event.keyCode === 13 || event.keyCode === 113) && !this.$el.find(".d2-combofield-options").is(":visible")) {
          return;
        }
        if (!this.options.isDropDownOpen) {
          var that = this;
          $.when(this.fetchDataFromSource({
            filter: this.searchText
          })).done(function() {
            that.showOptions(event);
          });
          return;
        }
        var searchBase = this.ui.comboOptionsContainer.find("li").filter(":visible"), index = searchBase.index(searchBase.filter(".active")), selected = false, alpacaFieldEl = this.$el.parents(".binf-form-group.alpaca-field");
        searchBase.filter(".active").removeClass("active");
        if (event.keyCode === 38) {
          index = index === -1 || index === 0 ? searchBase.length - 1 : index - 1;
        } else if (event.keyCode === 40) {
          index = index === -1 || index === searchBase.length - 1 ? 0 : index + 1;
        } else if (event.keyCode === 13 || event.keyCode === 113) {
          if (this.addNewActive) {
            this.onClickAddOption(event);
          }
          if (!!searchBase[index] && searchBase[index].children[0]) {
            $(searchBase[index].children[0]).trigger("mousedown");
            selected = true;
          }
          if (this.alpacaField.isRequired()) {
            var value = this.curVal.id;
            if (value !== "") {
              alpacaFieldEl.removeClass("binf-has-error alpaca-invalid");
              this.$el.removeClass("cs-formfield-invalid");
              alpacaFieldEl.find(".binf-help-block.alpaca-message.alpaca-message-notOptional").hide();
            }
          } else {
            alpacaFieldEl.removeClass("binf-has-error alpaca-invalid");
            this.$el.removeClass("cs-formfield-invalid");
          }
        }
        if (!!searchBase[index] && (event.keyCode === 38 || event.keyCode === 40)) {
          this.ui.writeField.trigger("focus");
        }
        this.ui.writeField.attr("aria-activedescendant", $(searchBase[index]).attr("id"));
        $(searchBase[index]).addClass("active");
        if (event.keyCode === 38 || event.keyCode === 40 || selected) {
          event.stopPropagation();
          event.preventDefault();
          var optionScrollContainer = this.ui.comboOptionsContainer[0].children[1];
          if (searchBase.length) {
            if ($(optionScrollContainer).innerHeight() < $(searchBase[index]).position().top + $(searchBase[index]).height()) {
              $(optionScrollContainer).scrollTop($(optionScrollContainer).scrollTop() + $(searchBase[index]).position().top - $(searchBase[index]).height());
            } else if ($(searchBase[index]).position().top < 0) {
              $(optionScrollContainer).scrollTop($(optionScrollContainer).scrollTop() + $(searchBase[index]).position().top - $(searchBase[index]).height());
            }
          }
        }
      } else {
        if (event.keyCode === 27) {
          if (this.ui.comboOptionsContainer.is(":visible")) {
            event.preventDefault();
            event.stopPropagation();
            this.dropdownMenuVisible = this.ui.comboOptionsContainer.is(":visible");
            this.hideOptions();
            if (this.getEditableBehavior().showActions) {
              this.getEditableBehavior().showActions(event);
            }
            this.options.isDropDownOpen = false;
          }
        }
        if (event.keyCode === 9) {
          if (this.$el.find(".d2-combofield-options").is(":visible")) {
            event.preventDefault();
            event.stopPropagation();
            this.dropdownMenuVisible = this.ui.comboOptionsContainer.is(":visible");
            this.hideOptions();
            this.options.isDropDownOpen = false;
          } else {
            if ($(this.ui.writeField).val() === "") {
              if (this.options.model.get("options").massUpdateFileCount && this.showMultiplePlaceholder) {
                this.setValue(this.ui.writeField.attr("placeholder"), true);
              } else {
                this.setValue(null, true);
              }
            }
          }
        }
      }
    },
    search: function(event) {
      if (!this.enable) {
        return;
      }
      var invalidKeys = [ 9, 13, 16, 32, 38, 40, 113, 27, 17, 18 ];
      if (invalidKeys.indexOf(event.keyCode) > -1) {
        return;
      }
      this.ui.dropDownSearchResultCount.removeClass("d2-combo-no-result");
      var searchText = $(event.target).val();
      if (this.searchText !== searchText) {
        this.triggerMethod("text:search", searchText);
        this.searchText = searchText;
        this.fetchDataFromSource({
          filter: searchText,
          validateSearchText: true
        }).done(function() {
          if (this.searchText === searchText) {
            this.filterOptions.call(this, searchText, event);
          }
        }.bind(this));
      }
    },
    filterOptions: function(searchText, event) {
      if (searchText.length > 0) {
        searchText = searchText.replace(/[.+^${}()|[\]\\]/g, "\\$&");
        searchText = searchText.replace(/\?/g, ".");
        searchText = searchText.replace(/\*/g, ".*?");
      }
      this.collection.setOptionsFilter(searchText, "searchText").always(_.bind(function() {
        this._renderChildren();
        this.showOptions(event);
        this.updateSearchResultMessage();
        this.updateAddNewNode();
        if (searchText.length > 0) {
          this.ui.noneOption.hide();
        }
        if (this.isEditableCombo) {
          var exactMatches = this.collection.where({
            exactMatch: true
          });
          if (exactMatches.length === 1) {
            this.ui.addNewOption.hide();
          } else {
            this.ui.addNewOption.show();
            this.addNewActive = true;
          }
        }
        this.adjustPosition();
      }, this));
    },
    getVisibleOptionsCount: function() {
      if (utils.isMobile()) {
        return Math.ceil(this._calculateHeight() / 50) + 5;
      }
      return 30;
    },
    updateAddNewNode: function() {
      if (this.isEditableCombo) {
        var searchText = utils.sanitizeInputText(this.searchText), addNewLabel = searchText.length > 0 ? _.str.sformat(Lang.addNewItem, searchText) : Lang.addNew;
        if (utils.isMobile()) {
          this.ui.selectAddNewOption.text(addNewLabel);
        } else {
          this.ui.addNewOption.text(addNewLabel);
        }
      }
    },
    render: function(visible) {
      this._ensureViewIsIntact();
      this._isRendering = true;
      this.resetChildViewContainer();
      this.triggerMethod("before:render", this);
      this._renderTemplate();
      if (this.mode === "writeonly") {
        this._renderChildren();
      }
      this._isRendering = false;
      this.isRendered = true;
      this.triggerMethod("render", this, visible);
      return this;
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
    hideOptionsContainer: function() {
      this.hideOptions();
      this.setMobileHeaderAfterSelect();
    },
    setMobileHeaderAfterSelect: function() {
      this.$el.find(".d2mobile-inline-search").addClass("binf-hidden");
      this.hideInputField();
      PubSub.trigger("combo:options:hide");
      this.triggerMethod("transition:exit:right");
    },
    showOptions: function(event) {
      if (!this.enable) {
        return;
      }
      var self = this;
      if (utils.isMobile()) {
        PubSub.trigger("combo:options:show");
        require([ "mobile/utils/platform.controller" ], function(PlatformController) {
          PlatformController.clearButtons();
          PlatformController.setHeader({
            title: self.options.alpaca.options.label,
            backButtonVisible: true
          });
          PlatformController.setBackButton(_.bind(self.hideOptionsContainer, self));
        });
      }
      this.ui.comboOptions.find("li").on("mouseenter", function(event) {
        var el = $(event.currentTarget);
        if (!el.hasClass("active")) {
          self.ui.comboOptions.find(".active").removeClass("active");
          el.addClass("active");
        }
      });
      var scrollableCols = this.$el.closest(".csui-scrollable-writemode");
      if (!!scrollableCols && !scrollableCols.hasClass("csui-dropdown-open")) {
        scrollableCols.addClass("csui-dropdown-open");
      }
      this.ui.comboOptionsContainer.addClass("binf-show");
      if (this.includeNone) {
        this.ui.noneOption.show();
      } else {
        this.ui.noneOption.hide();
      }
      this.highlightSelectedOption();
      this.hideOptionsSelectedByOtherRow();
      this.ui.addNewOption.show();
      this.adjustPosition();
      !!event && event.stopPropagation();
      this.ui.writeField.attr("aria-expanded", true);
      this.triggerMethod("ensure:scrollbar");
      this.triggerMethod("update:scrollbar");
      var selectedKey = this.getValue().get("id");
      var selectedEl = this.ui.comboOptions.find('li[id="' + selectedKey + '"]');
      if (selectedKey && selectedEl.length === 1) {
        var optionScrollContainer = this.ui.comboOptionsContainer.children(".d2-scrollable-options");
        var scrollPosition = selectedEl[0].offsetTop + selectedEl.outerHeight();
        optionScrollContainer.scrollTop(scrollPosition - optionScrollContainer.outerHeight());
      }
      this.options.isDropDownOpen = true;
    },
    _calculateHeight: function(doApply) {
      var height = $(".cs-perspective-panel").height();
      if (this.ui.mobileSearchField && this.ui.mobileSearchField.val()) {
        height -= this.$(".d2mobile-inline-search").outerHeight();
      }
      if (doApply) {
        this.ui.scrollContainer.css("max-height", height);
      }
      return height;
    },
    highlightSelectedOption: function() {
      if (this.collection.length > 0) {
        var selectedKey = this.getValue().get("id");
        this.ui.comboOptions.find(".active").removeClass("active");
        var selectedEl;
        if (selectedKey) {
          this.ui.comboOptions.find(".d2-combo-selected").removeClass("d2-combo-selected");
          selectedEl = this.ui.comboOptions.find('li[id="' + selectedKey + '"]');
          selectedEl.addClass("d2-combo-selected active");
        } else {
          if (this.ui.noneOption.is(":visible")) {
            this.ui.noneOption.addClass("active");
          } else {
            selectedEl = this.ui.comboOptions.find('li[id="' + this.collection.at(0).get("id") + '"]');
            selectedEl.addClass("active");
          }
        }
      }
    },
    adjustPosition: function() {
      if (this.mode === "writeonly") {
        var fixedHeight;
        var inputEle = this.$el.find("input");
        var cbAction = utils.isMobile() ? _.bind(this._calculateHeight, this, true) : this.hideDropdown;
        inputEle && base.adjustDropDownField(inputEle, this.ui.comboOptionsContainer, true, this, cbAction, this.ui.scrollContainer);
        this.ui.comboOptionsContainer.addClass("binf-show");
        if (utils.isMobile()) {
          fixedHeight = this._calculateHeight();
        } else {
          fixedHeight = $(this.ui.scrollContainer).css("max-height").split("px")[0] - ($(this.ui.comboOptionsContainer).innerHeight() - $(this.ui.scrollContainer).innerHeight());
        }
        fixedHeight = fixedHeight + "px";
        $(this.ui.scrollContainer).css("max-height", fixedHeight);
        this.triggerMethod("update:scrollbar");
      }
    },
    hideDropdown: function(view) {
      view.hideOptions();
      if (view.getEditableBehavior().showActions) {
        view.getEditableBehavior().showActions();
      }
      var scrollableCols = view.$el.closest(".csui-scrollable-writemode");
      if (!!scrollableCols && scrollableCols.hasClass("csui-dropdown-open")) {
        scrollableCols.removeClass("csui-dropdown-open");
      }
    },
    hideOptions: function() {
      this.populateCollection().always(_.bind(function() {
        this.searchText = "";
        this.updateAddNewNode();
        this.ui.comboOptionsContainer.removeClass("binf-show");
        this.ui.writeField.attr("aria-expanded", false);
        this.options.isDropDownOpen = false;
      }, this));
    },
    fetchDataFromSource: function(options) {
      options = _.extend({
        view: this,
        filter: this.ui.writeField.val()
      }, options);
      options.taxonomyType = options.taxonomyType ? options.taxonomyType : 0;
      this.ui.dropDownSearchResultCount.addClass("binf-hidden");
      var deferred = $.Deferred(), doUpdateCollection;
      if (ComboDataSourceUtils.isAsynchronousDataSourceField(this.alpacaField)) {
        this.ui.lazyloader.show();
        this.ui.options.hide();
        this.ui.addNewOption.hide();
        var me = this;
        this.alpacaField.pullData(options).done(_.bind(function(response) {
          if (utils.isMobile()) {
            this.$el.find(".d2mobile-inline-search").removeClass("binf-hidden");
          }
          doUpdateCollection = _.isEmpty(options.filter) || !options.validateSearchText || options.validateSearchText && options.filter === this.searchText;
          if (doUpdateCollection) {
            var collectionData = _.map(response, function(model) {
              return model.attributes;
            });
            this.populateCollection(collectionData).done(_.bind(function() {
              this.optionsCollection.reset(response);
              this.suggestions && this.suggestions.each(function(suggestion) {
                me.collection.add(suggestion);
              });
              this.ui.lazyloader.hide();
              this.ui.options.show();
              this.ui.addNewOption.show();
              this.optionsRendered = true;
              if (_.isEmpty(this.searchText)) {
                this.resultCount = this.collection.allModels.length;
              }
              this.updateSearchResultMessage();
              var curValue = this.getValue();
              var present = false;
              present = _.find(response, function(model) {
                return model.get("id") === curValue.get("id");
              });
              if (curValue.get("id") && !present) {
                this.setValue(null, true, false);
              } else if (options.ignoreDependencyEvents !== true && options.firstLoad !== true) {
                this.raiseTaxonomyEvents();
              }
              deferred.resolve(response);
            }, this));
          } else {
            deferred.resolve(response);
          }
        }, this)).fail(_.bind(function(error) {
          this.ui.lazyloader.hide();
          if (utils.isMobile()) {
            this.hideOptionsContainer();
          }
          deferred.reject(error);
        }, this));
      } else {
        if (utils.isMobile()) {
          this.$el.find(".d2mobile-inline-search").removeClass("binf-hidden");
        }
        if (!this.optionsRendered && this.mode === "writeonly") {
          this.populateCollection().always(_.bind(function() {
            this.ui.lazyloader.show();
            this.ui.lazyloader.hide();
            this.optionsRendered = true;
            this.adjustPosition();
            deferred.resolve();
          }, this));
        } else {
          deferred.resolve();
        }
      }
      return deferred.promise();
    },
    populateCollection: function(collectionData) {
      var dfd = $.Deferred();
      if (!collectionData && this.optionsCollection && this.optionsCollection.length > 0) {
        collectionData = this.optionsCollection.map(function(model) {
          return model.attributes;
        });
      }
      if (collectionData) {
        if (this.alpacaField && this.alpacaField.options && this.alpacaField.options.ignoreProgressiveLoad === true) {
          this.collection.reset(collectionData);
          dfd.resolve();
        } else {
          this.collection.populate(collectionData, {
            reset: true
          }).done(dfd.resolve).fail(dfd.reject);
        }
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    updateSearchResultMessage: function() {
      this.ui.dropDownSearchResultCount.removeClass("d2-combo-no-result");
      this.ui.dropDownSearchResultCount.text("");
      if (this.children.length === 0) {
        this.ui.dropDownSearchResultCount.addClass("d2-combo-no-result");
        this.ui.dropDownSearchResultCount.text(Lang.noResultFound);
        this.ui.dropDownSearchResultCount.attr("aria-label", Lang.noResultFound);
        this.ui.dropDownSearchResultCount.removeClass("binf-hidden");
        return;
      }
      if (this.showSearchCount || this.alpacaField.options.ds && this.alpacaField.options.ds.async) {
        var message, messageLabel;
        if (this.resultCount === null || this.resultCount === undefined) {
          messageLabel = Lang.showingResultsNoTotal;
        } else if (this.collection.hasMoreRecords) {
          messageLabel = Lang.showingHasMore;
        } else {
          messageLabel = Lang.showingResultsOfMatches;
        }
        var matchCount = this.collection.filteredResultCount || this.collection.allModels.length;
        var totalCount = this.resultCount;
        if (_.isEmpty(this.searchText)) {
          message = _.str.sformat(messageLabel, totalCount, totalCount);
          matchCount = this.collection.hasMoreRecords ? matchCount : 0;
        } else {
          message = _.str.sformat(messageLabel, matchCount, totalCount);
        }
        if (matchCount > 0) {
          this.ui.dropDownSearchResultCount.text(message);
          this.ui.dropDownSearchResultCount.removeClass("binf-hidden");
        }
      }
    },
    onClickAddOption: function(event) {
      event.preventDefault();
      event.stopPropagation();
      var searchText = utils.sanitizeInputText(this.searchText);
      if (searchText.length > 0) {
        var newModel = new FieldOptionModel({
          id: searchText,
          name: searchText,
          uniqueOptionId: _.uniqueId(this.alpacaField.name + "_option_")
        });
        this.searchText = "";
        this.collection.add(newModel);
        this.suggestions.push(newModel);
        this.updateSearchResultMessage();
        this.ui.addNewOption.hide();
        if (!utils.isMobile()) {
          this.ui.options.hide();
        }
        this.setValue(newModel, true);
        this.addNewActive = false;
      } else {
        if (utils.isMobile()) {
          this.addMobileSpecificPlaceHolder();
        } else {
          this.addNewItemPlaceHolder();
        }
      }
    },
    setFocus: function() {
      if (this.mode === "writeonly") {
        this.ui.writeField.attr("placeholder", this._getPlaceHolder());
        this.ui.writeField.trigger("focus");
      } else {
        this.ui.readField.trigger("focus");
      }
    },
    addNewItemPlaceHolder: function() {
      this.setFocus();
      this.ui.writeField.val("");
      this.ui.writeField.attr("placeholder", Lang.typeNew);
      this.addNewActive = true;
    },
    _getPlaceHolder: function() {
      var options = this.options.model.get("options");
      if (options.massUpdateFileCount) {
        if (options.ds && options.ds.assistance_type === "taxonomy") {
          return Lang.selectNewValueForAllFiles;
        } else {
          return MassUpdateUtils.fieldHasMultipleValues(this.getEditValue().get("id")) ? this.getEditValue().get("id") : Lang.selectFieldEmptyFieldLabel;
        }
      } else {
        return Lang.selectFieldEmptyFieldLabel;
      }
    },
    onClickNoneOption: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.eventSource = undefined;
      this.setValue(null, true);
      this._updateSelectedOption(this.getValue());
    },
    setValue: function(value, validate, silent) {
      var bIsValid = true;
      if (validate || this.forceUpdate) {
        if (this.alpacaField) {
          bIsValid = this.alpacaField.setValueAndValidate(value, validate);
        }
      }
      if (bIsValid) {
        this.$el.removeClass("cs-formfield-invalid");
        this.oldVal = this.curVal.clone();
        if (_.isUndefined(value) || _.isNull(value)) {
          this.resetSelection(silent);
        } else {
          this._updateModel(value, silent);
        }
        this.curVal = this.getValue().clone();
        this.$el.trigger($.Event("field:valid"), this);
      } else {
        this.$el.addClass("cs-formfield-invalid");
        var event = $.Event("field:invalid");
        this.$el.trigger(event);
      }
      return bIsValid;
    },
    getOldValue: function() {
      return this.oldVal;
    },
    getEditValue: function() {
      return this.getValue();
    },
    getValue: function() {
      return this.model;
    },
    getValueLabel: function() {
      return this.model.get("name");
    },
    setMode: function(mode) {
      this.mode = mode;
      this.getStatesBehavior().state = undefined;
    },
    getEditableBehavior: function() {
      return this._behaviors[0];
    },
    allowSaveOnEnter: function() {
      return false;
    },
    getStatesBehavior: function() {
      return this._behaviors[1];
    },
    isReadyToSave: function() {
      var $dropdown = this.$(".d2-combofield-options-container"), bRet = $dropdown.length === 0 || !$dropdown.is(":visible");
      return bRet;
    },
    _updateModel: function(model, silent) {
      var value;
      if (model instanceof Backbone.Model) {
        value = model.pick("id", "name");
      } else if (_.isObject(model)) {
        value = _.pick(model, "id", "name");
      } else {
        value = {
          id: model,
          value: model
        };
      }
      if (value.id && this.model.get("id") === value.id && this.raiseValueChangedExplicitly) {
        this.raiseValueChangedExplicitly = false;
        this._raiseValueChanged();
      }
      if (this.model.get("id") !== value.id) {
        this.model.set(value, {
          silent: silent
        });
      }
    },
    setStateRead: function() {
      if (this.curVal.id !== this.getValue().id) {
        this.setValue(this.getValue().id);
        if (this.alpacaField.validate()) {
          this.alpacaField.refreshValidationState(false);
        }
      }
      return false;
    },
    _getValueChangeEventData: function() {
      return {
        fieldvalue: this.getValue().get("id"),
        fieldid: this.options.dataId,
        fieldpath: this.options.path,
        targetfieldpath: this.options.path,
        fieldView: this
      };
    },
    _raiseValueChanged: function() {
      this.oldVal = this.curVal;
      var data = this._getValueChangeEventData();
      this.trigger("field:changed", data);
      PubSub.trigger(this.options.dataId + "dependentattrchanged", this);
      var event = $.Event("field:changed");
      _.extend(event, data);
      this.$el.trigger(event);
      this.raiseTaxonomyEvents();
    },
    raiseTaxonomyEvents: function(retainCurrentValue, firstLoad) {
      this._raiseDownwardTaxonomy(retainCurrentValue, firstLoad);
      this._raiseUpwardTaxonomyEvent(retainCurrentValue, firstLoad);
    },
    _raiseDownwardTaxonomy: function(retainCurrentValue, firstLoad) {
      if (this.alpacaField.options.ds) {
        var args, index;
        var taxoFieldAfter = this.alpacaField.options.ds.assistanceTaxoAttrAfter;
        if (taxoFieldAfter) {
          if (taxoFieldAfter !== this.eventSource) {
            args = _.extend({}, {
              control: taxoFieldAfter,
              value: this.getValue().get("id"),
              source: this.alpacaField.propertyId,
              retainCurrentValue: retainCurrentValue,
              firstLoad: firstLoad
            });
            if (this.alpacaField.options.isGridField) {
              index = _.first(_.last(this.alpacaField.parent.path.split("[")).split("]"));
              _.extend(args, {
                index: index
              });
            }
            args.taxonomy = true;
            this.metadataView.trigger("taxo:downChangeEvent", args);
          }
        }
        if (this.alpacaField.forward && !this.alpacaField.backward) {
          if (this.alpacaField.options.massUpdateFileCount && !retainCurrentValue && !MassUpdateUtils.fieldHasMultipleValues(this.getValue())) {
            var found = _.find(this.alpacaField.taxonomyAncestors, function(ancestor) {
              return ancestor.propertyId === this.eventSource;
            }, this);
            if (!found) {
              _.each(this.alpacaField.taxonomyAncestors, function(ancestor) {
                if (MassUpdateUtils.fieldHasMultipleValues(ancestor.fieldView.getValue())) {
                  ancestor.fieldView.setDefaultValue(null, true);
                  ancestor.updatedFieldView.$el.removeClass("binf-hidden");
                }
              }, this);
            }
          }
        }
      }
    },
    _raiseUpwardTaxonomyEvent: function(retainCurrentValue, firstLoad) {
      if (this.alpacaField.options.ds) {
        var args, index;
        var taxoFieldBefore = this.alpacaField.options.ds.assistanceTaxoAttrBefore;
        if (taxoFieldBefore) {
          if (taxoFieldBefore !== this.eventSource) {
            args = _.extend({}, {
              control: taxoFieldBefore,
              value: this.getValue().get("id"),
              source: this.alpacaField.propertyId,
              taxonomyName: this.alpacaField.options.ds.taxonomyName,
              taxonomyLevel: this.alpacaField.options.ds.taxonomyLevel,
              taxonomyKey: this.alpacaField.options.ds.taxonomyKey,
              retainCurrentValue: retainCurrentValue,
              firstLoad: firstLoad
            });
            if (this.alpacaField.options.isGridField) {
              index = _.first(_.last(this.alpacaField.parent.path.split("[")).split("]"));
              _.extend(args, {
                index: index
              });
            }
            args.taxonomy = true;
            this.metadataView.trigger("taxo:upChangeEvent", args);
          }
        }
        if (this.alpacaField.backward && !this.alpacaField.forward) {
          if (this.alpacaField.options.massUpdateFileCount && !retainCurrentValue && !MassUpdateUtils.fieldHasMultipleValues(this.getValue())) {
            var found = _.find(this.alpacaField.taxonomyChildren, function(ancestor) {
              return ancestor.propertyId === this.eventSource;
            }, this);
            if (!found) {
              _.each(this.alpacaField.taxonomyChildren, function(child) {
                if (MassUpdateUtils.fieldHasMultipleValues(child.fieldView.getValue())) {
                  child.fieldView.setDefaultValue(null, true);
                  child.updatedFieldView.$el.removeClass("binf-hidden");
                }
              }, this);
            }
          }
        }
      }
    },
    resetSelection: function(silent) {
      this.model.set({
        id: "",
        name: ""
      }, {
        silent: !!silent
      });
    },
    _updateSelectedOption: function(model) {
      this.setValue(model);
      this.ui.comboOptions.find(".d2-combo-selected").removeClass("d2-combo-selected");
      this.ui.comboOptions.find("li:active").addClass("d2-combo-selected");
      if (!utils.isMobile()) {
        this.ui.writeField.trigger("focus", {
          forceTrigger: true
        });
      } else {
        this.setMobileHeaderAfterSelect();
      }
      this.hideOptions();
      if (this.options.mode === "create") {
        var that = this;
        setTimeout(function(e) {
          that.ui && that.ui.writeField && that.ui.writeField.trigger("change");
          if (that.getEditableBehavior().showActions) {
            that.getEditableBehavior().showActions(e);
          }
          that.options.isDropDownOpen = false;
        }, 110);
      } else {
        if (this.getEditableBehavior().showActions) {
          this.getEditableBehavior().showActions(this);
        }
        this.options.isDropDownOpen = false;
      }
    },
    setStateWrite: function(validate) {
      if (this.options.model.get("options").massUpdateFileCount && !(this.childTKLViews.length || this.parentViews.length)) {
        this.setValue(this.curVal, validate);
      }
      return false;
    },
    setDefaultValue: function(args, silent) {
      var defaultValue = this.collection.filter(function(model) {
        return model.get("isDefault") === true;
      });
      if (defaultValue.length) {
        this.setValue(defaultValue[0], true, silent);
      } else {
        this.forceUpdate = true;
        this.setValue(null, true, silent);
        this.resetSelection(silent);
      }
      if (this.alpacaField.options.hasMultipleValues && this.alpacaField.options.ds && this.alpacaField.options.ds.assistance_type === "taxonomy" && silent) {
        this.ui.writeField.attr("placeholder", Lang.selectNewValueForAllFiles);
      }
    },
    doComboReload: function(args) {
      var options;
      if (this.mode === "readonly") {
        return;
      }
      if (args instanceof Backbone.Model) {
        options = {
          attrBeforeChange: args
        };
      } else {
        if (args.control !== this.alpacaField.propertyId) {
          return;
        }
        if (args.index) {
          if (this.alpacaField.options.isGridField) {
            var index = _.last(this.alpacaField.parent.path.split("[")).split("]")[0];
            if (args.index !== index) {
              return;
            }
          }
        }
        this.eventSource = args.source;
        this.alpacaField.parentValue = args.value;
        options = args;
      }
      this.alpacaField.loadTaxonomyChildren();
      var context = this.alpacaField.connector.config.context;
      var connector = context && context.getObject("connector") || this.alpacaField.connector.config.formView.node.connector;
      this.alpacaField.options.ds.connector = connector;
      args.field = this.alpacaField;
      args.upwardFlag = true;
      args.taxonomyName = this.alpacaField.options.ds.taxonomyName, args.taxonomyLevel = this.alpacaField.options.ds.taxonomyLevel, 
      args.taxonomyKey = this.alpacaField.options.ds.taxonomyKey;
      options.reload = true;
      args.upwardFlag = false;
      options.taxonomyType = 1;
      var self = this;
      var existingValue = self.getValue().id;
      this.fetchDataFromSource(options).done(function() {
        if (args.value === "" && self.alpacaField.forward) {
          this.setValue(null, true);
          this.resetSelection();
          this.raiseTaxonomyEvents(args.retainCurrentValue);
        } else {
          if (self.alpacaField.backward) {
            args.field = self.alpacaField;
            var selectedOptions = ComboDataSourceUtils.getTaxonomySelection(args);
            if (selectedOptions.length && selectedOptions.length === 1) {
              this.forceUpdate = true;
              var selectedModel = this.collection.get(selectedOptions[0].value);
              this.setValue(selectedModel, true);
            } else {
              var exists = _.find(selectedOptions, function(options) {
                if (options.value === existingValue) {
                  return options;
                }
              });
              if (!exists && !args.retainCurrentValue) {
                this.setDefaultValue();
              } else {
                if (!args.retainCurrentValue) {
                  this.setDefaultValue(args);
                  var currValue = self.getValue().id;
                  if (existingValue === currValue) {
                    self._raiseDownwardTaxonomy(args.retainCurrentValue);
                  }
                }
              }
            }
          } else {
            if (!args.retainCurrentValue) {
              this.setDefaultValue(args);
              var curValue = self.getValue().id;
              if (existingValue === curValue) {
                self._raiseDownwardTaxonomy(args.retainCurrentValue);
              }
            }
          }
        }
        if (!this.options.valueExistsInDB) {
          if (this.alpacaField.options?.autoSelectIfSingle === true && this.optionsCollection.length === 1) {
            this.raiseValueChangedExplicitly = true;
            this.setValue(this.optionsCollection.first(), true);
          }
        }
      }.bind(this));
    },
    doComboReset: function(args) {
      if (args.control !== this.alpacaField.propertyId) {
        return;
      }
      if (this.mode === "readonly") {
        return;
      }
      if (args.index) {
        if (this.alpacaField.options.isGridField) {
          var index = _.last(this.alpacaField.parent.path.split("[")).split("]")[0];
          if (args.index !== index) {
            return;
          }
        }
      }
      this.eventSource = args.source;
      if (this.alpacaField.options.isGridField) {
        this.alpacaField.loadTaxonomyChildren();
      }
      var context = this.alpacaField.connector.config.context;
      var connector = context && context.getObject("connector") || this.alpacaField.connector.config.formView.node.connector;
      this.alpacaField.options.ds.connector = connector;
      var options = {};
      options.taxonomyType = -1;
      var self = this;
      this.fetchDataFromSource(options).done(function() {
        if (args.value === "" && !self.alpacaField.forward) {
          this.setValue(null, true);
        } else {
          args.field = self.alpacaField;
          var selectedOptions = ComboDataSourceUtils.getTaxonomySelection(args);
          if (selectedOptions.length > 0) {
            if (selectedOptions.length > 1) {
              var exists = _.find(selectedOptions, function(options) {
                if (options.value === self.getValue().id) {
                  return options;
                }
              });
              if (exists) {
                this._raiseUpwardTaxonomyEvent(true, args.firstLoad);
              } else {
                if (MassUpdateUtils.fieldHasMultipleValues(this.model.get("id")) && args.firstLoad) {
                  this._raiseUpwardTaxonomyEvent(true, args.firstLoad);
                } else {
                  this.setDefaultValue();
                }
              }
            } else {
              this.forceUpdate = true;
              var selectedModel = this.collection.get(selectedOptions[0].value);
              this.setValue(selectedModel, true);
            }
          } else {
            if (!args.retainCurrentValue) {
              this.setDefaultValue(args);
            }
          }
        }
        if (!this.options.valueExistsInDB) {
          if (this.alpacaField.options?.autoSelectIfSingle === true && this.optionsCollection.length === 1) {
            this.raiseValueChangedExplicitly = true;
            this.setValue(this.optionsCollection.first(), true);
          }
        }
      }.bind(this));
    },
    enableDisableField: function(flag) {
      this.ui.writeField.siblings(".d2-icon-caret-down").removeClass("d2-icon-disabled");
      this.enable = flag;
      if (!this.enable) {
        this.ui.writeField.siblings(".d2-icon-caret-down").addClass("d2-icon-disabled");
        this.ui.writeField.attr("placeholder", CsuiLang.noValueSet);
      } else {
        this.ui.writeField.attr("placeholder", this._getPlaceHolder());
      }
    },
    validateOptions: function() {
      var valid = this.errorList.indexOf(this.alpacaField.data) === -1;
      if (this.alpacaField.options.massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.alpacaField.getValue())) {
        var error = _.some(this.alpacaField.options.multiFileCountData, function(objectValue) {
          return objectValue.count > 0 && _.isString(objectValue.category) && /Error/.test(objectValue.category);
        });
        valid = !error;
      }
      return valid;
    },
    focusOutAction: function(event) {
      var placeHolder = this._getPlaceHolder();
      if (this.addNew) {
        $(this.ui.writeField).trigger("focus");
        $(this.ui.writeField).val("");
        this.ui.writeField.trigger("keyup");
        $(this.ui.writeField).attr("placeholder", Lang.typeNew);
        this.addNew = false;
        return;
      }
      if (this.alpacaField && this.alpacaField.schema) {
        if (this.alpacaField.schema.required && (this.getValue() && (this.getValue().id === "" || this.getValue().id === null))) {
          this.alpacaField.setValueAndValidate(this.getValue().id, true);
          this.$el.trigger($.Event("field:invalid"));
        }
        if (this.alpacaField.schema.disabled) {
          placeHolder = CsuiLang.noValueSet;
        }
      }
      $(this.ui.writeField).attr("placeholder", placeHolder);
      var value = this.getValue().get("name") || this.getValue().get("id");
      if ($(this.ui.writeField).val() === "" && value !== "") {
        this.setValue(null, true);
      } else {
        $(this.ui.writeField).val(this.getValue().get("name") || this.getValue().get("id"));
      }
      if (!utils.isMobile()) {
        var $focused = $(":focus");
        if (!$focused.is(this.ui.comboOptionsContainer.children(".csui-normal-scrolling"))) {
          this.hideOptions(event);
        }
      }
    },
    focusInAction: function() {
      this.ui.writeField.trigger("select");
      if (utils.isMobile()) {
        this.ui.writeField.trigger("blur");
      }
    },
    isDuplicate: function() {
      var hasDuplicate = false;
      if (this.alpacaField.options.isGridField && this.alpacaField.schema.uniqueItems) {
        var me = this;
        hasDuplicate = _.some(this.alpacaField.parent.parent.children, function(child) {
          if (me.alpacaField.name !== child.childrenByPropertyId[me.alpacaField.propertyId].name || me.alpacaField.parent.name !== child.name) {
            var data = child.childrenByPropertyId[me.alpacaField.propertyId].data;
            if (!_.isEmpty(data) && me.alpacaField.data === data) {
              return true;
            }
          }
        });
      }
      return hasDuplicate;
    },
    hideOptionsSelectedByOtherRow: function() {
      if (this.alpacaField.options.isGridField && this.alpacaField.schema.uniqueItems) {
        var me = this;
        _.each(this.alpacaField.parent.parent.children, function(child) {
          if (me.alpacaField.name !== child.childrenByPropertyId[me.alpacaField.propertyId].name || me.alpacaField.parent.name !== child.name) {
            var data = child.childrenByPropertyId[me.alpacaField.propertyId].data;
            if (!_.isEmpty(data)) {
              me.ui.comboOptions.find("li[ id='" + data + "']").addClass("selectedByAnotherRow").addClass("binf-hidden");
            }
          }
        });
      }
    },
    showInputField: function() {
      this.$(".csui-input-before-focus").addClass("binf-hidden");
      this.$(".csui-search .csui-input").removeClass("binf-hidden").trigger("focus");
      this.$(".csui-search").removeClass("csui-search-prompt");
      if (this.ui.mobileSearchField.val()) {
        this.ui.searchClearIcon.addClass("csui-show");
      }
    },
    hideInputField: function() {
      this.$(".csui-input-before-focus").removeClass("binf-hidden");
      this.$(".csui-search .csui-input").addClass("binf-hidden").trigger("blur");
      this.$(".csui-search").addClass("csui-search-prompt");
      this.ui.mobileSearchField.val("");
    },
    clearSearchText: function() {
      this.ui.mobileSearchField.val("");
      this.ui.mobileSearchField.trigger("focus");
      this.ui.searchClearIcon.removeClass("csui-show");
      this.onSearchInputChange();
    },
    onSearchInputChange: function() {
      if (this.ui.mobileSearchField.val()) {
        this.ui.searchClearIcon.addClass("csui-show");
      } else {
        this.ui.searchClearIcon.removeClass("csui-show");
      }
      var event = $.Event("keyup");
      event.target = this.ui.mobileSearchField;
      this.ui.writeField.trigger(event);
      this._calculateHeight();
    },
    addMobileSpecificPlaceHolder: function() {
      this.showInputField();
      this.ui.mobileSearchField.attr("placeholder", Lang.typeNew);
    }
  });
  MassUpdateFieldMixin.mixin(D2ComboFieldView.prototype);
  return D2ComboFieldView;
});