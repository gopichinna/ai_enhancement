/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "hbs!d2/controls/typeahead/impl/typeahead.chicklets", "hbs!d2/controls/typeahead/impl/typeahead.chicklet.msg", "hbs!d2/controls/typeahead/impl/typeahead.chicklet.item", "hbs!d2/controls/typeahead/impl/typeahead.search.field", "i18n!d2/controls/typeahead/impl/nls/lang" ], function(_, $, Backbone, Marionette, chickletsTemplate, chickletMsgTemplate, chickletItemTemplate, searchFieldTemplate, lang) {
  "use strict";
  var TypeaheadSearchTextView = Marionette.ItemView.extend({
    constructor: function TypeaheadSearchTextView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.parentView = this.options.parentView;
    },
    tagName: "li",
    className: "typeahead-search",
    template: searchFieldTemplate,
    ui: {
      searchField: ".typeahead-search-text-field",
      typedCharacter: ".typed-character"
    },
    events: {
      "click @ui.searchField": "onClick",
      "keyup @ui.searchField": "onKeyUp",
      "keydown @ui.searchField": "onKeyDown",
      "input @ui.searchField": "onKeyInput",
      "blur @ui.searchField": "onFocusOut",
      "focus @ui.searchField": "onFocusIn"
    },
    onRender: function() {
      this.updateSearchFieldLength();
    },
    onKeyDown: function(event) {
      var keyword = $(event.target).val();
      if (event.target.selectionStart === 0 && keyword.length === 0) {
        this.parentView.onTypeaheadListitemKeydown(event, null, false);
      }
    },
    onKeyUp: function(event) {
      event.stopPropagation();
      event.preventDefault();
      this.parentView.onTypeaheadSearchKeyup(event);
    },
    onClick: function(event) {
      event.stopPropagation();
      event.preventDefault();
      this.parentView.onTypeaheadSearchClick(event);
    },
    onKeyInput: function(event) {
      this.updateSearchFieldLength();
      this.parentView.onTypeaheadSearchKeyInput(event);
    },
    onFocusIn: function(event) {
      this.parentView.onTypeaheadSearchFocus(event);
    },
    onFocusOut: function(event) {
      this.parentView.onTypeaheadSearchBlur(event);
    },
    resetValue: function() {
      this.ui.searchField.val("");
      this.updateSearchFieldLength();
    },
    updateSearchFieldLength: function() {
      var keyword = this.ui.searchField.val();
      this.ui.typedCharacter.html(keyword);
      var width = this.ui.typedCharacter.width();
      var length = width + 10 + "px";
      this.ui.searchField.css("width", length);
    }
  });
  var TypeaheadChickletItemView = Marionette.ItemView.extend({
    constructor: function TypeaheadChickletItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.parentView = this.options.parentView;
      this.$el.attr({
        draggable: true,
        "data-d2-key": this.model.cid,
        "chicklet-selected": false,
        tabindex: -1
      });
    },
    tagName: "li",
    className: "typeahead-chicklet-item",
    template: chickletItemTemplate,
    ui: {
      chickletText: ".chicklet-text",
      chickletRemove: ".chicklet-remove"
    },
    events: {
      click: "_onClickChicklet",
      keydown: "_onKeyDownChicklet",
      keyup: "_onKeyUpChicklet",
      "click @ui.chickletRemove": "_onClickRemove",
      "keydown @ui.chickletRemove": "_onKeyDownRemove"
    },
    templateHelpers: function() {
      return {
        removeAria: lang.removeTitleAria,
        removeTitle: lang.removeTitle
      };
    },
    onRender: function() {
      var title = this.model.get("name");
      if (this.parentView.typeaheadView && this.parentView.typeaheadView.showToolTipIdName() && this.model.get("name") !== this.model.get("id")) {
        title = this.model.get("name") + "\n" + this.model.get("id");
      }
      this.$el.attr({
        title: title,
        "aria-label": title,
        role: "button"
      });
    },
    _onClickChicklet: function(event) {
      event.stopPropagation();
      this.parentView.onTypeaheadChickletClick(event, this.model);
    },
    _onKeyDownChicklet: function(event) {
      this.parentView.onTypeaheadListitemKeydown(event, this.model, true);
    },
    _onKeyUpChicklet: function(event) {
      if (event.which === 27) {
        event.stopPropagation();
        event.preventDefault();
      }
    },
    _onClickRemove: function(event) {
      event.stopPropagation();
      event.preventDefault();
      this.trigger("typeahead:remove:chicklet");
    },
    _onKeyDownRemove: function(event) {
      var $element = $(event.target);
      switch (event.which) {
       case 13:
       case 32:
        this.trigger("typeahead:remove:chicklet");
        break;

       case 38:
        $element.parent(".typeahead-chicklet-item").trigger("focus");
        break;

       default:
        return;
      }
      event.stopPropagation();
      event.preventDefault();
    }
  });
  var TypeaheadChickletsView = Marionette.CompositeView.extend({
    constructor: function TypeaheadChickletsView() {
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.collection, "update", this.onCollectionChange);
      this.listenTo(this, "typeahead:select:items:all", this.onTypeaheadSelectItemsAll);
      this.listenTo(this, "typeahead:unselect:items:all", this.onTypeaheadUnselectItemsAll);
      this.typeaheadView = this.options.typeaheadView;
      this.createSerachFieldView();
    },
    className: "typeahead-chicklets",
    template: chickletsTemplate,
    childViewContainer: ".typeahead-chicklet-items",
    childView: TypeaheadChickletItemView,
    events: {
      "focus .typeahead-chicklet-item": "_onChickletFocus",
      "blur .typeahead-chicklet-item": "_onChickletBlur"
    },
    templateHelpers: function() {
      return {
        typeaheadPlaceHolder: this.options.placeHolder
      };
    },
    ui: {
      typeaheadPlaceholder: ".typeahead-placeholder",
      typeaheadChickletItems: ".typeahead-chicklet-items"
    },
    childEvents: {
      "typeahead:remove:chicklet": "onTypeaheadRemoveChicklet"
    },
    childViewOptions: function() {
      return _.extend({
        parentView: this
      }, this.options);
    },
    onShow: function() {
      var self = this;
      self.updateSearchFieldInChicketList();
      this.checkPlaceHolder();
      this.checkForEmptyList();
    },
    attachHtml: function(collectionView, childView, index) {
      Marionette.CompositeView.prototype.attachHtml.call(this, collectionView, childView, index);
      this.attachDragListeners(childView);
    },
    onCollectionChange: function() {
      this.updateSearchFieldInChicketList();
      this.checkPlaceHolder();
      this.onTypeaheadUnselectItemsAll();
      this.checkForEmptyList();
    },
    checkForEmptyList: function() {
      if (this.collection.length === 0) {
        this.typeaheadView.ui.chickletsContainer.addClass("empty-list");
      } else {
        this.typeaheadView.ui.chickletsContainer.removeClass("empty-list");
      }
    },
    updateSearchFieldInChicketList: function() {
      this.$searchField.detach();
      this.ui.typeaheadChickletItems.append(this.$searchField);
    },
    showPlaceholder: function() {
      return this.ui.typeaheadPlaceholder.removeClass("binf-hidden");
    },
    removePlaceholder: function() {
      return this.ui.typeaheadPlaceholder.addClass("binf-hidden");
    },
    checkPlaceHolder: function() {
      var keyword = this.getSearchTextField().val();
      if (keyword.length === 0 && this.collection.length === 0) {
        this.showPlaceholder();
      } else {
        this.removePlaceholder();
      }
    },
    createSerachFieldView: function() {
      var options = _.extend({
        parentView: this
      }, this.options);
      this.searchFieldView = new TypeaheadSearchTextView(options);
      this.$searchField = this.searchFieldView.render().$el;
    },
    getSearchTextField: function() {
      return this.searchFieldView.ui.searchField;
    },
    resetSearchTextField: function() {
      this.searchFieldView.resetValue();
    },
    focusSearchTextField: function() {
      this.searchFieldView.ui.searchField.trigger("focus");
    },
    focusChildElement: function(event) {
      var $element = $(event.target);
      if ($element.length > 0 && $element.hasClass("typeahead-chicklet-item")) {
        $element.find("[tabindex]").first().trigger("focus");
      }
    },
    removeChickletByModel: function(model, removeSelected) {
      this.typeaheadView.onTypeaheadRemoveItem(model, true, removeSelected);
    },
    onTypeaheadRemoveChicklet: function(view) {
      this.removeChickletByModel(view.model);
    },
    onTypeaheadSearchClick: function() {
      this.onTypeaheadUnselectItemsAll();
    },
    onTypeaheadSearchKeyup: function(event) {
      this.typeaheadView.onTypeaheadSearchFieldKeyup(event);
    },
    onTypeaheadSearchKeyInput: function(event) {
      this.typeaheadView.onTypeaheadPerformSearch(event);
      var keyword = $(event.target).val();
      if (keyword.length === 0 && this.collection.length === 0) {
        this.showPlaceholder();
      } else {
        this.removePlaceholder();
      }
    },
    onTypeaheadSearchFocus: function(event) {
      this.onTypeaheadUnselectItemsAll();
      this.typeaheadView.$el.addClass("focused");
      this.typeaheadView.onTypeaheadSearchFocus(event);
      this.checkPlaceHolder();
    },
    onTypeaheadSearchBlur: function(event) {
      this.typeaheadView.$el.removeClass("focused");
      this.typeaheadView.onTypeaheadSearchBlur(event);
      this.checkPlaceHolder();
    },
    onTypeaheadSelectItemsAll: function() {
      this.$el.find(".typeahead-chicklet-item").attr("chicklet-selected", true);
    },
    onTypeaheadUnselectItemsAll: function() {
      delete this.$clickedChickletEl;
      this.$el.find(".typeahead-chicklet-item").attr("chicklet-selected", false);
    },
    onTypeaheadSelectItemsPrevAll: function(event, selectCurrentChicklet) {
      this.onTypeaheadUnselectItemsAll();
      var $el = this.getChickletElement(event, selectCurrentChicklet);
      var $chickletEl = $el.prevAll(".typeahead-chicklet-item");
      $chickletEl.attr("chicklet-selected", true);
    },
    onTypeaheadSelectItemsNextAll: function(event, selectCurrentChicklet) {
      this.onTypeaheadUnselectItemsAll();
      var $el = this.getChickletElement(event, selectCurrentChicklet);
      var $chickletEl = $el.nextAll(".typeahead-chicklet-item");
      $chickletEl.attr("chicklet-selected", true);
    },
    onTypeaheadSelectItemsPrev: function(event, selectCurrentChicklet) {
      var $currentChickletEl = this.getChickletElement(event, selectCurrentChicklet), $prevSelectedChickletEl = $currentChickletEl.prevAll(".typeahead-chicklet-item[chicklet-selected=true]"), $nextSelectedChickletEl = $currentChickletEl.nextAll(".typeahead-chicklet-item[chicklet-selected=true]");
      if ($prevSelectedChickletEl.length === 0 && $nextSelectedChickletEl.length === 0) {
        $currentChickletEl.prev(".typeahead-chicklet-item").attr("chicklet-selected", true);
      } else if ($prevSelectedChickletEl.length > 0) {
        var $prevChickletEl = $($prevSelectedChickletEl[$prevSelectedChickletEl.length - 1]);
        $prevChickletEl.prev(".typeahead-chicklet-item").attr("chicklet-selected", true);
        $nextSelectedChickletEl.attr("chicklet-selected", false);
      } else if ($nextSelectedChickletEl.length > 0) {
        var $nextChickletEl = $($nextSelectedChickletEl[$nextSelectedChickletEl.length - 1]);
        $nextChickletEl.attr("chicklet-selected", false);
      }
    },
    onTypeaheadSelectItemsNext: function(event, selectCurrentChicklet) {
      var $currentChickletEl = this.getChickletElement(event, selectCurrentChicklet), $prevSelectedChickletEl = $currentChickletEl.prevAll(".typeahead-chicklet-item[chicklet-selected=true]"), $nextSelectedChickletEl = $currentChickletEl.nextAll(".typeahead-chicklet-item[chicklet-selected=true]");
      if ($prevSelectedChickletEl.length === 0 && $nextSelectedChickletEl.length === 0) {
        $currentChickletEl.next(".typeahead-chicklet-item").attr("chicklet-selected", true);
      } else if ($nextSelectedChickletEl.length > 0) {
        var $nextChickletEl = $($nextSelectedChickletEl[$nextSelectedChickletEl.length - 1]);
        $nextChickletEl.next(".typeahead-chicklet-item").attr("chicklet-selected", true);
        $prevSelectedChickletEl.attr("chicklet-selected", false);
      } else if ($prevSelectedChickletEl.length > 0) {
        var $prevChickletEl = $($prevSelectedChickletEl[$prevSelectedChickletEl.length - 1]);
        $prevChickletEl.attr("chicklet-selected", false);
      }
    },
    focusChickletItem: function($element) {
      if ($element.length > 0) {
        if ($element.hasClass("typeahead-chicklet-item")) {
          $element.trigger("focus");
        } else if ($element.hasClass("typeahead-search")) {
          $element.find(".typeahead-search-text-field").trigger("focus");
        }
      }
    },
    onTypeaheadFocusFirst: function() {
      var $chickletElItems = this.ui.typeaheadChickletItems.find("li");
      this.focusChickletItem($chickletElItems.first());
    },
    onTypeaheadFocusLast: function() {
      var $chickletElItems = this.ui.typeaheadChickletItems.find("li");
      this.focusChickletItem($chickletElItems.last());
    },
    onTypeaheadFocusPrev: function(event) {
      var $chickletEl = $(event.target).closest("li");
      this.focusChickletItem($chickletEl.prev());
    },
    onTypeaheadFocusNext: function(event) {
      var $chickletEl = $(event.target).closest("li");
      this.focusChickletItem($chickletEl.next());
    },
    onTypeaheadChickletClick: function(event) {
      if (!this.isChickletSelectionEnabled()) {
        return;
      }
      var $chickletEl = $(event.target).closest("li");
      if (event.ctrlKey === true) {
        if ($chickletEl.attr("chicklet-selected") === "true") {
          $chickletEl.attr("chicklet-selected", false);
          delete this.$clickedChickletEl;
        } else {
          this.getChickletElement(event, true);
        }
      } else if (event.shiftKey === true) {
        if (!this.$clickedChickletEl) {
          this.getChickletElement(event, true);
        }
        var startIndex, endIndex, chickletIndex = $chickletEl.index(), $chickletElItems = this.ui.typeaheadChickletItems.find(".typeahead-chicklet-item"), clickedChickletIndex = this.$clickedChickletEl.index();
        if (clickedChickletIndex > chickletIndex) {
          startIndex = chickletIndex;
          endIndex = clickedChickletIndex + 1;
        } else if (clickedChickletIndex < chickletIndex) {
          startIndex = clickedChickletIndex;
          endIndex = chickletIndex + 1;
        }
        $chickletElItems.attr("chicklet-selected", false);
        $chickletElItems.slice(startIndex, endIndex).attr("chicklet-selected", true);
      } else {
        this.onTypeaheadUnselectItemsAll();
        this.getChickletElement(event, true);
      }
    },
    onTypeaheadListitemKeydown: function(event, model, isChicklet) {
      var self = this, selectCurrentItem = isChicklet ? true : false;
      if (event.ctrlKey === true) {
        switch (event.which) {
         case 32:
          if (self.typeaheadView.isReorderDisabled()) {
            return;
          }
          if ($(event.target).hasClass("typeahead-chicklet-item")) {
            this.keyboardReorderMode = true;
            $(event.target).addClass("reorder-select");
          } else {
            return;
          }
          break;

         case 65:
          if (this.isChickletSelectionEnabled()) {
            this.onTypeaheadSelectItemsAll(event);
          }
          break;

         case 88:
          if (this.isChickletSelectionEnabled()) {
            this.typeaheadView.onCutChicklets(event, model);
          }
          break;

         case 86:
          if (this.isChickletSelectionEnabled()) {
            var clipboardDataExist = false;
            if (self.typeaheadView.getClipboardData().copiedModels) {
              clipboardDataExist = true;
            }
            this.typeaheadView.onPasteChicklets(event, model);
            if (!clipboardDataExist) {
              return;
            }
          }
          break;

         default:
          return;
        }
        event.stopPropagation();
        event.preventDefault();
      } else if (event.shiftKey === true) {
        switch (event.which) {
         case 33:
         case 36:
          if (this.isChickletSelectionEnabled()) {
            this.onTypeaheadSelectItemsPrevAll(event, selectCurrentItem);
          }
          break;

         case 34:
         case 35:
          if (this.isChickletSelectionEnabled()) {
            this.onTypeaheadSelectItemsNextAll(event, selectCurrentItem);
          }
          break;

         case 37:
          if (this.isChickletSelectionEnabled()) {
            this.onTypeaheadSelectItemsPrev(event, selectCurrentItem);
          }
          break;

         case 39:
          if (this.isChickletSelectionEnabled()) {
            this.onTypeaheadSelectItemsNext(event, selectCurrentItem);
          }
          break;

         default:
          return;
        }
        event.stopPropagation();
        event.preventDefault();
      } else {
        if (this.keyboardReorderMode) {
          var preElem = self.currentFocusElem;
          switch (event.which) {
           case 33:
           case 36:
            self._moveItemToFirst(preElem);
            break;

           case 34:
           case 35:
            self._moveItemToLast(preElem);
            break;

           case 37:
            self._moveItemLeft(preElem);
            break;

           case 39:
            self._moveItemRight(preElem);
            break;

           case 27:
            self._revertItemMove(preElem);
            break;

           case 13:
            self._commitItemMove(preElem);
            break;

           case 9:
            break;

           case 46:
            break;

           default:
            return;
          }
        } else {
          switch (event.which) {
           case 33:
           case 36:
            this.onTypeaheadFocusFirst(event);
            break;

           case 34:
           case 35:
            this.onTypeaheadFocusLast(event, selectCurrentItem);
            break;

           case 37:
            this.onTypeaheadFocusPrev(event, selectCurrentItem);
            break;

           case 39:
            this.onTypeaheadFocusNext(event, selectCurrentItem);
            break;

           case 13:
           case 32:
            this.onTypeaheadUnselectItemsAll();
            this.getChickletElement(event, true);
            break;

           case 46:
            this.removeChickletByModel(model, true);
            break;

           case 40:
            this.focusChildElement(event);
            break;

           case 27:
            this.onTypeaheadUnselectItemsAll();
            break;

           default:
            return;
          }
        }
        event.stopPropagation();
        event.preventDefault();
      }
    },
    getChickletElement: function(event, updateSelectFlag) {
      var $chickletEl = $(event.target).closest("li");
      if (updateSelectFlag && $chickletEl.attr("chicklet-selected") !== "true") {
        $chickletEl.attr("chicklet-selected", true);
        this.$clickedChickletEl = $chickletEl;
      }
      return $chickletEl;
    },
    checkBlurEventOnReorder: function(event) {
      if (this.keyboardReorderMode && event.relatedTarget) {
        var $target = $(event.currentTarget), $relatedTarget = $(event.relatedTarget);
        if (!$relatedTarget.is($target)) {
          var $event = $.Event("keydown");
          $event.which = 27;
          $target.trigger($event);
        }
      }
    },
    onReorder: function() {
      this.typeaheadView.clearClipboard();
    },
    attachDragListeners: function(childView) {
      if (this.typeaheadView.isReorderDisabled()) {
        return;
      }
      var self = this, subItem = childView.$el, removeDragLine = function() {
        self.$el.find(".chicklet-drag-line").remove();
        delete self._dropAfter;
      };
      subItem.on("dragstart", function(event) {
        self._dragData = {
          sourceKey: self._getItemKey($(event.currentTarget))
        };
        event.originalEvent.dataTransfer.setData("text", "");
      });
      subItem.on("dragend", function(event) {
        event.preventDefault();
        removeDragLine();
        delete self._dragData;
      });
      subItem.on("dragleave", function() {
        removeDragLine();
      });
      subItem.on("dragover", function(event) {
        if ($(event.currentTarget).hasClass("typeahead-search")) {
          return;
        }
        if (!self._dragData || self._dragData.sourceKey === undefined) {
          return;
        }
        event.preventDefault();
        var blankChicklet = $('<div class="chicklet-drag-line"></div>');
        var w = $(event.currentTarget).width();
        if (event.offsetX > w / 2) {
          if (self._dropAfter === undefined || self._dropAfter === false) {
            removeDragLine();
            $(event.currentTarget).after(blankChicklet);
            self._dropAfter = true;
          }
        } else {
          if (self._dropAfter === undefined || self._dropAfter === true) {
            removeDragLine();
            $(event.currentTarget).before(blankChicklet);
            self._dropAfter = false;
          }
        }
      });
      subItem.on("drop", function(event) {
        self.onTypeaheadUnselectItemsAll();
        if (!self._dragData || self._dragData.sourceKey === undefined) {
          return;
        }
        var sourceKey = self._dragData.sourceKey, targetKey = self._getItemKey($(event.currentTarget)), sourceModel = self.collection.get(sourceKey), targetModel = self.collection.get(targetKey), sourceIndex = self.collection.indexOf(sourceModel), targetIndex = self.collection.indexOf(targetModel);
        event.preventDefault();
        if (self._dropAfter === true) {
          targetIndex++;
        }
        if (sourceIndex < targetIndex) {
          targetIndex--;
        }
        if (sourceIndex === targetIndex) {
          return;
        }
        self.collection.remove(sourceModel);
        self.collection.add(sourceModel, {
          at: targetIndex
        });
        self.onReorder(sourceModel);
        removeDragLine();
      });
    },
    _getItemKey: function(el) {
      return el.attr("data-d2-key");
    },
    _getFirstElement: function() {
      return this.$el.find(".typeahead-chicklet-item:first");
    },
    _getLastElement: function() {
      return this.$el.find(".typeahead-chicklet-item:last");
    },
    _moveItemToFirst: function(preElem) {
      preElem.insertBefore(this._getFirstElement());
      preElem.trigger("focus");
    },
    _moveItemToLast: function(preElem) {
      preElem.insertAfter(this._getLastElement());
      preElem.trigger("focus");
    },
    _moveItemLeft: function(preElem) {
      var prev = preElem.prev(".typeahead-chicklet-item");
      if (prev.length > 0) {
        preElem.insertBefore(prev);
      }
      preElem.trigger("focus");
    },
    _moveItemRight: function(preElem) {
      var next = preElem.next(".typeahead-chicklet-item");
      if (next.length > 0) {
        preElem.insertAfter(next);
      }
      preElem.trigger("focus");
    },
    _revertItemMove: function(preElem) {
      delete this.keyboardReorderMode;
      preElem.removeClass("reorder-select");
      var sourceModel = this.collection.get(this._getItemKey(preElem)), idx = this.collection.indexOf(sourceModel), parent = preElem.parent();
      preElem.detach();
      if (idx === 0) {
        preElem.prependTo(parent);
      } else {
        var positionElem = parent.find(".typeahead-chicklet-item:nth-child(" + idx + ")");
        preElem.insertAfter(positionElem);
      }
      preElem.trigger("focus");
    },
    _commitItemMove: function(preElem) {
      delete this.keyboardReorderMode;
      preElem.removeClass("reorder-select");
      var sourceModel = this.collection.get(this._getItemKey(preElem)), idx = this.ui.typeaheadChickletItems.find(".typeahead-chicklet-item").index(preElem);
      this.collection.remove(sourceModel);
      this.collection.add(sourceModel, {
        at: idx
      });
      this.onReorder(sourceModel);
      preElem.trigger("focus");
    },
    _onChickletFocus: function(event) {
      this.currentFocusElem = $(event.target);
    },
    _onChickletBlur: function(event) {
      this.checkBlurEventOnReorder(event);
    },
    isChickletSelectionEnabled: function() {
      return this.$el.hasClass("chicklet-select-enabled");
    }
  });
  return TypeaheadChickletsView;
});