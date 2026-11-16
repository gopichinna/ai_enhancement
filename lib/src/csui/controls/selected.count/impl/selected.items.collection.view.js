/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/controls/node-type.icon/node-type.icon.view", "csui/dialogs/modal.alert/modal.alert", "hbs!csui/controls/selected.count/impl/selected.items.collection", "hbs!csui/controls/selected.count/impl/selected.list.item", "i18n!csui/controls/selected.count/impl/nls/lang", "css!csui/controls/selected.count/impl/selected.count" ], function(_, $, Marionette, NodeTypeIconView, ModalAlert, selectedCountTemplate, selectedListItemTemplate, lang) {
  "use strict";
  var SelectedNodeItemView = Marionette.ItemView.extend({
    className: "csui-selected-item",
    template: selectedListItemTemplate,
    tagName: "li",
    events: {
      keydown: "onKeyInView"
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
      this.listenTo(this, "show", this.applyCSS);
    },
    onRender: function() {
      this._nodeIconView = new NodeTypeIconView({
        el: this.$(".csui-type-icon").get(0),
        node: this.model,
        size: "contain"
      });
      this._nodeIconView.render();
      this.$el.attr("tabindex", "-1");
      this.$el.attr("role", "menuitem");
      this.$el.attr("aria-label", _.str.sformat(lang.unselectAria, this.model.get("name"), this._nodeIconView.$el.attr("aria-label")));
    },
    applyCSS: function() {
      const itemNameWrapper = this.$el.find(".csui-selected-list-item-name-wrapper");
      const elWidth = this.$el.innerWidth();
      const iconWidth = this.$el.find(".csui-icon-group").innerWidth();
      const itemNameWidth = itemNameWrapper.innerWidth();
      if (itemNameWidth && itemNameWidth + iconWidth + 16 > elWidth) itemNameWrapper.css("max-width", "calc(100% - 20px)");
    },
    onModelChange: function() {
      this.render();
    },
    onKeyInView: function(event) {
      this.trigger("keydown:item", event);
    }
  });
  var SelectedItemsCollectionView = Marionette.CompositeView.extend({
    className: "csui-selected-count",
    template: selectedCountTemplate,
    templateHelpers: function() {
      return {
        clearAll: lang.clearAll,
        clearAllAria: lang.clearAllAria
      };
    },
    childViewContainer: ".csui-selected-items-dropdown",
    childView: SelectedNodeItemView,
    childEvents: {
      "remove:selected:item": "onRemoveSelectedItem",
      "keydown:item": "onKeydownItem"
    },
    ui: {
      dropdownContainer: ".csui-dropmenu-container",
      clearAll: ".csui-selected-count-clearall",
      ClearAllButton: ".csui-selected-count-clearall > span"
    },
    events: {
      "click @ui.ClearAllButton": "onClickClearAll",
      "mouseenter @ui.dropdownContainer": "onMouseEnterSelectedCounterView",
      "mouseleave @ui.dropdownContainer": "onMouseLeaveSelectedCounterView",
      "mouseup @ui.clearAll": "onMouseUpClearAll",
      "blur @ui.dropdownContainer": "onBlurSelectedCounterView",
      keydown: "onKeydownSelectedCount",
      keyup: "onKeyupItem"
    },
    constructor: function SelectedItemsCollectionView(options) {
      this.options = options;
      this.collection = options.collection;
      this.selectCountView = options.selectCountView;
      SelectedItemsCollectionView.__super__.constructor.apply(this, arguments);
      this.currentlyFocusedIndex = 0;
      this.showClearAll = false;
      this.selectedItemInFocus = false;
      this.scrollableParent = this.options.parentView?.options?.scrollableParent;
      this.listenTo(this.collection, "reset remove add", function() {
        !this.isDestroyed && this.onCollectionUpdate();
      });
      this.selectedCount = this.collection.length;
      if (!!this.scrollableParent) {
        this.windowResizeHandler = _.bind(this.setDropdownCss, this);
        window.addEventListener("resize", this.windowResizeHandler);
      }
    },
    onRender: function() {
      this.onClickSelectedCount();
    },
    onDestroy: function() {
      this.stopListening(this.options.collection, "reset remove add");
      if (!!this.windowResizeHandler) {
        window.removeEventListener("resize", this.windowResizeHandler);
      }
    },
    onClickClearAll: function() {
      this.selectedItemInFocus = true;
      ModalAlert.confirmQuestion(_.str.sformat(lang.dialogTemplate, lang.dialogTitle), lang.dialogTitle, {}).always(_.bind(function(result) {
        if (result) {
          this.collection.reset([]);
          this._hideItemView();
        } else {
          this.ui.ClearAllButton.trigger("focus");
          this._moveTabindexToFocusedElement && this._moveTabindexToFocusedElement();
        }
        this.selectedItemInFocus = false;
      }, this));
      this.currentlyFocusedIndex = 0;
    },
    onMouseUpClearAll: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.ui.ClearAllButton.trigger("focus");
    },
    isDDOpen: function() {
      return !this.ui.dropdownContainer[0].classList.contains("binf-hidden") && !this.el.classList.contains("binf-hidden");
    },
    onClickSelectedCount: function() {
      var toggleDropdown = this.$el.find(".binf-open>.binf-dropdown-toggle");
      if (toggleDropdown.length > 0) {
        toggleDropdown.binf_dropdown("toggle");
      }
      if (this.ui.dropdownContainer.hasClass("binf-hidden")) {
        this._showItemView();
      }
    },
    resetState: function() {
      var toggleDropdown = this.$el.find(".binf-open>.binf-dropdown-toggle");
      if (toggleDropdown.length > 0) {
        toggleDropdown.binf_dropdown("toggle");
      }
      this._hideItemView();
    },
    _showItemView: function() {
      this.selectedCountViewInFocus = true;
      this.ui.dropdownContainer.removeClass("binf-hidden");
      if (this.selectedCount > 4) {
        this.showClearAll = true;
        this.ui.clearAll.removeClass("binf-hidden");
      }
      if (!!this.scrollableParent) {
        this.setDropdownCss();
      }
      $(document).on("mouseup.csui.select.count", _.bind(this.onDocumentClick, this));
    },
    onShow: function() {
      if (this.ui.clearAll?.[0].classList?.contains("binf-hidden")) {
        this.ui.dropdownContainer?.[0].querySelector(".csui-selected-item")?.focus();
      } else {
        typeof this.ui.clearAll?.[0]?.querySelector === "function" && this.ui.clearAll?.[0]?.querySelector(".csui-selected-count-clearall-label")?.focus();
      }
    },
    onDocumentClick: function(event) {
      if (!event.target.closest(".csui-selected-counter-region>button") && this.$el[0] !== event.target && !this.$el.has(event.target).length && !this.selectedItemInFocus) {
        this._hideItemView();
      }
    },
    setDropdownCss: function() {
      const dropdownEle = this.ui.dropdownContainer.find(".csui-selected-items-dropdown");
      const scrollableParent = $(this.scrollableParent);
      if (!!scrollableParent && scrollableParent.length > 0) {
        const scrollableParentHeight = scrollableParent.height();
        const elementSetBacks = parseInt(scrollableParent.css("margin-top")) + parseInt(scrollableParent.css("margin-bottom"));
        const offsetDiff = dropdownEle.offset().top - scrollableParent.offset().top;
        const heightOfDD = Math.abs(scrollableParentHeight - elementSetBacks - 200);
        dropdownEle.css({
          "max-height": heightOfDD - (24 + offsetDiff) + "px"
        });
      }
    },
    _hideItemView: function() {
      this.options.parentView.destroySelectedDropdown();
      $(document).off("mouseup.csui.select.count");
    },
    onRemoveSelectedItem: function(view) {
      var currentIndex = view._index, itemViews;
      this.selectedCountViewInFocus = true;
      this.collection.remove(view.model);
      itemViews = _.sortBy(this.children.toArray(), "cid");
      if (currentIndex === this.collection.length) {
        itemViews[currentIndex - 1] && itemViews[currentIndex - 1].$el.trigger("focus");
      } else {
        itemViews[currentIndex] && itemViews[currentIndex].$el.trigger("focus");
      }
      if (this.collection.length === 0) {
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
            itemViews[this.currentlyFocusedIndex]?.$el?.trigger("focus");
            event.stopPropagation();
            event.preventDefault();
          }
        }
        break;

       case 13:
        if (this.ui.ClearAllButton.is(":focus")) {
          this.onClickClearAll(event);
        }
        break;

       case 46:
        if (this.ui.ClearAllButton.is(":focus")) {
          this.selectedCountViewInFocus = true;
          this.onClickClearAll(event);
        }
        break;

       case 37:
       case 39:
        event.stopPropagation();
        break;
      }
    },
    onKeydownItem: function(view, event) {
      var itemViews = _.sortBy(this.children.toArray(), "cid");
      event.preventDefault();
      switch (event.keyCode) {
       case 46:
       case 13:
       case 32:
        this.onRemoveSelectedItem(view);
        event.stopPropagation();
        break;

       case 40:
        this.selectedCountViewInFocus = true;
        if (view._index !== this.selectedCount - 1) {
          itemViews[view._index + 1]?.$el?.trigger("focus");
          this.currentlyFocusedIndex = view._index + 1;
        }
        event.stopPropagation();
        break;

       case 38:
        this.selectedCountViewInFocus = true;
        if (view._index > 0) {
          itemViews[view._index - 1]?.$el?.trigger("focus");
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
    },
    onKeyupItem: function(event) {
      if (event.keyCode === 27 && this.isDDOpen()) {
        this.currentlyFocusedIndex = 0;
        event.preventDefault();
        event.stopPropagation();
        this._hideItemView();
        this.options.parentView?.selectedLabel.el.focus();
        this.selectedCountViewInFocus = true;
      }
    },
    onCollectionUpdate: function() {
      if (this.collection.length <= 4) {
        this.ui.clearAll[0].classList.add("binf-hidden");
      }
    }
  });
  return SelectedItemsCollectionView;
});