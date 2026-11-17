/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/dialogs/modal.alert/modal.alert", "hbs!csui/controls/selected.count/impl/selected.list.item", "i18n!csui/controls/selected.count/impl/nls/lang", "smart/themes/theming", "csui/utils/otnodesprites", "css!csui/controls/selected.count/impl/selected.count" ], function(_, $, Marionette, ModalAlert, selectedListItemTemplate, lang, theming, nodeSpriteCollection) {
  "use strict";
  let SelectedNodeItemView = Marionette.ItemView.extend({
    className: "csui-selected-item",
    template: selectedListItemTemplate,
    attributes: function() {
      return {
        isdeletable: "",
        "aria-label": ""
      };
    },
    tagName: "otc-menuitem",
    events: {
      keydown: "onKeyInView"
    },
    modelEvents: {
      change: "onModelChange"
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
      if (!theming.isJATOTheme()) {
        const exactNodeSprite = this.options.nodeSprite || nodeSpriteCollection.findByNode(this.model) || {};
        this.iconName = this._calculateV2IconName(exactNodeSprite.get("iconName") || "");
        this.$el.attr("icon", this.iconName);
      }
      this.$el.attr("tabindex", "-1");
      this.$el.attr("role", "menuitem");
      this.el.addEventListener("item-remove", event => {
        this.trigger("remove:selected:item");
      });
    },
    _calculateV2IconName: function(iconName) {
      if (iconName.startsWith("csui_")) {
        return iconName.replace("csui_", "csui_action:");
      }
      return iconName;
    },
    onModelChange: function() {
      this.render();
    },
    onKeyInView: function(event) {
      this.trigger("keydown:item", event);
    }
  });
  let SelectedItemsCollectionView = Marionette.CollectionView.extend({
    tagName: "otc-menu",
    attributes: function() {
      return {
        id: _.uniqueId("toolbarSelectedMenu"),
        "data-smart-theme": theming.getTheme(),
        buttonid: this.options.btnId,
        clearall: "",
        ariarole: "menu",
        arialabel: "",
        buttonalignment: "start",
        clearalltext: lang.clearAll,
        maxitems: "0",
        scrollable: "",
        role: "menu"
      };
    },
    childViewContainer: "otc-menu",
    childView: SelectedNodeItemView,
    childEvents: {
      "remove:selected:item": "onRemoveSelectedItem",
      "keydown:item": "onKeydownItem"
    },
    events: {
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
      this.selectedCount = this.collection.length;
      this.el.addEventListener("clear-all", () => {
        this.onClickClearAll();
      });
    },
    onDestroy: function() {
      this.stopListening(this.options.collection, "reset remove add");
    },
    onClickClearAll: function() {
      this.selectedItemInFocus = true;
      ModalAlert.confirmQuestion(_.str.sformat(lang.dialogTemplate, lang.dialogTitle), lang.dialogTitle, {}).always(_.bind(function(result) {
        if (result) {
          this.collection.reset([]);
        }
        this.selectedItemInFocus = false;
      }, this));
      this.currentlyFocusedIndex = 0;
    },
    onRemoveSelectedItem: function(view) {
      let currentIndex = view._index, itemViews;
      this.selectedCountViewInFocus = true;
      this.collection.remove(view.model);
      itemViews = _.sortBy(this.children.toArray(), "cid");
      if (currentIndex === this.collection.length) {
        itemViews[currentIndex - 1] && itemViews[currentIndex - 1].$el.trigger("focus");
      } else {
        itemViews[currentIndex] && itemViews[currentIndex].$el.trigger("focus");
      }
    },
    onKeydownItem: function(view, event) {
      event.preventDefault();
      switch (event.keyCode) {
       case 46:
       case 13:
       case 32:
        this.onRemoveSelectedItem(view);
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
  return SelectedItemsCollectionView;
});