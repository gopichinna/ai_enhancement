/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "module", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/facet.panel/impl/facet/facet.key.navigation", "smart/controls/facet.panel/impl/facet/facet.view", "smart/mixins/view.events.propagation/view.events.propagation.mixin", "smart/controls/globalmessage/globalmessage", "smart/controls/progressblocker/blocker", "hbs!smart/controls/facet.panel/impl/facet/facet.card", "i18n!smart/controls/facet.panel/impl/nls/lang", "smart/themes/theming", "smart/utils/smart.base", "smart/themes/jato.icons/smart.jato.action.icons", "css!smart/controls/facet.panel/impl/facet/facet", "smart/themes/carbonfiber/ot-icons/icons_smart_action_16" ], function(_, module, $, Backbone, Marionette, KeyEventNavigation, FacetListView, ViewEventsPropagationMixin, GlobalMessage, BlockingView, template, lang, theming, base, jatoIcons) {
  var config = module.config();
  _.defaults(config, {
    displayCount: "Always"
  });
  var FacetCardView = Marionette.LayoutView.extend({
    childView: FacetListView,
    template: template,
    className: "csui-facet",
    regions: {
      cardBody: ".csui-facet-content",
      listBody: ".cs-filter-group-list"
    },
    childViewContainer: ".cs-filter-group-list",
    ui: {
      facetContent: ".csui-facet-content",
      facetHeader: ".csui-facet-header",
      facetFooter: ".csui-facet-footer",
      facetHeaderIcon: ".csui-facet-header > .cs-icon",
      facetHeaderSmartIcon: ".csui-facet-header .cs-icon > .smart-icon.smart-caret-up",
      facetHeaderSmartDownIcon: ".csui-facet-header .cs-icon > .smart-icon.smart-caret-down",
      facetSubmitControls: ".csui-facet-controls",
      facetCollapseControls: ".csui-facet-collapse-controls",
      facetMoreText: ".smart-show-more-text",
      facetMoreButton: ".csui-filter-more",
      facetMoreIcon: ".csui-filter-more .smart-caret-down",
      facetMore: ".smart-show-more",
      showMoreIconButton: ".csui-filter-more .smart-show-more",
      apply: ".csui-facet-controls .csui-apply",
      cancel: ".csui-facet-controls .csui-clear",
      selectCount: ".header-count",
      searchInput: ".smart-facet-search",
      searchEmptylist: ".smart-filter-search-empty-list",
      smartSearchResultCountAriaPolite: ".smart-search-result-count-aria-polite"
    },
    childEvents: {
      "single:filter:select": "onSingleFilterSelect",
      "set:single:select": "onSetSingleSelect",
      "set:single:unselect": "onSetSingleUnSelect",
      "multi:filter:select": "onMultiFilterSelect",
      "multi:filter:unselect": "onMultiFilterUnselect",
      "select:facet:name": "onSelectFacetName",
      keyupdown: "cursorNextFilter",
      keyleftright: "cursorInsideFilter"
    },
    events: {
      "click .csui-filter-more:not(.binf-disabled)": "onShowMore",
      "click .csui-facet-header": "onShowFacet",
      "click .smart-expand-collapse": "onShowFacet",
      "input .smart-facet-search": "onFilterSearchInput",
      "keydown .smart-facet-search": "onKeyDownSearchInput",
      "search .smart-facet-search": "onFilterFacets",
      mouseleave: "onMouseLeave",
      keydown: "onKeyInView"
    },
    triggers: {
      "click .csui-clear": "clear:all",
      "click .csui-apply": "apply:all"
    },
    templateHelpers: function() {
      this.showAll = !!this.itemsToShowWhenChecked;
      var moreLabel = this.showAll ? lang.showLess : lang.showMore, moreFiltersAria = this.showAll ? lang.showLessAria : lang.showMoreAria;
      return {
        isJATO: theming.isJATOTheme(),
        more: this.haveMore ? moreLabel : undefined,
        enableSearch: this.enableSearch,
        search: this.isSearch,
        moreFiltersAria: moreFiltersAria,
        "more-icon": this.showAll ? "csui_smart_action_caret_up32" : "csui_smart_action_caret_down32",
        apply: lang.apply,
        applyFiltersAria: lang.applyFiltersAria,
        clear: lang.clear,
        clearFiltersAria: lang.clearFiltersAria,
        facetCollapseIcon: jatoIcons.actionChevronSmallUp,
        facetExpandIcon: jatoIcons.actionChevronSmallDown,
        "show-controls": this.selectItems.length > 0 ? "csui-multi-select" : "",
        "show-content-and-footer": this.showFacet ? "" : "binf-hidden",
        hideFacetAria: _.str.sformat(lang.hideFacetAria, this.model.get("name")),
        showFacetAria: _.str.sformat(lang.showFacetAria, this.model.get("name")),
        ariaLabelClearKeywords: lang.ariaLabelClearKeywords,
        ariaLabelSearchButtonOpen: lang.ariaLabelSearchButtonOpen,
        ariaLabelStartSearch: lang.ariaLabelStartSearch,
        ariaLabelSearchBox: lang.ariaLabelSearchBox,
        ariaLabelInputDescription: lang.ariaLabelInputDescription,
        ariaLabelInputField: lang.ariaLabelInputField,
        labelText: lang.labelText,
        searchPlaceholder: lang.searchPlaceholder,
        toolTipClearKeywords: lang.toolTipClearKeywords,
        toolTipSearchButtonOpen: lang.toolTipSearchButtonOpen,
        toolTipStartSearch: lang.toolTipStartSearch
      };
    },
    childViewOptions: function() {
      return {
        enableCheckBoxes: this.model.get("select_multiple") !== undefined ? this.model.get("select_multiple") : true,
        displayCountProps: this.options.facetOptions.displayCountProps,
        maxCount: this.options.facetOptions.maxCount,
        context: this.options.context
      };
    },
    defaultEnableSearh: function({
      view
    }) {
      let totalDisplayable = view.model.has("total_displayable") ? view.model.get("total_displayable") : view.model.get("topics").length;
      return totalDisplayable >= 10 ?? false;
    },
    _canEnableSearch: function() {
      let enableSearchFunction = _.isFunction(this.options?.facetOptions?.getEnableSearch) ? this.options?.facetOptions?.getEnableSearch : this.defaultEnableSearh;
      return enableSearchFunction({
        view: this
      }) ? true : false;
    },
    constructor: function FacetCardView(options = {}) {
      this.showFacet = options?.parentView?.expandAll ?? false;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.$el.attr("tabindex", 0);
      this.options = options || {};
      this.collection = options?.facetOptions?.facetTopicCollection || this.model.topics;
      this.checkedItems = new Backbone.Collection();
      this.checkedItems.reset([]);
      this.listenTo(this.checkedItems, "update reset", this.__updateCheckedItem);
      this.itemsToShow = options?.facetOptions?.itemsToShow || this.model.get("items_to_show");
      this.showButtonsInEachFacet = options?.facetOptions?.showButtonsInEachFacet || options?.facetOptions?.showButtonsInEachFacet === undefined;
      this.enableSearch = this._canEnableSearch();
      this.maxFacetSelection = options?.facetOptions?.maxFacetSelection || 5;
      this.displayCountProps = options?.facetOptions?.displayCountProps;
      this.maxCount = options?.facetOptions?.itemsToShow;
      this.showAll = false;
      this._fillCollection();
      var totalDisplayable = this.model.has("total_displayable") ? this.model.get("total_displayable") : this.model.get("topics").length;
      this.haveMore = totalDisplayable > this.itemsToShow;
      this.selectItems = [];
      this.listenTo(this, "add:child", this.propagateEventsToViews);
      this.listenTo(this.collection, "more:facets:fecthed", this.onMoreFacetsFetched);
      this.listenTo(this.collection, "more:facets:fetch:failed", this.onMoreFacetsFetchFailed);
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      }
      this.listenTo(this.options.parentView, "toggle:expand:all", this._toggleExpandBtn);
      this.checkedItemGreaterThanMaxCount();
    },
    checkedItemGreaterThanMaxCount: function() {
      let topics = this.model?.get("topics");
      topics?.forEach((model, index) => {
        if (model?.checked && index + 1 > this.itemsToShow) {
          this.itemsToShowWhenChecked = topics?.length;
        }
      });
    },
    _toggleExpandBtn: function(event) {
      this.showFacet = this.options?.parentView?.expandAll;
      this._toggleFacet();
    },
    onMoreFacetsFetched: function() {
      var self = this;
      !this.fetchMoreOnSearch && this.facetListView?.render();
      this.fetchMoreOnSearch && this.searchFacets() && (this.fetchMoreOnSearch = false);
      if (this.showButtonsInEachFacet !== undefined && !this.showButtonsInEachFacet) {
        this.getSingleSelectModels();
        this.maintainCheckboxState();
      } else {
        self.selectItems = this.checkedItems;
        let numCheckedItems = self._countCheckedItems();
        self._setDisabledFilters(numCheckedItems);
      }
      self._setMoreLabel(self.showAll);
    },
    onMoreFacetsFetchFailed: function(error) {
      GlobalMessage.showMessage("error", error.message);
      this.showAll = !this.showAll;
    },
    onKeyDownSearchInput: function(event) {
      if (event.keyCode === 32) {
        event.stopPropagation();
      }
    },
    onFilterSearchInput: _.debounce(function(event) {
      if (this.__getFiterTextValue().length >= 2) {
        this.onFilterFacets();
      } else if (this.ui.searchInput[0].value.length < 2 && this.search) {
        this.onResetFacetsAfterSearch();
      }
    }, 300),
    __getFiterTextValue: function() {
      return this.ui.searchInput[0]?.value ?? "";
    },
    onFilterFacets: function() {
      let value = this.__getFiterTextValue();
      if (value.length >= 2) {
        let self = this;
        this.search = true;
        this.ui.facetMoreButton.addClass("binf-hidden");
        this.facetListView.maxCount = undefined;
        this.showAll = false;
        if (this.ensureFetched) {
          this.searchFacets();
        } else {
          this.fetchMoreOnSearch = true;
          this.onShowMore();
        }
      } else {
        this.onResetFacetsAfterSearch(true);
      }
    },
    escapeRegex: function(query) {
      return query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    },
    searchFacets: function() {
      let self = this;
      if (!this.oldCollection) {
        this.oldCollection = base.deepCloneBackboneCollection(this.collection.clone());
      }
      const query = this.__getFiterTextValue();
      let tempOldCollection = base.deepCloneBackboneCollection(this.oldCollection.clone());
      if (this.model.attributes.searchQuery !== query) {
        let filteredCollection = tempOldCollection?.filter(function(model) {
          const safeQuery = self.escapeRegex(query);
          const regex = new RegExp(safeQuery, "gi");
          let name = model.get("name");
          if (name.match(regex)?.length > 0) {
            model.attributes["query"] = query;
            return model;
          }
        });
        this.model.attributes.searchQuery = query;
        if (filteredCollection.length > this.model.get("items_to_show")) {
          this.ui.facetMoreButton.removeClass("binf-hidden");
          this.showAll = true;
          this._setMoreLabel(this.showAll);
        }
        let resText = _.str.sformat(lang.searchResultsDummyTextAria, filteredCollection.length, this.__getFiterTextValue());
        resText = filteredCollection.length > 0 ? resText : lang.searchNoresults;
        this.ui.smartSearchResultCountAriaPolite.text(resText);
        this.collection.reset(filteredCollection);
      }
    },
    onResetFacetsAfterSearch: function() {
      if (this.search) {
        this.search = false;
        this.fetchMoreOnSearch = false;
        if (this.facetListView?.maxCount) {
          this.showAll = false;
        } else {
          this.showAll = true;
        }
        this.ui.smartSearchResultCountAriaPolite.text("");
        this.collection.reset(this.oldCollection.models);
        this.model.attributes.searchQuery = undefined;
        this.ui.facetMoreButton.removeClass("binf-hidden");
        if (!this.ensureFetched) {
          this.onMoreFacetsFetched();
        }
        this.selectItems = this.checkedItems;
        let numCheckedItems = this._countCheckedItems();
        if (this.showButtonsInEachFacet) {
          this._setDisabledFilters(numCheckedItems);
        }
        this._setMoreLabel(this.showAll);
      }
    },
    _updateHeaderIcon: function() {
      this.ui.facetHeaderIcon.removeClass("smart-icon-expanded smart-icon-collapsed");
      if (this.showFacet) {
        this.ui.facetHeaderIcon.addClass("smart-icon-expanded");
        this._showCaretUpIcon(this.ui.facetHeaderIcon);
      } else {
        this.ui.facetHeaderIcon.addClass("smart-icon-collapsed");
        this._showCaretDownIcon(this.ui.facetHeaderIcon);
      }
    },
    onClearAll: function() {
      var checkboxes = this.$el.find(".csui-checkbox[ariachecked='true']");
      checkboxes.trigger("click");
      this.checkedItems.reset([]);
      this._setDisabledFilters(0);
      this.$el.removeClass("multi-select");
      this.selectItems = [];
      this._updateFacetSubmitControls();
      this.ui.facetHeader.removeClass("binf-disabled");
      this.trigger("activate:facet", this);
    },
    onApplyAll: function() {
      if (this.showButtonsInEachFacet) {
        var facet = this.model, filters = this._getFilterArray();
        this.newFilter = {
          id: facet.get("id"),
          values: filters
        };
        this.trigger("apply:filter");
      } else {
        this.newFilter = this.formatFilterArray(this.options.parentView.topicsToBeAdded);
        this.options.parentView.topicsToBeAdded = [];
        this.trigger("apply:filter");
      }
    },
    onRender: function() {
      this.facetListView = !this.facetListView && new FacetListView({
        collection: this.collection,
        blockingParentView: this.options.blockingParentView,
        context: this.options.context,
        model: this.model,
        showButtonsInEachFacet: this.showButtonsInEachFacet,
        displayCountProps: this.displayCountProps,
        maxCount: this.itemsToShowWhenChecked || this.itemsToShow,
        facetCardView: this
      });
      this.haveMore = !!!this.itemsToShowWhenChecked;
      this.listBody.show(this.facetListView);
      if (this.collection.length === 0) {
        this.$el.hide();
      }
      this.$el.attr("role", "dialog");
      this.$el.attr("aria-label", _.str.sformat(lang.facetTitleAria, this.model.get("name")));
      this._updateHeaderIcon();
      this._updateShowMoreIcon(!this.haveMore);
      if (this.showButtonsInEachFacet !== undefined && !this.showButtonsInEachFacet) {
        this.getSingleSelectModels();
        this.maintainCheckboxState();
      }
    },
    initialize: function() {
      this.options.parentView.applyFilterTimer = null;
      this.options.parentView.topicsToBeAdded = [];
      this.options.parentView.topicsToBeRemoved = [];
    },
    getSingleSelectModels: function() {
      var items = this.$el.find(".csui-facet-item");
      _.each(this.facetListView.collection.models, function(model) {
        if (model.get("multiselect") !== undefined && !model.get("multiselect")) {
          items.each(function(index, element) {
            $(element).addClass("single-select-facet-item");
            $(element).closest(".csui-facet").addClass("single-select-card");
          });
        }
      });
    },
    __updateCheckedItem: function() {
      const hasCheckedItems = this.checkedItems.length;
      if (hasCheckedItems && this.showButtonsInEachFacet) {
        this.ui.selectCount.removeClass("binf-hidden");
        this.ui.selectCount.text(hasCheckedItems);
      } else {
        this.ui.selectCount.addClass("binf-hidden");
        this.ui.selectCount.text("");
      }
    },
    __isItemChecked: function(model) {
      let isChecked = false;
      this.checkedItems.forEach(function(item) {
        item.get("value") === model.get("value") && (isChecked = true);
      });
      return isChecked;
    },
    maintainCheckboxState: function() {
      var items = this.$el.find(".csui-facet-item");
      let self = this;
      _.each(this.collection.models, function(model) {
        if (model.get("checked")) {
          if (!model.get("multiselect")) {
            items.each(function(index, element) {
              $(element).closest(".csui-facet").addClass("single-select");
              var checkbox = $(this).find(".csui-checkbox");
              checkbox.addClass("single-select-facet csui-showAlways");
              checkbox.attr("altstyle", "");
            });
          } else {
            items.each(function(index, element) {
              $(element).closest(".csui-facet").addClass("multi-select");
              var checkbox = $(this).find(".csui-checkbox");
              checkbox.addClass("csui-showAlways");
            });
          }
        }
      });
    },
    onSetSingleSelect: function(filter) {
      var items = this.$el.find(".csui-facet-item");
      var filterIndex = filter._index;
      items.each(function(index) {
        var checkbox = $(this).find(".csui-checkbox");
        if (index !== filterIndex) {} else {
          checkbox.addClass("csui-showAlways");
        }
      });
    },
    onSetSingleUnSelect: function(filter) {
      var items = this.$el.find(".csui-facet-item");
      items.each(function() {
        var checkbox = $(this).find(".csui-checkbox");
        checkbox.css("visibility", "visible");
        checkbox.removeClass("csui-showAlways");
      });
    },
    onSelectFacetName: function(filter) {
      if (!filter.$el.hasClass("binf-disabled")) {
        !this.showButtonsInEachFacet && filter.$el.find(".csui-checkbox").trigger("click");
        if (this.showButtonsInEachFacet) {
          this.onSingleFilterSelect(filter);
        }
      }
    },
    onSingleFilterSelect: function(filter) {
      var facet = this.model;
      this.newFilter = {
        id: facet.get("id"),
        values: [ {
          id: filter.model.get("value")
        } ]
      };
      this._showHideBlueIndicatorOnFacet();
      this.trigger("apply:filter", this.newFilter);
      this._updateArialabel();
    },
    onShowMore: function(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.showAll = !this.showAll;
      var self = this;
      this._fillCollection().done(function() {
        self.ensureFetched = true;
        self.trigger("facet:size:change");
      }).fail(function() {
        self.showAll = !self.showAll;
      });
    },
    onShowFacet: function(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.showFacet = !this.showFacet;
      this._toggleFacet();
    },
    _toggleFacet: function() {
      if (this.showFacet) {
        this.$el.removeClass("csui-facet-collapsed");
        this.ui.facetContent.removeClass("binf-hidden");
        this.ui.facetCollapseControls.removeClass("multi-select");
        this.ui.facetFooter.removeClass("binf-hidden");
      } else {
        this.$el.addClass("csui-facet-collapsed");
        var numCheckedItems = this._countCheckedItems();
        this.ui.facetContent.addClass("binf-hidden");
        this.ui.facetFooter.addClass("binf-hidden");
        if (numCheckedItems) {
          this.ui.facetCollapseControls.addClass("multi-select");
        }
      }
      this._updateHeaderIcon();
      this.trigger("facet:size:change");
    },
    onMouseLeave: function(event) {
      event.preventDefault();
      event.stopPropagation();
    },
    getIndex: function() {
      return this._index;
    },
    _countCheckedItems: function() {
      return this.checkedItems.length;
    },
    _showHideBlueIndicatorOnFacet: function() {
      if (this._countCheckedItems() === 0) {
        this.el.querySelector(".smart-indicator-dot")?.classList?.add("binf-hidden");
      } else {
        this.el.querySelector(".smart-indicator-dot")?.classList.remove("binf-hidden");
      }
    },
    onMultiFilterSelect: function(childView) {
      let isJATO = theming.isJATOTheme();
      if (this.showButtonsInEachFacet) {
        this.ui.selectCount.removeClass("binf-hidden");
        var numCheckedItems = this._countCheckedItems();
        this._updateSelectList(childView);
        this._updateFacetSubmitControls(numCheckedItems);
        this._setDisabledFilters(numCheckedItems);
        this.selectItems = numCheckedItems === 0 ? [] : this.selectItems;
        this._updateArialabel();
        isJATO && this._showHideBlueIndicatorOnFacet();
        this.trigger("activate:facet", this);
      } else {
        this.ui.selectCount.addClass("binf-hidden");
        this.$el.addClass("multi-select");
        var checkbox = this.$el.find(".csui-checkbox");
        checkbox.each(function(index, element) {
          checkbox.addClass("csui-showAlways");
        });
        this._showHideBlueIndicatorOnFacet();
        const facetId = this.model.get("id");
        const valueId = childView.model.get("value");
        const topicsToBeRemoved = this.options.parentView.topicsToBeRemoved;
        const facetExistsInRemovedList = topicsToBeRemoved.some(item => item.facetId === facetId && item.id === valueId);
        if (topicsToBeRemoved.length > 0 && facetExistsInRemovedList) {
          this.options.parentView.topicsToBeRemoved = topicsToBeRemoved.filter(item => !(item.facetId === facetId && item.id === valueId));
        } else {
          this.options.parentView.topicsToBeAdded.push({
            facetId: facetId,
            id: valueId
          });
        }
        this._triggerAddRemoveMultipleFilterAtOnce();
      }
    },
    onMultiFilterUnselect: function(childView) {
      this.$el.removeClass("multi-select");
      const facetId = this.model.get("id");
      const valueId = childView.model.get("value");
      const topicsToBeAdded = this.options.parentView.topicsToBeAdded;
      const facetExistsInAddedList = topicsToBeAdded.some(item => item.facetId === facetId && item.id === valueId);
      if (topicsToBeAdded.length > 0 && facetExistsInAddedList) {
        this.options.parentView.topicsToBeAdded = topicsToBeAdded.filter(item => !(item.facetId === facetId && item.id === valueId));
      } else {
        this.options.parentView.topicsToBeRemoved.push({
          facetId: facetId,
          id: valueId
        });
      }
      this._triggerAddRemoveMultipleFilterAtOnce();
      this._showHideBlueIndicatorOnFacet();
      this._updateArialabel();
    },
    _triggerAddRemoveMultipleFilterAtOnce: function() {
      if (this.options.parentView.applyFilterTimer) {
        clearTimeout(this.options.parentView.applyFilterTimer);
        this.options.parentView.applyFilterTimer = null;
      }
      this.options.parentView.applyFilterTimer = setTimeout(() => {
        this.options.parentView.$el.addClass("smart-non-clickable-facet");
        if (this.options.parentView.topicsToBeAdded.length > 0 && this.options.parentView.topicsToBeRemoved.length > 0) {
          this.onAddRemoveAll();
        } else if (this.options.parentView.topicsToBeAdded.length > 0) {
          this.onApplyAll();
        } else if (this.options.parentView.topicsToBeRemoved.length > 0) {
          this._removeFilters();
        } else {
          this.options.parentView.$el.removeClass("smart-non-clickable-facet");
        }
        this.options.parentView.applyFilterTimer = null;
      }, 2e3);
    },
    _removeFilters: function() {
      this.newFilter = this.formatFilterArray(this.options.parentView.topicsToBeRemoved);
      this.trigger("remove:filter", this.newFilter);
    },
    onAddRemoveAll: function() {
      const existingTopics = this.options.parentView.facets.filters;
      const topicsToBeRemoved = this.formatFilterArray(this.options.parentView.topicsToBeRemoved);
      const topicsToBeAdded = this.formatFilterArray(this.options.parentView.topicsToBeAdded);
      this.newFilter = this.removeMatchingFacets(existingTopics, topicsToBeRemoved, topicsToBeAdded);
      this.options.parentView.topicsToBeAdded = [];
      this.options.parentView.topicsToBeRemoved = [];
      this.trigger("apply:addRemoveAll");
    },
    removeMatchingFacets: function(existingTopics, topicsToBeRemoved, topicsToBeAdded) {
      const filteredFacets = existingTopics.map(facet => {
        const toRemove = topicsToBeRemoved.find(item => item.id === facet.id);
        if (!toRemove) {
          return facet;
        }
        const filteredValues = facet.values.filter(val => !toRemove.values.some(rem => rem.id === val.id));
        return {
          ...facet,
          values: filteredValues
        };
      }).filter(facet => facet.values.length > 0);
      topicsToBeAdded.forEach(toAdd => {
        const existingFacet = filteredFacets.find(f => f.id === toAdd.id);
        if (existingFacet) {
          const existingValueIds = new Set(existingFacet.values.map(v => v.id));
          toAdd.values.forEach(newVal => {
            if (!existingValueIds.has(newVal.id)) {
              existingFacet.values.push(newVal);
            }
          });
        } else {
          filteredFacets.push(toAdd);
        }
      });
      return filteredFacets;
    },
    formatFilterArray: function(preFromattedFilterArray) {
      let grouped = {};
      preFromattedFilterArray.forEach(item => {
        if (!grouped[item.facetId]) {
          grouped[item.facetId] = [];
        }
        grouped[item.facetId].push({
          id: item.id
        });
      });
      this.finalFilterObject = Object.entries(grouped).map(([ facetId, values ]) => ({
        id: facetId,
        values: values
      }));
      return this.finalFilterObject;
    },
    _updateArialabel: function() {
      var numCheckedItems = this._countCheckedItems();
      if (numCheckedItems != 0) {
        this.el.setAttribute("aria-label", _.str.sformat(lang.facetTitleAriaCount, this.model.get("name"), numCheckedItems));
      } else {
        this.el.setAttribute("aria-label", _.str.sformat(lang.facetTitleAria, this.model.get("name")));
      }
    },
    _updateFacetSubmitControls: function() {
      var numCheckedItems = this._countCheckedItems();
      if (numCheckedItems > 0) {
        this.ui.facetSubmitControls.addClass("csui-multi-select");
        this.$el.addClass("multi-select");
        this.ui.facetHeader.addClass("binf-disabled");
      } else {
        this.ui.facetSubmitControls.removeClass("csui-multi-select");
        this.$el.removeClass("multi-select");
        this.ui.facetHeader.removeClass("binf-disabled");
      }
    },
    _updateSelectList: function(childView) {
      var childIndex = childView.getIndex();
      if (this.selectItems[childIndex]) {
        delete this.selectItems[childIndex];
      } else {
        this.selectItems[childIndex] = childView;
      }
    },
    _setDisabledFilters: function(numCheckedItems) {
      let self = this;
      var unselectedItems = this.facetListView.children.filter(function(child) {
        if (child.model) {
          let checked = self.__isItemChecked(child.model);
          return checked === false || checked === undefined;
        } else {
          return true;
        }
      });
      _.each(unselectedItems, _.bind(function(facetItemView) {
        facetItemView.model.set("disabled", numCheckedItems >= this.maxFacetSelection);
        facetItemView.model.trigger("change:disabled", facetItemView.model);
      }, this));
      this.ui.selectCount.text(numCheckedItems);
    },
    _updateShowMoreIcon: function(showAll) {
      if (showAll) {
        this._showCaretUpIcon(this.ui.showMoreIconButton);
      } else {
        this._showCaretDownIcon(this.ui.showMoreIconButton);
      }
    },
    _showCaretUpIcon: function(parentEl) {
      parentEl?.find(".smart-caret-up").removeClass("binf-hidden");
      parentEl?.find(".smart-caret-down").addClass("binf-hidden");
      parentEl?.find(".smart-count-blue-dot").addClass("binf-hidden");
    },
    _showCaretDownIcon: function(parentEl) {
      parentEl?.find(".smart-caret-up").addClass("binf-hidden");
      parentEl?.find(".smart-caret-down").removeClass("binf-hidden");
      parentEl?.find(".smart-count-blue-dot").removeClass("binf-hidden");
    },
    _setMoreLabel: function(showAll) {
      let isJATO = theming.isJATOTheme();
      if (this.ui.facetMoreIcon[0] || isJATO) {
        if (showAll) {
          this.ui.facetMoreText.text(lang.showLess);
          this.ui.facetMore[0]?.setAttribute("arialabel", lang.showLessAria);
          this.ui.facetMore[0].setAttribute("title", lang.showLessAria);
        } else {
          this.ui.facetMoreText.text(lang.showMore);
          this.ui.facetMore[0]?.setAttribute("arialabel", lang.showMoreAria);
          this.ui.facetMore[0].setAttribute("title", lang.showMoreAria);
        }
        this._updateShowMoreIcon(showAll);
      }
      this.trigger("facet:size:change");
    },
    _getFilterArray: function() {
      var filters = [], self = this;
      if (this.showButtonsInEachFacet !== undefined && !this.showButtonsInEachFacet) {
        _.each(this.collection?.models, function(item) {
          if (self.__isItemChecked(item)) {
            filters.push({
              id: item.attributes?.value
            });
          }
        });
      } else {
        _.each(this.collection?.models, function(item) {
          if (self.__isItemChecked(item)) {
            filters.push({
              id: item.attributes?.value
            });
          }
        });
      }
      return filters;
    },
    _fillCollection: function() {
      var self = this, deferred = $.Deferred();
      if (this.showAll) {
        this.facetListView.maxCount = undefined;
        if (this.model?.get("total_displayable") > this.collection?.length && !this.model?.attributes?.searchQuery) {
          this.trigger("fetch:more:facets");
          this._setMoreLabel(this.showAll);
        } else {
          this.facetListView?.render();
          this.facetListView && this.onMoreFacetsFetched();
        }
      } else {
        var topics = this.model.topics;
        if (this.facetListView) {
          this.facetListView.maxCount = this.itemsToShow;
        }
        this.facetListView?.render();
        this.facetListView && this.onMoreFacetsFetched();
      }
      return deferred.resolve().promise();
    }
  });
  _.extend(FacetCardView.prototype, KeyEventNavigation);
  _.extend(FacetCardView.prototype, ViewEventsPropagationMixin);
  return FacetCardView;
});