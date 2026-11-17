/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/themes/theming", "csui/controls/form/fields/base/csformfield.editable.behavior", "csui/controls/form/fields/base/csformfield.states.behavior", "csui/controls/form/fields/base/csformarrayfield.editable.behavior", "csui/controls/form/fields/base/csformarrayfield.states.behavior", "csui/controls/form/pub.sub", "nuc/utils/base", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/tile/behaviors/infinite.scrolling.behavior", "dctmw/controls/form/fields/models/field.option", "dctmw/controls/form/fields/models/field.options", "dctmw/utils/dctmw.datasource.utils", "dctmw/utils/icons/dctmw.jato.action.icons", "dctmw/utils/utils", "i18n!dctmw/controls/form/impl/nls/lang", "i18n!csui/controls/form/impl/nls/lang", "hbs!dctmw/controls/form/impl/dctmwcombo/dctmwcombofield.item", "hbs!dctmw/controls/form/impl/dctmwcombo/dctmwcombofield", "css!dctmw/controls/form/impl/dctmwcombo/dctmwcombofield", "csui/lib/binf/js/binf" ], function(_, $, Backbone, Marionette, theming, FormFieldEditableBehavior, FormFieldStatesBehavior, FormArrayFieldEditable2Behavior, FormArrayFieldStatesBehavior, PubSub, base, PerfectScrollingBehavior, InfiniteScrollingBehavior, FieldOptionModel, FieldOptionCollection, DctmwDataSourceUtils, DctmwJatoActionIcons, utils, Lang, CsuiLang, ComboItemViewTemplate, ComboViewTemplate) {
  "use strict";
  var itemView = Marionette.ItemView.extend({
    template: ComboItemViewTemplate,
    tagName: "li",
    className: "dctmw-combofield-option",
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
      var searchText = this.model.collection.getOptionsFilter("searchText"), searchRegex = searchText && new RegExp(searchText, "gi"), name = this.model.get("name"), optionContainer = this.$el.find("a span.dctmw-combofield-text-container");
      if (searchRegex) {
        optionContainer.html(name.replace(searchRegex, function(matchT) {
          return "<span class='dctmw-highlight-options'>" + matchT + "</span>";
        }));
        searchRegex.source.trim().toLowerCase() === name.trim().toLowerCase() ? this.model.set("exactMatch", true) : this.model.set("exactMatch", false);
      }
    },
    onClickOption: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.triggerMethod("click:item");
    }
  });
  const DctmwComboFieldView = Marionette.CompositeView.extend({
    constructor: function DctmwComboFieldView(options) {
      this.dctmwPreConstruction(options);
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
      this._initialVal = this.model.clone();
      this.listenTo(this.model, "change", function() {
        this.collection.trigger("reset");
      });
      this.listenTo(this.model, "change", function(attributes, options = {}) {
        this._raiseValueChanged(options.eventArgs);
      });
      this.throttleFrequency = this.alpacaField.options.ds ? this.alpacaField.options.queryDelay || 1e3 : 0;
      this.isEditableCombo = options.alpaca.options.isEditable;
      if (this.isEditableCombo) {
        this.suggestions = new Backbone.Collection();
      }
      this.errorList = [];
      this.dctmwPostConstruction();
      this.enable = !this.alpacaField.schema.disabled;
      this.searchText = "";
      this.listenTo(this, "disable:field", this._setOrRemoveToolTipOnField);
    },
    dctmwPreConstruction: function(options) {
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
    },
    dctmwPostConstruction: function() {},
    className: "cs-formfield dctmw-combofield",
    childView: itemView,
    childViewOptions: function() {
      return {
        originatingView: this
      };
    },
    childViewContainer: ".dctmw-combofield-options",
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
        controlId: this.alpacaField.propertyId,
        isReadOnly: this.mode === "readonly",
        hasData: data !== "" && data !== null && this.options.hasValue,
        data: data,
        dataId: dataId,
        emptyLabel: this.mode === "writeonly" && this.enable ? this._getPlaceHolder() : CsuiLang.noValueSet,
        noneLabel: theming.isJATOTheme() ? Lang.comboFieldNoneJatoLabel : Lang.selectFieldDefaultLabel,
        noValue: Lang.noValue,
        writeonlyMode: this.mode === "writeonly",
        idBtnLabel: this.options.labelId,
        readModeAria: isReadOnly ? _.str.sformat(Lang.fieldReadOnlyAria, this.alpacaField.options.label, _.isEmpty(data) ? Lang.noValue : data) + requiredTxt : _.str.sformat(Lang.fieldEditAria, this.alpacaField.options.label, data) + requiredTxt,
        ariaRequired: isRequired,
        addNewLabel: searchText.length > 0 ? _.str.sformat(Lang.addNewItem, searchText) : Lang.addNew,
        addNewId: _.uniqueId("listitem"),
        disabled: !this.enable,
        isEditable: this.isEditableCombo,
        isJATO: theming.isJATOTheme(),
        caretIconSVG: DctmwJatoActionIcons.actionChevronSmallDown
      };
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".dctmw-scrollable-options",
        suppressScrollX: true
      },
      InfiniteScrolling: {
        behaviorClass: InfiniteScrollingBehavior,
        contentParent: ".dctmw-scrollable-options",
        content: ".dctmw-combofield-options"
      }
    },
    ui: function() {
      return {
        options: ".dctmw-combofield-options",
        writeFieldInner: ".cs-field-write-inner",
        writeField: ".cs-field-write input",
        readField: ".cs-field-read button",
        comboOptionsContainer: ".dctmw-combofield-options-container",
        comboOptions: ".dctmw-combofield-options-list",
        lazyloader: ".dctmw-lazy-loading",
        scrollContainer: ".dctmw-scrollable-options",
        addNewOption: ".dctmw-add-new-option",
        noneOption: ".dctmw-none-item",
        noneIconContainer: ".dctmw-none-item .dctmw-listfield-icon-container",
        dropDownSearchResultCount: ".dctmw-searchResultCountDetails"
      };
    },
    events: function() {
      return {
        "mousedown @ui.addNewOption": "onClickAddOption",
        "mousedown @ui.noneOption": "onClickNoneOption",
        "mousedown @ui.writeField": "onMouseDownWriteField",
        "keydown @ui.writeField": "accessibility",
        "focusout @ui.writeField": "focusOutAction",
        "focusin @ui.writeField": "focusInAction"
      };
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
        if ((event.keyCode === 13 || event.keyCode === 113) && !this.$el.find(".dctmw-combofield-options").is(":visible")) {
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
          if (this.$el.find(".dctmw-combofield-options").is(":visible")) {
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
      this.ui.dropDownSearchResultCount.removeClass("dctmw-combo-no-result");
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
      return 30;
    },
    updateAddNewNode: function() {
      if (this.isEditableCombo) {
        var searchText = utils.sanitizeInputText(this.searchText), addNewLabel = searchText.length > 0 ? _.str.sformat(Lang.addNewItem, searchText) : Lang.addNew;
        this.ui.addNewOption.text(addNewLabel);
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
    showOptions: function(event) {
      if (!this.enable) {
        return;
      }
      var self = this;
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
        var optionScrollContainer = this.ui.comboOptionsContainer.children(".dctmw-scrollable-options");
        var scrollPosition = selectedEl[0].offsetTop + selectedEl.outerHeight();
        optionScrollContainer.scrollTop(scrollPosition - optionScrollContainer.outerHeight());
      }
      this.options.isDropDownOpen = true;
    },
    highlightSelectedOption: function() {
      if (this.collection.length > 0) {
        var selectedKey = this.getValue().get("id");
        this.ui.comboOptions.find(".active").removeClass("active");
        var selectedEl;
        if (selectedKey) {
          this.ui.comboOptions.find(".dctmw-combo-selected").removeClass("dctmw-combo-selected");
          selectedEl = this.ui.comboOptions.find('li[id="' + selectedKey + '"]');
          selectedEl.addClass("dctmw-combo-selected active");
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
        inputEle && base.adjustDropDownField(inputEle, this.ui.comboOptionsContainer, true, this, this.hideDropdown, this.ui.scrollContainer);
        this.ui.comboOptionsContainer.addClass("binf-show");
        fixedHeight = $(this.ui.scrollContainer).css("max-height").split("px")[0] - ($(this.ui.comboOptionsContainer).innerHeight() - $(this.ui.scrollContainer).innerHeight());
        $(this.ui.scrollContainer).css("max-height", fixedHeight + "px");
        let scrollContainerMaxHeight = $(this.ui.scrollContainer).css("max-height").split("px")[0], scrollContainerHeight = $(this.ui.scrollContainer).innerHeight(), singleOptionHeight = $($(this.ui.comboOptions).children()[$(this.ui.comboOptions).children().length - 1]).innerHeight();
        if (!this.options?.alpacaField?.options?.ignoreProgressiveLoad && scrollContainerMaxHeight > scrollContainerHeight && (this.collection.filteredResultCount || this.collection.allModels.length) > this.collection.topCount) {
          let additionalNumberOfOptionsThatCanBeShown = (scrollContainerMaxHeight - scrollContainerHeight) / singleOptionHeight, newTopCount = this.collection.topCount + Math.ceil(additionalNumberOfOptionsThatCanBeShown) + 1;
          this.collection.topCount = newTopCount;
          this.collection.fetch();
        }
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
      this.ui.dropDownSearchResultCount.addClass("binf-hidden");
      var deferred = $.Deferred();
      if (DctmwDataSourceUtils.isAsynchronousDataSourceField(this.alpacaField)) {
        this.ui.lazyloader.show();
        this.ui.options.hide();
        this.ui.addNewOption.hide();
        this.alpacaField.pullData(options).done(response => {
          this._handleAsyncDataFetch(response, options).then(deferred.resolve, deferred.reject);
        }).fail(err => {
          this._handleAsyncDataFetchFailure(err);
          deferred.reject(err);
        });
      } else {
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
    _handleAsyncDataFetch: function(response, options) {
      let deferred = $.Deferred(), doUpdateCollection = _.isEmpty(options.filter) || !options.validateSearchText || options.validateSearchText && options.filter === this.searchText;
      if (doUpdateCollection) {
        var collectionData = _.map(response, model => model.attributes);
        this.populateCollection(collectionData).done(() => {
          this.optionsCollection.reset(response);
          this.suggestions && this.suggestions.each(suggestion => {
            this.collection.add(suggestion);
          });
          this.ui.lazyloader.hide();
          this.ui.options.show();
          this.ui.addNewOption.show();
          this.optionsRendered = true;
          if (_.isEmpty(this.searchText)) {
            this.resultCount = this.collection.allModels.length;
          }
          this.updateSearchResultMessage();
          this._updateDataOnFetch(response, options);
          deferred.resolve(response);
        });
      } else {
        deferred.resolve(response);
      }
      return deferred.promise();
    },
    _handleAsyncDataFetchFailure: function() {
      this.ui.lazyloader.hide();
    },
    _updateDataOnFetch: function(response) {
      const curValue = this.getValue(), present = _.find(response, model => model.get("id") === curValue.get("id"));
      if (curValue.get("id") && !present) {
        this.setValue(null, true, false);
      }
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
      this.ui.dropDownSearchResultCount.removeClass("dctmw-combo-no-result");
      this.ui.dropDownSearchResultCount.text("");
      if (this.children.length === 0) {
        this.ui.dropDownSearchResultCount.addClass("dctmw-combo-no-result");
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
    _hideItemsOnAddNewOption: function() {
      this.ui.addNewOption.hide();
      this.ui.options.hide();
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
        this._hideItemsOnAddNewOption();
        this.setValue(newModel, true);
        this.addNewActive = false;
      } else {
        this.addNewItemPlaceHolder();
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
      return Lang.selectFieldEmptyFieldLabel;
    },
    onClickNoneOption: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.eventSource = undefined;
      this.setValue(null, true);
      this._updateSelectedOption(this.getValue());
    },
    setValue: function(value, validate, silent, eventArgs) {
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
          this._updateModel(value, silent, eventArgs);
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
      var $dropdown = this.$(".dctmw-combofield-options-container"), bRet = $dropdown.length === 0 || !$dropdown.is(":visible");
      return bRet;
    },
    _prepareModelData: function(model) {
      let value;
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
      return value;
    },
    _updateModel: function(model, silent, eventArgs) {
      const value = this._prepareModelData(model, silent, eventArgs);
      if (this.model.get("id") !== value.id) {
        this.model.set(value, {
          silent: silent,
          eventArgs: eventArgs
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
    _raiseValueChanged: function(eventArgs) {
      this.oldVal = this.curVal;
      var data = this._getValueChangeEventData();
      this.trigger("field:changed", data);
      var event = $.Event("field:changed");
      _.extend(event, data);
      event.fieldChain = eventArgs?.fieldChain;
      this.$el.trigger(event);
    },
    resetSelection: function(silent) {
      this.model.set({
        id: "",
        name: ""
      }, {
        silent: !!silent
      });
    },
    _beforeSelectionUpdate: function() {
      this.ui.writeField.trigger("focus", {
        forceTrigger: true
      });
    },
    _updateSelectedOption: function(model) {
      this.setValue(model);
      this.ui.comboOptions.find(".dctmw-combo-selected").removeClass("dctmw-combo-selected");
      this.ui.comboOptions.find("li:active").addClass("dctmw-combo-selected");
      this._beforeSelectionUpdate();
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
    setStateWrite: function() {
      return false;
    },
    setDefaultValue: function(args, silent, eventArgs) {
      var defaultValue = this.collection.filter(function(model) {
        return model.get("isDefault") === true;
      });
      if (defaultValue.length === 0 && this.alpacaField.options.ds.async) {
        let model = this.collection.findWhere({
          id: this._initialVal?.get("id")
        });
        model && (defaultValue = [ model ]);
      }
      if (defaultValue.length) {
        this.setValue(defaultValue[0], true, silent, eventArgs);
      } else {
        this.forceUpdate = true;
        this.setValue(null, true, silent);
        this.resetSelection(silent);
      }
    },
    canReloadFieldData: function(args) {
      return args instanceof Backbone.Model ? true : args.control === this.alpacaField.propertyId;
    },
    canResetFieldData: function(args) {
      return args.control === this.alpacaField.propertyId;
    },
    beforeComboReload: _.noop,
    doComboReload: function(args, eventArgs) {
      var me = this;
      if (eventArgs && eventArgs.fieldChain) {
        var exists = _.find(eventArgs.fieldChain, function(field) {
          return field && field.id === me.id;
        });
        if (exists) return;
      }
      if (this.mode === "readonly") {
        return;
      }
      if (!this.canReloadFieldData(args)) {
        return;
      }
      let options;
      if (args instanceof Backbone.Model) {
        options = {
          attrBeforeChange: args
        };
      } else {
        this.eventSource = args.source;
        this.alpacaField.parentValue = args.value;
        options = args;
      }
      this.beforeComboReload(args, options);
      var context = this.alpacaField.connector.config.context;
      var connector = context && context.getObject("connector") || this.alpacaField.connector.config.formView.node.connector;
      this.alpacaField.options.ds.connector = connector;
      args.field = this.alpacaField;
      options.reload = true;
      let existingValue = this.getValue().id;
      this.fetchDataFromSource(options).done(() => {
        this.populateReloadedData(existingValue, args, options, eventArgs);
      });
    },
    populateReloadedData: function(existingValue, args) {
      if (!args.retainCurrentValue) {
        this.alpacaField.data = null;
        this.setDefaultValue(args);
      }
    },
    enableDisableField: function(flag) {
      this.ui.writeField.siblings(".dctmw-icon-caret-down").removeClass("dctmw-icon-disabled");
      this.enable = flag;
      if (!this.enable) {
        this.ui.writeField.siblings(".dctmw-icon-caret-down").addClass("dctmw-icon-disabled");
        this.ui.writeField.attr("placeholder", CsuiLang.noValueSet);
      } else {
        this.ui.writeField.attr("placeholder", this._getPlaceHolder());
      }
    },
    validateOptions: function() {
      return this.errorList.indexOf(this.alpacaField.data) === -1;
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
      this._hideOptionsOnFocusOut(event);
    },
    _hideOptionsOnFocusOut: function(event) {
      var $focused = $(":focus");
      if (!$focused.is(this.ui.comboOptionsContainer.children(".csui-normal-scrolling"))) {
        this.hideOptions(event);
      }
    },
    focusInAction: function() {
      this.ui.writeField.trigger("select");
    },
    isDuplicate: function() {
      return false;
    },
    hideOptionsSelectedByOtherRow: _.noop,
    _setOrRemoveToolTipOnField: function() {
      let comboFieldWrapper = this.$el.find(".cs-field-write-inner");
      if (this.alpacaField?.schema?.disabled) {
        let comboFieldInput = this.$el.find(".dctmw-combofield-search-box-input"), comboFieldValue = comboFieldInput.val(), title = comboFieldValue || CsuiLang.noValue;
        comboFieldWrapper.attr("title", title);
      } else {
        comboFieldWrapper.removeAttr("title");
      }
    }
  }, {
    ComboItemView: itemView
  });
  return DctmwComboFieldView;
});