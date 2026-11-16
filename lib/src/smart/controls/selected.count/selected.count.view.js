/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "smart/utils/smart.base", "hbs!smart/controls/selected.count/impl/selected.count", "hbs!smart/controls/selected.count/impl/selected.list.item", "i18n!smart/controls/selected.count/impl/nls/lang", "css!smart/controls/selected.count/impl/selected.count" ], function(_, $, Marionette, TabableRegionBehavior, smartBase, selectedCountTemplate, selectedListItemTemplate, lang) {
  "use strict";
  var SelectedNodeItemView = Marionette.ItemView.extend({
    className: "csui-selected-item",
    template: selectedListItemTemplate,
    tagName: "li",
    events: {
      keyup: "onKeyInView"
    },
    modelEvents: {
      change: "onModelChange"
    },
    triggers: {
      "click .csui-deselected-icon": "remove:selected:item"
    },
    templateHelpers: function() {
      return {
        name: this.options.model.get("name"),
        clearItem: lang.clearItem
      };
    },
    constructor: function SelectedNodeItemView(options) {
      this.model = options.model;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      var iconViewOptions = {
        el: this.$(".csui-type-icon").get(0),
        node: this.model,
        size: "contain"
      };
      if (this.options?.getNodeTypeIconView) {
        this._nodeIconView = this.options?.getNodeTypeIconView(iconViewOptions);
        this._nodeIconView.render();
        this.$el.attr("aria-label", _.str.sformat(lang.unselectAria, this.model.get("name"), this._nodeIconView.$el.attr("aria-label")));
      }
      this.$el.attr("tabindex", "-1");
      this.$el.attr("role", "menuitem");
      this.el?.setAttribute("aria-label", _.str.sformat(lang.unselectAria, this.model.get("name"), this._nodeIconView?.el?.getAttribute("aria-label")));
    },
    onModelChange: function() {
      this.render();
    },
    onKeyInView: function(event) {
      this.trigger("keydown:item", event);
    }
  });
  var SelectedCountView = Marionette.CompositeView.extend({
    className: "csui-selected-count",
    template: selectedCountTemplate,
    templateHelpers: function() {
      var selectedCount = this.collection && this.collection.length;
      return {
        selectedCount: selectedCount,
        clearAll: lang.clearAll,
        clearAllAria: lang.clearAllAria,
        selectedLabel: lang.selectedLabel,
        selectedButtonTitle: _.str.sformat(lang.selectedButtonTitle, selectedCount),
        selectedButtonAria: _.str.sformat(lang.selectedButtonAria, selectedCount)
      };
    },
    childViewContainer: ".csui-selected-items-dropdown",
    childView: SelectedNodeItemView,
    childEvents: {
      "remove:selected:item": "onRemoveSelectedItem",
      "keydown:item": "onKeydownItem"
    },
    childViewOptions: function() {
      return {
        getNodeTypeIconView: this.options?.getNodeTypeIconView
      };
    },
    ui: {
      selectedCountButton: ".csui-selected-counter-region button",
      selectedCountValue: ".csui-selected-counter-region .csui-selected-counter-value",
      dropdownContainer: ".csui-dropmenu-container",
      clearAll: ".csui-selected-count-clearall",
      ClearAllButton: ".csui-selected-count-clearall > span"
    },
    events: {
      "keyup @ui.selectedCountButton": "onClickSelectedCount",
      "mousedown @ui.selectedCountButton": "onClickSelectedCount",
      "click @ui.ClearAllButton": "onClickClearAll",
      "mouseenter @ui.selectedCountButton": "onMouseEnterSelectedCounterView",
      "mouseleave @ui.selectedCountButton": "onMouseLeaveSelectedCounterView",
      "mouseenter @ui.dropdownContainer": "onMouseEnterSelectedCounterView",
      "mouseleave @ui.dropdownContainer": "onMouseLeaveSelectedCounterView",
      "mouseup @ui.clearAll": "onMouseUpClearAll",
      "blur  @ui.selectedCountButton": "onBlurSelectedCountButton",
      "blur @ui.dropdownContainer": "onBlurSelectedCounterView",
      keyup: "onKeydownSelectedCount"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    currentlyFocusedElement: function() {
      return this.ui.selectedCountButton;
    },
    constructor: function SelectedCountView(options) {
      options = _.defaults(options, {
        showOnlyOnSelection: true
      });
      this.collection = options.collection;
      SelectedCountView.__super__.constructor.apply(this, arguments);
      this.currentlyFocusedIndex = 0;
      this.showClearAll = false;
      this.selectedItemInFocus = false;
      this.scrollableParent = options.scrollableParent;
      this.listenTo(this.collection, "reset remove add", function() {
        !this.isDestroyed && this.onCollectionUpdate();
      });
      this.selectedCount = this.collection.length;
      if (!!this.scrollableParent) {
        this.windowResizeHandler = _.bind(this.setDropdownCss, this);
        $(window).on("resize", this.windowResizeHandler);
      }
    },
    onRender: function() {
      if (!this.selectedCount) {
        this.options.showOnlyOnSelection && this.$el.addClass("binf-hidden");
      } else {
        this.ui.dropdownContainer.addClass("binf-hidden");
        $(document).off("mouseup.csui.select.count");
      }
    },
    onDestroy: function() {
      this.stopListening(this.collection, "reset remove add");
      if (!!this.windowResizeHandler) {
        $(window).off("resize", this.windowResizeHandler);
      }
    },
    onClickClearAll: function(event) {
      this.selectedItemInFocus = false;
      if (event?.keyCode === 13 || event?.keyCode === 46) {
        this.$el.trigger("tabNextRegion");
      }
      this.collection.reset([]);
      this.currentlyFocusedIndex = 0;
    },
    onMouseUpClearAll: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.ui.ClearAllButton.trigger("focus");
    },
    isDDOpen: function() {
      return !this.ui.dropdownContainer[0]?.classList?.contains("binf-hidden") && !this.el.classList?.contains("binf-hidden");
    },
    _focusOnSelectedCountButton: function() {
      this.ui.selectedCountButton.trigger("focus");
      this.selectedCountViewInFocus = true;
    },
    onMouseEnterSelectedCounterView: function() {
      this.selectedCountViewInFocus = true;
    },
    onMouseLeaveSelectedCounterView: function() {
      if (this.selectedItemInFocus === false) {
        this.selectedCountViewInFocus = false;
      }
    },
    onClickSelectedCount: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32 || event.type === "mousedown") {
        event.stopPropagation();
        event.preventDefault();
        var toggleDropdown = this.$el.find(".binf-open>.binf-dropdown-toggle");
        if (toggleDropdown.length > 0) {
          toggleDropdown.binf_dropdown("toggle");
        }
        if (this.ui.dropdownContainer.hasClass("binf-hidden")) {
          this._showItemView(event);
        } else {
          this._hideItemView();
        }
      }
    },
    resetState: function() {
      var toggleDropdown = this.$el.find(".binf-open>.binf-dropdown-toggle");
      if (toggleDropdown.length > 0) {
        toggleDropdown.binf_dropdown("toggle");
      }
      this._hideItemView();
    },
    _showItemView: function(event) {
      this.selectedCountViewInFocus = true;
      this.ui.dropdownContainer.removeClass("binf-hidden");
      this.ui.selectedCountButton.addClass("binf-open");
      this.ui.selectedCountButton.attr("aria-expanded", "true");
      if (this.selectedCount > 4) {
        this.showClearAll = true;
        this.ui.clearAll.removeClass("binf-hidden");
      }
      if (!!this.scrollableParent) {
        this.setDropdownCss();
      }
      if (this.ui.clearAll.hasClass("binf-hidden")) {
        this.ui.dropdownContainer.find(".csui-selected-item:first").trigger("focus");
        event.preventDefault();
        event.stopPropagation();
      } else {
        this.ui.clearAll.find(".csui-selected-count-clearall-label").trigger("focus");
      }
    },
    setDropdownCss: function() {
      var dropdownEle = this.ui.dropdownContainer.find(".csui-selected-items-dropdown"), scrollableParent = $(this.scrollableParent), offsetDiff, scrollableParentHeight, elementSetBacks;
      if (!!scrollableParent && scrollableParent.length > 0) {
        scrollableParentHeight = scrollableParent.height();
        elementSetBacks = parseInt(scrollableParent.css("margin-top")) + parseInt(scrollableParent.css("margin-bottom"));
        offsetDiff = dropdownEle.offset().top - scrollableParent.offset().top;
        var heightOfDD = Math.abs(scrollableParentHeight - elementSetBacks);
        dropdownEle.css({
          "max-height": heightOfDD - (24 + offsetDiff) + "px"
        });
      }
    },
    _hideItemView: function(event) {
      this.selectedCountViewInFocus = false;
      _.isFunction(this.ui.dropdownContainer.addClass) && this.ui.dropdownContainer.addClass("binf-hidden");
      this.ui.selectedCountButton.removeClass("binf-open");
      this.ui.selectedCountButton.attr("aria-expanded", "false");
      $(document).off("mouseup.csui.select.count");
    },
    onRemoveSelectedItem: function(view, event) {
      var currentIndex = view._index, self = this, itemViews;
      this.selectedCountViewInFocus = true;
      if (event?.type === "keyup") {
        !event?.isDefaultPrevented() && this.collection.remove(view.model);
      } else {
        this.collection.remove(view.model);
      }
      itemViews = _.sortBy(this.children.toArray(), "cid");
      if (currentIndex === this.selectedCount) {
        itemViews[currentIndex - 1] && itemViews[currentIndex - 1].$el.trigger("focus");
      } else {
        itemViews[currentIndex] && itemViews[currentIndex].$el.trigger("focus");
      }
      if (this.collection.length === 0) {
        if (event?.keyCode === 13 || event?.keyCode === 32) {
          event?.preventDefault();
          event.stopPropagation();
          this.trigger("empty:selectcount", event);
        }
      }
    },
    onEmptyCollection: function(event) {
      this.$el.trigger("tabNextRegion");
      event?.preventDefault();
      event.stopPropagation();
      return true;
    },
    onCollectionUpdate: function() {
      if (this.isRendered) {
        this.selectedCount = this.collection.length;
        if (this.selectedCount && !this.isDDOpen()) {
          this.options.showOnlyOnSelection && this.$el.removeClass("binf-hidden");
          _.isFunction(this.ui.dropdownContainer.addClass) && this.ui.dropdownContainer.addClass("binf-hidden");
          this.trigger("show:counter", true);
        } else if (!this.selectedCount) {
          const tabNextRegionPromise = new Promise(_.bind(resolve => {
            resolve(this.stopListening(this, "empty:selectcount").listenTo(this, "empty:selectcount", function(event) {
              this.triggerMethod("empty:collection", event);
            }));
          }, this));
          tabNextRegionPromise.then(() => {
            this.ui?.selectedCountButton?.removeClass("binf-open");
            this.options?.showOnlyOnSelection && this.el?.classList.add("binf-hidden");
            $(document).off("mouseup.csui.select.count");
            this.trigger("show:counter", false);
          });
        }
        this.ui.selectedCountValue.text(this.selectedCount);
        this.ui.selectedCountButton.attr("aria-label", _.str.sformat(lang.selectedButtonAria, this.selectedCount));
        this.ui.selectedCountButton.attr("title", _.str.sformat(lang.selectedButtonTitle, this.selectedCount));
        if (!this.showClearAll && this.selectedCount > 4) {
          this.showClearAll = true;
          this.ui.clearAll.removeClass("binf-hidden");
        } else if (this.selectedCount <= 4 && this.showClearAll) {
          this.showClearAll = false;
          this.ui.clearAll.addClass("binf-hidden");
        }
        if (this.selectedCount > 0) {
          this._moveTabindexToFocusedElement();
        }
      }
    },
    _moveTabindexToFocusedElement: function() {
      this._focusableElements = smartBase.findFocusables(this.el);
      for (var i = 0; i < this._focusableElements.length; i++) {
        this._focusableElements[i].setAttribute("tabindex", "0");
      }
    },
    onBlurSelectedCountButton: function(event) {
      if (!this.selectedCountViewInFocus) {
        this._hideItemView();
      }
    },
    onBlurSelectedCounterView: function(event) {
      if (!this.selectedCountViewInFocus) {
        this._hideItemView();
      }
    },
    onKeydownSelectedCount: function(event) {
      switch (event.keyCode) {
       case 9:
        if (event.shiftKey && !this.ui.dropdownContainer.hasClass("binf-hidden")) {
          event.preventDefault();
          event.stopPropagation();
          this.ui.ClearAllButton.trigger("focus");
        } else {
          var itemViews = _.sortBy(this.children.toArray(), "cid");
          this.selectedCountViewInFocus = true;
          if (this.ui.ClearAllButton.is(":focus")) {
            itemViews[this.currentlyFocusedIndex].$el.trigger("focus");
            event.stopPropagation();
            event.preventDefault();
          }
        }
        break;

       case 13:
       case 32:
        if (event.target === this.ui.ClearAllButton[0]) {
          this.onClickClearAll(event);
        }
        if (event.target === this.ui.selectedCountButton[0]) {
          this.selectedCountViewInFocus = true;
          this.onClickSelectedCount(event);
          event.stopPropagation();
        }
        break;

       case 46:
        if (this.ui.ClearAllButton.is(":focus")) {
          this.selectedCountViewInFocus = true;
          this.onClickClearAll(event);
        }
        break;

       case 37:
        event.stopPropagation();
        break;

       case 39:
        event.stopPropagation();
        break;

       case 27:
        if (this.isDDOpen()) {
          this.currentlyFocusedIndex = 0;
          event.preventDefault();
          event.stopPropagation();
          this._hideItemView();
          this._focusOnSelectedCountButton();
        }
        break;
      }
    },
    onKeydownItem: function(view, event) {
      var itemViews = _.sortBy(this.children.toArray(), "cid");
      switch (event.keyCode) {
       case 46:
       case 13:
       case 32:
        this.onRemoveSelectedItem(view, event);
        event.stopPropagation();
        break;

       case 40:
        this.selectedCountViewInFocus = true;
        if (view._index !== this.selectedCount - 1) {
          itemViews[view._index + 1].$el.trigger("focus");
          this.currentlyFocusedIndex = view._index + 1;
        }
        event.stopPropagation();
        break;

       case 38:
        this.selectedCountViewInFocus = true;
        if (view._index > 0) {
          itemViews[view._index - 1].$el.trigger("focus");
          this.currentlyFocusedIndex = view._index - 1;
        }
        event.stopPropagation();
        break;

       case 37:
        event.stopPropagation();
        break;

       case 39:
        event.stopPropagation();
        break;
      }
    }
  });
  return SelectedCountView;
});