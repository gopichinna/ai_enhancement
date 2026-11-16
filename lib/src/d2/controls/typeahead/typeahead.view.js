/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/form/pub.sub", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "nuc/utils/base", "d2/controls/typeahead/impl/typeahead.chicklets.view", "d2/controls/typeahead/impl/typeahead.options.view", "hbs!d2/controls/typeahead/impl/typeahead", "css!d2/controls/typeahead/impl/typeahead", "csui/lib/binf/js/binf" ], function(_, $, Backbone, Marionette, PubSub, PerfectScrollingBehavior, base, TypeaheadChickletsView, TypeaheadOptionsView, typeaheadTemplate) {
  "use strict";
  var clipboardData = {};
  return Marionette.LayoutView.extend({
    constructor: function TypeaheadView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "typeahead:remove:item", this.onTypeaheadRemoveItem);
      this.listenTo(this, "typeahead:add:items", this.onTypeaheadAddItems);
      this.listenTo(this, "typeahead:search:field:focus", this.focusSearchTextField);
      if (!this.options.searchMode) {
        this.options.searchMode = "client";
      }
      this.regex = this.options.regex;
      if (!this.options.collection) {
        this.collection = new Backbone.Collection();
      }
      this.optionsCollection = new Backbone.Collection();
    },
    className: "d2-typeahead",
    template: typeaheadTemplate,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-scrollable-options",
        suppressScrollX: true
      }
    },
    ui: {
      chickletsContainer: ".typeahead-chicklets-container",
      optionsContainer: ".typeahead-options-container",
      scrollContainer: ".d2-scrollable-options"
    },
    regions: {
      optionsRegion: ".d2-scrollable-options",
      chickletsRegion: ".typeahead-chicklets-container"
    },
    events: {
      "click @ui.chickletsContainer": "clickOnContainer",
      focusout: "onTypeaheadFocusOut"
    },
    onTypeaheadFocusOut: function(event) {
      var $relatedtarget = $(event.relatedTarget);
      var hasItem = this.$el.has($relatedtarget);
      if (hasItem.length === 0) {
        this.updateOptionSelection();
        this.typeaheadChickletsView.onTypeaheadUnselectItemsAll();
      }
    },
    onRender: function() {
      var optionsContainerId = _.uniqueId("optionsContainer");
      this.ui.optionsContainer.attr("id", optionsContainerId);
      this.$el.attr("aria-expanded", false);
      this.typeaheadChickletsView = new TypeaheadChickletsView({
        typeaheadView: this,
        collection: this.collection,
        regex: this.options.regex,
        placeHolder: this.options.placeholder
      });
      this.chickletsRegion.show(this.typeaheadChickletsView);
      if (this.options.enableChickletSelection) {
        this.typeaheadChickletsView.$el.addClass("chicklet-select-enabled");
      }
      this.typeaheadOptionsView = new TypeaheadOptionsView({
        typeaheadView: this,
        collection: this.optionsCollection,
        optionViewClass: this.options.optionViewClass
      });
      this.optionsRegion.show(this.typeaheadOptionsView);
    },
    showOptions: function() {
      this.ui.optionsContainer.addClass("binf-show");
      this.adjustPosition();
      if (this.options.focusFirstOption) {
        this.focusFirstOption();
      }
      this.options.isDropDownOpen = true;
      this.$el.attr("aria-expanded", true);
      this._behaviors[0]._ensureScrollbar();
      this._behaviors[0]._updateScrollbar();
    },
    hideOptions: function() {
      $(".typeahead-options-container.binf-show").removeClass("binf-show");
      this.$el.attr("aria-expanded", false);
    },
    hideDropdown: function(view) {
      view.hideOptions();
      view.options.isDropDownOpen = false;
    },
    updateOptionSelection: function() {
      if (this.ui.optionsContainer.is(":visible")) {
        this.hideOptions();
        this.options.isDropDownOpen = false;
      }
    },
    adjustPosition: function() {
      var inputEle = this.ui.chickletsContainer;
      this.triggerMethod("update:scrollbar");
      var applyWidth = true;
      if (this.options.customOptionsWidth) {
        applyWidth = false;
      }
      base.adjustDropDownField(inputEle, this.ui.optionsContainer, applyWidth, this, this.hideDropdown, this.ui.scrollContainer);
      this.ui.optionsContainer.addClass("binf-show");
      this.triggerMethod("update:scrollbar");
    },
    updateSearchFilter: function(keyword) {
      var searchText = _.clone(keyword);
      var searchRegex = new RegExp(searchText, "gi");
      if (this.options.fetchDataOn === "keypress") {
        var optionElements = this.typeaheadOptionsView.getOptionsElements();
        optionElements.find(".typeahead-text-container").each(function(index, element) {
          var text = $(element).attr("value");
          if (text.match(searchRegex)) {
            $(this).html(text.replace(searchRegex, function(matchT) {
              return "<b class='d2-highlight-options'>" + matchT + "</b>";
            }));
            return this;
          } else {
            $(this).html(text);
          }
        });
      }
    },
    excludeSelectedOptions: function(optionsForSearch) {
      var selectedOptionIds = _.pluck(this.collection.models, "id");
      return _.select(optionsForSearch, function(option) {
        return !_.contains(selectedOptionIds, option.id);
      });
    },
    onSearch: _.throttle(function(keyword) {
      this._searchHelper(keyword);
    }, 500, {
      leading: false
    }),
    _searchHelper: function(keyword) {
      var self = this;
      if (self._searchInProgress) {
        self._searchInProgress.always(function() {
          self._searchHelper(keyword);
        });
      } else if (self.options.fetchDataOn === "keypress" && self.options.searchDatasource) {
        self.showOptions();
        self._searchInProgress = self.options.searchDatasource(keyword);
        self._searchInProgress.always(function(optionsForSearch) {
          delete self._searchInProgress;
          optionsForSearch = self.excludeSelectedOptions(optionsForSearch);
          var currentSearchText = self.typeaheadChickletsView.getSearchTextField().val();
          if (currentSearchText.length > 0 && optionsForSearch && optionsForSearch.length > 0) {
            self.optionsCollection.reset(optionsForSearch);
            self.showOptions();
            self.updateSearchFilter(keyword);
            if (self.options.focusFirstOption) {
              self.focusFirstOption();
            }
          } else {
            self.optionsCollection.reset();
            self.hideOptions();
          }
          self.trigger("typeahead:search:option:fetched");
          self.searchDfd.resolve();
        });
      }
    },
    clickOnContainer: function() {
      this.typeaheadChickletsView.focusSearchTextField();
    },
    resetSearchTextField: function() {
      this.typeaheadChickletsView.resetSearchTextField();
      if (this.options.fetchDataOn === "keypress") {
        this.optionsCollection.reset();
      }
    },
    validateKeyword: function(keyword, validateRegex) {
      if (!keyword || validateRegex && !this.validateRegex(keyword) || !this.validateKeywordWithExistingItems(keyword)) {
        return false;
      }
      return true;
    },
    validateRegex: function(keyword) {
      return this.regex.test(keyword);
    },
    validateKeywordWithExistingItems: function(keyword) {
      var matchedModel = this.collection.detect(function(model) {
        return keyword === model.get("id");
      });
      return !matchedModel;
    },
    onTypeaheadAddItems: function(items) {
      this.collection.add(items);
      this.clearClipboard();
    },
    lookupOptionModel: function(keyword, matchKeyword) {
      var self = this, dfd = $.Deferred(), matchedModel;
      function getOptionModel() {
        var optionModel;
        if (matchKeyword && !self.options.focusFirstOption) {
          optionModel = self.optionsCollection.detect(function(item) {
            return keyword === item.get("id");
          });
        } else {
          optionModel = self.optionsCollection.at(0);
        }
        return optionModel;
      }
      matchedModel = getOptionModel();
      if (matchedModel) {
        dfd.resolve(matchedModel);
      } else {
        if (this.options.fetchDataOn === "keypress") {
          this.searchDfd.done(function() {
            matchedModel = getOptionModel();
            dfd.resolve(matchedModel);
          });
        }
      }
      return dfd.promise();
    },
    onAddTextItem: function(keyword, matchKeyword) {
      var self = this, id, name;
      self.lookupOptionModel(keyword, matchKeyword).always(function(optionModel) {
        var validateRegex = false;
        if (optionModel) {
          id = optionModel.get("id");
          name = optionModel.get("name");
        } else {
          id = keyword;
          name = keyword;
          validateRegex = true;
        }
        var model = new Backbone.Model({
          name: name,
          id: id
        });
        if (self.validateKeyword(keyword, validateRegex)) {
          self.collection.add(model);
          self.resetSearchTextField();
          self.trigger("typeahead:chicklet:added", model);
          self.focusSearchTextField();
          if (self.options.fetchDataOn === "keypress") {
            self.optionsCollection.reset();
          }
        }
      });
    },
    onAddOptionItemItem: function(optionModel) {
      var model = new Backbone.Model({
        name: optionModel.get("name"),
        id: optionModel.get("id"),
        data: optionModel.get("data")
      });
      this.collection.add(model);
      this.resetSearchTextField();
      this.trigger("typeahead:chicklet:added", model);
      this.focusSearchTextField();
      if (this.options.fetchDataOn === "keypress") {
        this.optionsCollection.reset();
      }
    },
    onTypeaheadRemoveItems: function(models) {
      this.collection.remove(models);
    },
    onTypeaheadRemoveItem: function(model, triggerEvent, removeSelected) {
      this.resetSearchTextField();
      if (removeSelected) {
        var selectedModels = this.getSelectedModels();
        if (selectedModels && selectedModels.length > 0) {
          this.collection.remove(selectedModels);
        } else {
          this.collection.remove(model);
        }
      } else {
        this.collection.remove(model);
      }
      if (triggerEvent) {
        this.trigger("typeahead:chicklet:removed", model);
      }
      this.focusSearchTextField();
      this.clearClipboard();
    },
    onTypeaheadSearchFocus: function(event) {
      var keyword = $(event.target).val();
      if (this.options.fetchDataOn === "keypress" && keyword.length === 0) {
        this.optionsCollection.reset();
      }
      if (this.optionsCollection.length > 0) {
        this.showOptions();
      } else {
        this.hideOptions();
      }
    },
    onTypeaheadSearchBlur: function(event) {
      var keyword = $(event.target).val();
      if (this.validateKeyword(keyword, true)) {
        this.onAddTextItem(keyword, true);
      }
    },
    onTypeaheadPerformSearch: function(event) {
      var keyword = $(event.target).val(), invalidKeys = [ 9, 13, 16, 32, 38, 40, 113, 27, 37, 39, 17, 18 ];
      if (invalidKeys.indexOf(event.keyCode) === -1) {
        if (event.shiftKey !== true && event.ctrlKey !== true) {
          this.searchDfd = $.Deferred();
          this.onSearch(keyword);
        }
      }
    },
    onTypeaheadSearchFieldKeyup: function(event) {
      var keyword = $(event.target).val();
      switch (event.which) {
       case 13:
        this.onAddTextItem(keyword, false);
        break;

       case 27:
        this.resetSearchTextField();
        break;

       case 40:
        this.focusSearchOptions();
        break;

       default:
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    },
    focusSearchTextField: function() {
      this.typeaheadChickletsView.focusSearchTextField();
    },
    focusSearchOptions: function() {
      var optionsItems = this.typeaheadOptionsView.$el.find(".typeahead-option"), optionItem;
      if (optionsItems.length > 0) {
        optionsItems.removeClass("focus");
        if (this.options.focusFirstOption && optionsItems.length > 1) {
          optionItem = optionsItems.eq(1);
        } else {
          optionItem = optionsItems.first();
        }
        if (optionItem) {
          optionItem.trigger("focus");
          optionItem.addClass("focus");
        }
      }
    },
    onOptionSelect: function(optionModel) {
      if (this.options.fetchDataOn === "keypress") {
        this.optionsCollection.reset();
      }
      this.onAddOptionItemItem(optionModel);
    },
    onCutChicklets: function(event, model) {
      this.clearClipboard();
      var $targetEl = $(event.target);
      var selectedModels = this.getSelectedModels();
      if (selectedModels.length > 0) {
        var selectedElements = this.$el.find(".typeahead-chicklet-item[chicklet-selected=true]");
        selectedElements.addClass("chicklet-cut");
        clipboardData.copiedModels = selectedModels;
      }
      clipboardData.copiedFrom = this;
      if ($targetEl.hasClass("typeahead-search-text-field")) {
        if (selectedModels.length === 0) {
          delete clipboardData.copiedModels;
          delete clipboardData.copiedFrom;
        }
      } else if (model) {
        if (selectedModels.length === 0) {
          var chickletView = this.typeaheadChickletsView.children.findByModel(model);
          chickletView.$el.addClass("chicklet-cut");
          clipboardData.copiedModels = [ model ];
        }
      }
      this.trigger("typeahead:chicklet:cut", model);
      this.resetSearchTextField();
      this.focusSearchTextField();
    },
    onPasteChicklets: function() {
      if (clipboardData.copiedFrom && this.cid !== clipboardData.copiedFrom.cid && clipboardData.copiedModels && clipboardData.copiedModels.length > 0) {
        clipboardData.copiedFrom.onTypeaheadRemoveItems(clipboardData.copiedModels);
        this.onTypeaheadAddItems(clipboardData.copiedModels);
        this.trigger("typeahead:chicklet:paste", clipboardData.copiedModels);
        this.resetSearchTextField();
        this.focusSearchTextField();
      }
      this.clearClipboard();
    },
    clearClipboard: function() {
      $(".typeahead-chicklet-item.chicklet-cut").removeClass("chicklet-cut");
      delete clipboardData.copiedModels;
      delete clipboardData.copiedFrom;
    },
    findValueByIds: function(ids) {
      return this.collection.select(function(item) {
        return _.contains(ids, item.cid);
      });
    },
    getSelectedModelCids: function() {
      var d2DataKeys = [];
      var selectedElements = this.$el.find(".typeahead-chicklet-item[chicklet-selected=true]");
      selectedElements.each(function(index, element) {
        var $element = $(element);
        var d2DataKey = $element.attr("data-d2-key");
        d2DataKeys.push(d2DataKey);
      });
      return d2DataKeys;
    },
    getSelectedModels: function() {
      var selectedModelCids = this.getSelectedModelCids();
      return this.findValueByIds(selectedModelCids);
    },
    getChickletViewByModel: function(model) {
      return this.typeaheadChickletsView.children.findByModel(model);
    },
    getClipboardData: function() {
      return clipboardData;
    },
    isReorderDisabled: function() {
      return this.options.disableReorder;
    },
    showToolTipIdName: function() {
      return this.options.toolTipIdName;
    },
    focusFirstOption: function() {
      this.typeaheadOptionsView.$el.find(".typeahead-option").removeClass("focus");
      this.typeaheadOptionsView.$el.find(".typeahead-option").first().addClass("focus");
    }
  });
});