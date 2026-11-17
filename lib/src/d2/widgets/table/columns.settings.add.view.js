/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/controls/list/emptylist.view", "hbs!d2/widgets/table/impl/columns.settings.add", "hbs!d2/widgets/table/impl/columns.settings.add.item", "i18n!d2/widgets/table/impl/nls/lang" ], function(_, $, Marionette, EmptyListView, template, itemTemplate, lang) {
  "use strict";
  var ColumnsSettingsAddItemView = Marionette.ItemView.extend({
    template: itemTemplate,
    templateHelpers: function() {
      return {
        model: this.model.attributes,
        typeSelected: !!this.getOption("parent").selectedType
      };
    },
    ui: {
      current_item: "> .binf-list-group-item"
    },
    events: {
      "click @ui.current_item": "itemClick"
    },
    itemClick: function() {
      var parent = this.getOption("parent");
      if (this.model.get("parent")) {
        var prefColumns = parent.prefColumns;
        if (this.ui.current_item.hasClass("selected")) {
          this.ui.current_item.removeClass("selected");
          this.model.unset("selected");
          prefColumns.remove(this.model);
          parent.addCount--;
        } else {
          this.ui.current_item.addClass("selected");
          this.model.set("selected", true);
          prefColumns.add(this.model);
          parent.addCount++;
        }
        parent.ui.add_count.html(parent.addCount + "");
        parent.ui.add_count.toggle(parent.addCount > 0);
        if (parent.selectedType) {
          parent.getOption("origParent").addCount = parent.addCount;
          parent.getOption("origParent").ui.add_count.html(parent.addCount + "");
          parent.getOption("origParent").ui.add_count.toggle(parent.addCount > 0);
        }
      } else {
        parent.containerView.showCard("add_columns_type", new ColumnsSettingsAddView({
          selectedType: this.model,
          collection: parent.collection,
          prefColumns: parent.prefColumns,
          origPrefCols: parent.origPrefCols,
          origParent: parent,
          addCount: parent.addCount,
          containerView: parent.containerView
        }));
      }
    }
  });
  var ColumnsSettingsAddView = Marionette.CompositeView.extend({
    template: template,
    templateHelpers: function() {
      return {
        addCount: this.addCount,
        labels: {
          title: this.selectedType ? this.selectedType.get("label") : lang.AddColumnsTitle,
          searchPlaceholder: lang.ColumnsSearchPlaceholder
        }
      };
    },
    childViewContainer: "> .columns-list",
    childView: ColumnsSettingsAddItemView,
    childViewOptions: function() {
      return {
        parent: this
      };
    },
    emptyView: EmptyListView,
    ui: {
      back_button: "> .header .back-button",
      add_count: "> .header .add-count",
      search_box: "> .search-box input"
    },
    events: {
      "click @ui.back_button": "backButtonClick",
      keydown: "onKeyDown",
      "focus .binf-list-group-item": "onItemFocus",
      "propertychange @ui.search_box": "onSearchValueChange",
      "input @ui.search_box": "onSearchValueChange",
      "cut @ui.search_box": "onSearchValueChange",
      "paste @ui.search_box": "onSearchValueChange"
    },
    constructor: function ColumnsSettingsAddView(options) {
      var me = this;
      options = options || {};
      me.selectedType = options.selectedType;
      me.parent = options.parent;
      me.containerView = options.containerView;
      me.prefColumns = options.prefColumns;
      me.origPrefCols = options.origPrefCols || me.prefColumns.clone();
      me.addCount = options.addCount || 0;
      Marionette.CompositeView.call(me, options);
    },
    filter: function(child) {
      if (child.get("parent") && this.origPrefCols.get(child.get("name"))) {
        return false;
      }
      if (this.selectedType && child.get("parent") !== this.selectedType.get("name")) {
        return false;
      }
      var srchVal = this.ui.search_box.val().trim();
      if (srchVal) {
        var label = child.get("label"), regex = new RegExp("^" + srchVal, "i");
        return regex.test(label);
      }
      return this.selectedType || !child.get("parent");
    },
    backButtonClick: function() {
      if (this.selectedType) {
        this.containerView.showCard("add_columns");
      } else {
        this.containerView.showCard("columns_settings");
      }
    },
    onShow: function() {
      if (this.ui.search_box) {
        this.ui.search_box.trigger("focus");
      }
    },
    onItemFocus: function(event) {
      this.currentFocusElem = $(event.target);
    },
    onKeyDown: function(event) {
      if (this.ui.search_box.is(event.target)) {
        switch (event.which) {
         case 27:
          if (this.ui.search_box.val() !== "") {
            this.ui.search_box.val("");
            this.onSearchValueChange();
          } else {
            return;
          }
          break;

         case 9:
          if (event.shiftKey) {
            this._setFocus(this.ui.back_button);
          } else {
            this._setFocus(this.currentFocusElem || this._getFirstElement());
          }
          break;

         default:
          return;
        }
      } else if (this.ui.back_button.is(event.target)) {
        switch (event.which) {
         case 9:
          if (event.shiftKey) {
            this._setFocus(this.currentFocusElem || this._getFirstElement());
          } else {
            this._setFocus(this.ui.search_box);
          }
          break;

         case 13:
         case 32:
          this.backButtonClick();
          break;

         default:
          return;
        }
      } else if ($(event.target).hasClass("binf-list-group-item")) {
        var prev, next, preElem = this.currentFocusElem;
        switch (event.which) {
         case 33:
         case 36:
          this._setFocus(this._getFirstElement(), preElem);
          break;

         case 34:
         case 35:
          this._setFocus(this._getLastElement(), preElem);
          break;

         case 38:
          prev = this._getPrevElement(preElem);
          if (prev.length > 0) {
            this._setFocus(prev, preElem);
          }
          break;

         case 40:
          next = this._getNextElement(preElem);
          if (next.length > 0) {
            this._setFocus(next, preElem);
          }
          break;

         case 9:
          if (event.shiftKey) {
            this._setFocus(this.ui.search_box);
          } else {
            this._setFocus(this.ui.back_button);
          }
          break;

         case 13:
         case 32:
          preElem.trigger("click");
          break;

         default:
          return;
        }
      }
      event.preventDefault();
      event.stopPropagation();
    },
    onSearchValueChange: function() {
      var newValue = this.ui.search_box.val().trim();
      if (newValue === this.oldValue) {
        return;
      }
      delete this.currentFocusElem;
      this.collection.trigger("reset");
      this.oldValue = newValue;
      this.containerView.resetHeightAndScroll();
    },
    _getFirstElement: function() {
      return this.$el.find(".binf-list-group-item:first");
    },
    _getLastElement: function() {
      return this.$el.find(".binf-list-group-item:last");
    },
    _getPrevElement: function(preElem) {
      var siblings = preElem.closest(".binf-list-group").find(".binf-list-group-item"), idx = siblings.index(preElem);
      if (idx === 0) {
        return [];
      }
      return siblings.eq(idx - 1);
    },
    _getNextElement: function(preElem) {
      var siblings = preElem.closest(".binf-list-group").find(".binf-list-group-item"), idx = siblings.index(preElem);
      return siblings.eq(idx + 1);
    },
    _setFocus: function(elem, preElem) {
      setTimeout(function() {
        if (preElem) {
          preElem.removeAttr("tabindex");
        }
        if (elem) {
          elem.attr("tabindex", "0") && elem.trigger("focus");
        }
      }, 50);
    }
  });
  return ColumnsSettingsAddView;
});