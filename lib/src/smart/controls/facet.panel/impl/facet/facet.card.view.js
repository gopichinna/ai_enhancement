/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "module", "nuc/lib/jquery", "nuc/lib/marionette", "smart/controls/facet.panel/impl/facet/facet.key.navigation", "smart/controls/facet.panel/impl/facet/facet.view", "smart/mixins/view.events.propagation/view.events.propagation.mixin", "smart/controls/globalmessage/globalmessage", "smart/controls/progressblocker/blocker", "hbs!smart/controls/facet.panel/impl/facet/facet.card", "i18n!smart/controls/facet.panel/impl/nls/lang", "css!smart/controls/facet.panel/impl/facet/facet" ], function(_, module, $, Marionette, KeyEventNavigation, FacetListView, ViewEventsPropagationMixin, GlobalMessage, BlockingView, template, lang) {
  var config = module.config();
  _.defaults(config, {
    displayCount: "Always"
  });
  var FacetCardView = Marionette.LayoutView.extend({
    childView: FacetListView,
    template: template,
    className: "csui-facet",
    regions: {
      cardBody: ".csui-facet-content"
    },
    childViewContainer: ".cs-filter-group",
    ui: {
      facetContent: ".csui-facet-content",
      facetHeader: ".csui-facet-header",
      facetFooter: ".csui-facet-footer",
      facetHeaderIcon: ".csui-facet-header > .cs-icon",
      facetSubmitControls: ".csui-facet-controls",
      facetCollapseControls: ".csui-facet-collapse-controls",
      facetMoreText: ".csui-more-text",
      facetMoreIcon: ".csui-filter-more .cs-icon",
      facetMore: ".csui-filter-more",
      showMoreIconButton: ".csui-filter-more .smart-show-more",
      apply: ".csui-facet-controls .csui-apply",
      cancel: ".csui-facet-controls .csui-clear",
      selectCount: ".header-count"
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
      mouseleave: "onMouseLeave",
      keydown: "onKeyInView"
    },
    triggers: {
      "click .csui-clear": "clear:all",
      "click .csui-apply": "apply:all"
    },
    templateHelpers: function() {
      var moreLabel = this.showAll ? lang.showLess : lang.showMore, moreFiltersAria = this.showAll ? lang.showLessAria : lang.showMoreAria;
      return {
        more: this.haveMore ? moreLabel : undefined,
        moreFiltersAria: moreFiltersAria,
        "more-icon": this.showAll ? "csui_smart_action_caret_up32" : "csui_smart_action_caret_down32",
        apply: lang.apply,
        applyFiltersAria: lang.applyFiltersAria,
        clear: lang.clear,
        clearFiltersAria: lang.clearFiltersAria,
        "show-controls": this.selectItems.length > 0 ? "csui-multi-select" : "",
        "show-content-and-footer": this.showFacet ? "" : "binf-hidden",
        showFacetAria: this.showFacet ? _.str.sformat(lang.hideFacetAria, this.model.get("name")) : _.str.sformat(lang.showFacetAria, this.model.get("name"))
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
    constructor: function FacetCardView(options = {}) {
      this.showFacet = options?.parentView?.expandAll ?? false;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.$el.attr("tabindex", 0);
      this.options = options || {};
      this.collection = options?.facetOptions?.facetTopicCollection || this.model.topics;
      this.mainCollection = {
        ...this.collection
      };
      this.itemsToShow = options?.facetOptions?.itemsToShow || this.model.get("items_to_show");
      this.showButtonsInEachFacet = options?.facetOptions?.showButtonsInEachFacet || options?.facetOptions?.showButtonsInEachFacet === undefined;
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
    },
    _toggleExpandBtn: function(event) {
      this.showFacet = this.options?.parentView?.expandAll;
      this._toggleFacet();
    },
    onMoreFacetsFetched: function() {
      var self = this;
      let checkedFilters = self.mainCollection?.models.map(function(selectedItem) {
        return selectedItem?.get("facetItemchecked") === true;
      });
      self.mainCollection = {
        ...self.collection
      };
      if (this.showButtonsInEachFacet !== undefined && !this.showButtonsInEachFacet) {
        this.getSingleSelectModels();
        this.maintainCheckboxState();
      } else {
        var newSelectItems = [];
        self.facetListView.children.each(function(child, childIndex) {
          var checkbox = child.$el.find(".csui-checkbox");
          if (checkedFilters[childIndex]) {
            checkbox.attr("checked", true);
            checkbox.attr("aria-checked", true);
            child.model.set("facetItemchecked", true);
            newSelectItems[childIndex] = child;
          } else {
            checkbox.attr("checked", false);
            checkbox.attr("aria-checked", false);
            child.model.set("facetItemchecked", false);
          }
          let facetName = checkbox[0]?.closest(".csui-facet-item")?.querySelector(".csui-name");
          let checkboxEle = checkbox[0];
          if (checkboxEle["checked"]) {
            facetName?.classList?.add("smart-selected-name");
          } else {
            facetName?.classList?.remove("smart-selected-name");
          }
        });
        self.selectItems = newSelectItems;
        let numCheckedItems = self._countCheckedItems();
        self._setDisabledFilters(numCheckedItems);
      }
      self._setMoreLabel(self.showAll);
    },
    onMoreFacetsFetchFailed: function(error) {
      GlobalMessage.showMessage("error", error.message);
      this.showAll = !this.showAll;
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
      var checkboxes = this.$el.find(".csui-checkbox[aria-checked='true']");
      checkboxes.trigger("click");
      this.selectItems = [];
      this.mainCollection?.models?.map(model => {
        if (model?.get("facetItemchecked")) {
          model?.set("facetItemchecked", false);
        }
      });
      this.ui.facetCollapseControls.removeClass("multi-select");
      this._setDisabledFilters(0);
      this.$el.removeClass("multi-select");
      this._updateFacetSubmitControls();
      this.ui.facetHeader.removeClass("binf-disabled");
      this.trigger("activate:facet", this);
    },
    onApplyAll: function() {
      var facet = this.model, filters = this._getFilterArray();
      this.newFilter = {
        id: facet.get("id"),
        values: filters
      };
      this.trigger("apply:filter");
    },
    onRender: function() {
      this.facetListView = !this.facetListView && new FacetListView({
        collection: this.collection,
        blockingParentView: this.options.blockingParentView,
        context: this.options.context,
        model: this.model,
        showButtonsInEachFacet: this.showButtonsInEachFacet,
        displayCountProps: this.displayCountProps,
        maxCount: this.itemsToShow
      });
      this.cardBody.show(this.facetListView);
      if (this.collection.length === 0) {
        this.$el.hide();
      }
      this.$el.attr("role", "menu");
      this.$el.attr("aria-label", _.str.sformat(lang.facetTitleAria, this.model.get("name")));
      this._updateHeaderIcon();
      if (this.haveMore) {
        this._updateShowMoreIcon(false);
      }
      if (this.showButtonsInEachFacet !== undefined && !this.showButtonsInEachFacet) {
        this.getSingleSelectModels();
        this.maintainCheckboxState();
      }
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
    maintainCheckboxState: function() {
      this.ui.selectCount.addClass("binf-hidden");
      var items = this.$el.find(".csui-facet-item");
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
    },
    onShowMore: function(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.showAll = !this.showAll;
      this.mainCollection = {
        ...this.collection
      };
      var self = this;
      this._fillCollection().done(function() {
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
        this.ui.facetHeaderIcon[0].setAttribute("aria-label", _.str.sformat(lang.hideFacetAria, this.model.get("name")));
        this.ui.facetHeaderIcon[0].setAttribute("title", _.str.sformat(lang.hideFacetAria, this.model.get("name")));
      } else {
        this.$el.addClass("csui-facet-collapsed");
        var numCheckedItems = this._countCheckedItems();
        this.ui.facetContent.addClass("binf-hidden");
        this.ui.facetFooter.addClass("binf-hidden");
        this.ui.facetHeaderIcon[0].setAttribute("aria-label", _.str.sformat(lang.showFacetAria, this.model.get("name")));
        this.ui.facetHeaderIcon[0].setAttribute("title", _.str.sformat(lang.showFacetAria, this.model.get("name")));
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
      var numCheckedItems = 0;
      if (this.mainCollection) {
        for (var i = 0; i < this.mainCollection.length; i++) {
          if (this.mainCollection.models[i].attributes.facetItemchecked) {
            numCheckedItems++;
          }
        }
      } else {
        this.facetListView.children.each(function(child) {
          if (child.model) {
            var checked = child.model.get("facetItemchecked");
            if (checked) {
              numCheckedItems++;
            }
          }
        });
      }
      return numCheckedItems;
    },
    _showHideBlueIndicatorOnFacet: function() {
      if (this._countCheckedItems() === 0) {
        this.el.querySelector(".smart-indicator-dot")?.classList?.add("binf-hidden");
      } else {
        this.el.querySelector(".smart-indicator-dot")?.classList.remove("binf-hidden");
      }
    },
    onMultiFilterSelect: function(childView) {
      if (this.applyFilterTimeout) {
        clearTimeout(this.applyFilterTimeout);
      }
      if (this.showButtonsInEachFacet) {
        this.ui.selectCount.removeClass("binf-hidden");
        var numCheckedItems = this._countCheckedItems();
        this._updateSelectList(childView);
        this._updateFacetSubmitControls(numCheckedItems);
        this._setDisabledFilters(numCheckedItems);
        this.selectItems = numCheckedItems === 0 ? [] : this.selectItems;
        this.trigger("activate:facet", this);
      } else {
        this.ui.selectCount.addClass("binf-hidden");
        this.$el.addClass("multi-select");
        var checkbox = this.$el.find(".csui-checkbox");
        checkbox.each(function(index, element) {
          checkbox.addClass("csui-showAlways");
        });
        this._showHideBlueIndicatorOnFacet();
        var facet = this.model;
        this.newFilter = {
          id: facet.get("id"),
          values: [ {
            id: childView.model.get("value")
          } ]
        };
        this.applyFilterTimeout = setTimeout(() => {
          this.onApplyAll();
        }, 1e3);
      }
    },
    onMultiFilterUnselect: function(childView) {
      this.$el.removeClass("multi-select");
      var filters = [];
      filters.push({
        id: childView.model.get("value")
      });
      this.newFilter = {
        id: this.model.get("id"),
        values: filters
      };
      this._showHideBlueIndicatorOnFacet();
      this.trigger("remove:filter");
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
      var unselectedItems = this.facetListView.children.filter(function(child) {
        if (child.model) {
          var checked = child.model.get("facetItemchecked");
          return checked === false || checked === undefined;
        } else {
          return true;
        }
      });
      _.each(unselectedItems, _.bind(function(facetItemView) {
        facetItemView.model.set("disabled", numCheckedItems >= this.maxFacetSelection);
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
      parentEl.find(".csui-icon-v2__csui_smart_ot_action_caret_up32").removeClass("binf-hidden");
      parentEl.find(".csui-icon-v2__csui_smart_ot_action_caret_down32").addClass("binf-hidden");
      parentEl.find(".smart-count-blue-dot").addClass("binf-hidden");
    },
    _showCaretDownIcon: function(parentEl) {
      parentEl.find(".csui-icon-v2__csui_smart_ot_action_caret_up32").addClass("binf-hidden");
      parentEl.find(".csui-icon-v2__csui_smart_ot_action_caret_down32").removeClass("binf-hidden");
      parentEl.find(".smart-count-blue-dot").removeClass("binf-hidden");
    },
    _setMoreLabel: function(showAll) {
      if (this.ui.facetMoreIcon[0]) {
        if (showAll) {
          this.ui.facetMoreText.text(lang.showLess);
          this.ui.facetMore[0].setAttribute("aria-label", lang.showLessAria);
          this.ui.facetMore[0].setAttribute("title", lang.showLessAria);
          this.ui.facetMoreText[0].setAttribute("aria-expanded", "true");
        } else {
          this.ui.facetMoreText.text(lang.showMore);
          this.ui.facetMore[0].setAttribute("aria-label", lang.showMoreAria);
          this.ui.facetMore[0].setAttribute("title", lang.showMoreAria);
          this.ui.facetMoreText[0].setAttribute("aria-expanded", "false");
        }
        this._updateShowMoreIcon(showAll);
      }
      this.trigger("facet:size:change");
    },
    _getFilterArray: function() {
      var filters = [];
      if (this.showButtonsInEachFacet !== undefined && !this.showButtonsInEachFacet) {
        _.each(this.collection?.models, function(item) {
          if (item.attributes?.facetItemchecked) {
            filters.push({
              id: item.attributes?.value
            });
          }
        });
      } else {
        _.each(this.mainCollection?.models, function(item) {
          if (item.attributes?.facetItemchecked) {
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
        if (this.model?.get("total_displayable") > this.mainCollection?.length) {
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