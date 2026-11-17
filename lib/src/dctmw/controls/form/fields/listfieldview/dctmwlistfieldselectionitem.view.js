/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/themes/theming", "csui/lib/alpaca/js/alpaca.lite", "dctmw/utils/icons/dctmw.jato.action.icons", "dctmw/utils/utils", "hbs!dctmw/controls/form/impl/dctmwlist/dctmwlistfieldselection.item.view", "i18n" ], function(_, $, Backbone, Marionette, theming, Alpaca, JatoActionIcons, utils, SelectionItemViewTemplate, i18n) {
  "use strict";
  return Marionette.ItemView.extend({
    template: SelectionItemViewTemplate,
    tagName: "li",
    attributes: function() {
      return {
        "data-key": this.model.get("id")
      };
    },
    ui: {
      selelectedClose: ".dctmw-icon-selected-close"
    },
    events: {
      "click @ui.selelectedClose": "removeSelectedOptions",
      click: "onClickItem",
      keydown: "onKeyDownItem",
      keyup: "onKeyUpItem"
    },
    templateHelpers: function() {
      return {
        isJato: theming.isJATOTheme(),
        removeSVG: JatoActionIcons.actionCloseSmall,
        actionDragSVG: JatoActionIcons.actionDragHandle,
        isSortable: !this.model.collection.isSortedResult,
        isNotReadMode: this.options.mode !== "readonly",
        showButtonInReadMode: this.options.mode === "readonly" && !this.options.showHorizontal,
        isNotShowHorizontal: !this.options.showHorizontal && !utils.isMobile(),
        showOptionsInHierarchy: this.options.showOptionsInHierarchy,
        hierarchyItemLabel: this.options.showOptionsInHierarchy && this.model.get("options")?.level ? () => {
          let labelPathString = this.model.get("options").labelPathString, isRtl = i18n && i18n.settings.rtl;
          return isRtl ? labelPathString.split("›").reverse().join("‹") : labelPathString;
        } : this.model.get("name")
      };
    },
    className: function() {
      var className = "";
      if (this.model.get("invalid")) {
        className = className + " dctmw-invalid-option";
      }
      return className;
    },
    constructor: function(options) {
      this.validateSearchText(options);
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      if (this.options.showOptionsInHierarchy && this.$el && this.$el[0]) {
        let html = this.$el[0].innerHTML;
        html = html.replaceAll("›", '<span style="font-size: 16px"> › </span>');
        html = html.replaceAll("‹", '<span style="font-size: 16px"> ‹ </span>');
        this.$el[0].innerHTML = html;
      }
    },
    removeSelectedOptions: function(event) {
      event.stopPropagation();
      event.preventDefault();
      if (!this.model.collection.disabled) {
        this.model.collection.remove(this.model);
        if (this.options.parentView.collection.length === 0) {
          this.options.parentView.hide();
        }
      }
    },
    hide: function() {
      this.$el.hide();
    },
    show: function() {
      this.$el.show();
    },
    isVisible: function() {
      this.$el.is(":visible");
    },
    getItemSelector: function() {
      return "a";
    },
    onClickItem: function(event) {
      var itemSelector = this.getItemSelector(), $chickletEl = $(event.target).children(itemSelector);
      $chickletEl.trigger("focus");
    },
    onKeyDownItem: function(event) {
      var isHorizontalView = this.options.showHorizontal, $allElItems, $currentItem, itemSelector = this.getItemSelector();
      if (this.options.parentView.keyboardReorderMode) {
        switch (event.which) {
         case 33:
         case 36:
          this.moveSelectedItemToFirstIndex(event);
          break;

         case 34:
         case 35:
          this.moveSelectedItemToLastIndex(event);
          break;

         case 37:
          if (!this.isCollectionHorizontal()) {
            return;
          }
          this.moveSelectedItemToPreviousIndex(event);
          break;

         case 39:
          if (!this.isCollectionHorizontal()) {
            return;
          }
          this.moveSelectedItemToNextIndex(event);
          break;

         case 38:
          if (this.isCollectionHorizontal()) {
            return;
          }
          this.moveSelectedItemToPreviousIndex(event);
          break;

         case 40:
          if (this.isCollectionHorizontal()) {
            return;
          }
          this.moveSelectedItemToNextIndex(event);
          break;

         case 13:
          this.commitItemMove(event);
          this.removeSelectionOnItemInKeyBoradReorderMode(event);
          this.deactivateKeyBoardReorderMode();
          break;

         case 27:
          this.revertCollectionOrderChanges(event);
          this.removeSelectionOnItemInKeyBoradReorderMode(event);
          this.deactivateKeyBoardReorderMode();
          break;

         default:
          return;
        }
      } else {
        switch (event.which) {
         case 33:
         case 36:
          $allElItems = $(event.target).closest("ul").find("li");
          $allElItems.first().find(itemSelector).trigger("focus");
          break;

         case 34:
         case 35:
          $allElItems = $(event.target).closest("ul").find("li");
          $allElItems.last().find(itemSelector).trigger("focus");
          break;

         case 37:
          if (!isHorizontalView) {
            return;
          }
          $currentItem = $(event.target).closest("li");
          $currentItem.prev().find(itemSelector).trigger("focus");
          break;

         case 39:
          if (!isHorizontalView) {
            return;
          }
          $currentItem = $(event.target).closest("li");
          $currentItem.next().find(itemSelector).trigger("focus");
          break;

         case 13:
         case 32:
          if (event.ctrlKey && this.isCollectionSortable()) {
            this.activateKeyboardReorderMode();
            this.makeItemAsSelectedForKeyBoardReordering(event);
          }
          break;

         case 46:
          var $nextItem = $(event.target).closest("li").next();
          this.removeSelectedOptions(event);
          $nextItem.find(itemSelector).trigger("focus");
          break;

         case 38:
          if (isHorizontalView) {
            return;
          }
          $currentItem = $(event.target).closest("li");
          $currentItem.prev().find(itemSelector).trigger("focus");
          event.preventDefault();
          event.stopPropagation();
          break;

         case 40:
          if (isHorizontalView) {
            return;
          }
          $currentItem = $(event.target).closest("li");
          $currentItem.next().find(itemSelector).trigger("focus");
          event.preventDefault();
          event.stopPropagation();
          break;

         case 27:
          break;

         default:
          return;
        }
      }
    },
    onKeyUpItem: function(event) {
      if (event.which === 27) {
        this.stopEventPropagation(event);
      }
    },
    isCollectionHorizontal: function() {
      return this.options.showHorizontal;
    },
    isCollectionSortable: function() {
      return this.options && this.options.parentView && this.options.parentView.collection && !this.options.parentView.collection.isSortedResult ? !this.options.parentView.collection.isSortedResult : false;
    },
    activateKeyboardReorderMode: function() {
      var documentClickEventCustomArgs = {
        listItemView: this
      };
      this.mouseClickEventForDocumentWithArgs = this.mouseClickEventForDocument.bind(documentClickEventCustomArgs);
      document.body.addEventListener("click", this.mouseClickEventForDocumentWithArgs, true);
      this.options.parentView.keyboardReorderMode = true;
    },
    deactivateKeyBoardReorderMode: function() {
      document.body.removeEventListener("click", this.mouseClickEventForDocumentWithArgs, true);
      this.options.parentView.keyboardReorderMode = false;
    },
    makeItemAsSelectedForKeyBoardReordering: function(event) {
      var currentItem = this.getEventTargetElement(event);
      var parent = currentItem.parent();
      this.previousElementForReverting = this.getPreviousElement(currentItem);
      parent.addClass("disable-mouse-events");
      currentItem.addClass("keyboard-reorder-mode").show();
      this.getItemSelectorForElement(currentItem).trigger("focus");
      this.stopEventPropagation(event);
    },
    removeSelectionOnItemInKeyBoradReorderMode: function(event) {
      var currentItem = this.getEventTargetElement(event);
      var parent = currentItem.parent();
      parent.removeClass("disable-mouse-events");
      currentItem.removeClass("keyboard-reorder-mode").show();
      this.getItemSelectorForElement(currentItem).trigger("focus");
      this.stopEventPropagation(event);
    },
    moveSelectedItemToFirstIndex: function(event) {
      var currentItem = this.getEventTargetElement(event);
      var firstItem = this.getFirstElementInParentList(currentItem);
      if (firstItem && currentItem != firstItem) {
        currentItem.insertBefore(firstItem);
      }
      this.getItemSelectorForElement(currentItem).trigger("focus");
      this.stopEventPropagation(event);
    },
    moveSelectedItemToLastIndex: function(event) {
      var currentItem = this.getEventTargetElement(event);
      var lastItem = this.getLastElementInParentList(currentItem);
      if (lastItem && currentItem != lastItem) {
        currentItem.insertAfter(lastItem);
      }
      this.getItemSelectorForElement(currentItem).trigger("focus");
      this.stopEventPropagation(event);
    },
    moveSelectedItemToPreviousIndex: function(event) {
      var currentItem = this.getEventTargetElement(event);
      var prevItem = this.getPreviousElement(currentItem);
      if (prevItem.length > 0) {
        currentItem.insertBefore(prevItem);
      } else {
        var lastItem = this.getLastElementInParentList(currentItem);
        if (lastItem) {
          currentItem.insertAfter(lastItem);
        }
      }
      this.getItemSelectorForElement(currentItem).trigger("focus");
      this.stopEventPropagation(event);
    },
    moveSelectedItemToNextIndex: function(event) {
      var currentItem = this.getEventTargetElement(event);
      var nextItem = this.getNextElement(currentItem);
      if (nextItem.length > 0) {
        currentItem.insertAfter(nextItem);
      } else {
        var firstItem = this.getFirstElementInParentList(currentItem);
        if (firstItem) {
          currentItem.insertBefore(firstItem);
        }
      }
      this.getItemSelectorForElement(currentItem).trigger("focus");
      this.stopEventPropagation(event);
    },
    revertCollectionOrderChanges: function(event) {
      var currentItem = this.getEventTargetElement(event);
      var parent = currentItem.parent();
      currentItem.detach();
      if (this.previousElementForReverting.length > 0) {
        currentItem.insertAfter(this.previousElementForReverting);
      } else {
        currentItem.prependTo(parent);
      }
      this.getItemSelectorForElement(currentItem).trigger("focus");
      this.stopEventPropagation(event);
    },
    commitItemMove: function(event) {
      var currentItem = this.getEventTargetElement(event);
      var newIndex = this.getKeyBoardReorderingSelectedItemIndex(currentItem);
      var collection = this.options.parentView.collection;
      var model = this.options.model;
      collection.remove(model, {
        silent: true
      });
      collection.add(model, {
        at: newIndex,
        silent: true
      });
      collection.trigger("selectioncollection:change", null, null, {
        valueMoved: model.get("id"),
        valueBefore: collection.at(newIndex === 0 ? false : newIndex - 1) && collection.at(newIndex === 0 ? false : newIndex - 1).get("id"),
        valueAfter: collection.at(newIndex + 1) && collection.at(newIndex + 1).get("id")
      });
      this.getItemSelectorForElement(currentItem).trigger("focus");
      this.stopEventPropagation(event);
    },
    stopEventPropagation: function(event) {
      event.preventDefault();
      event.stopPropagation();
    },
    getItemSelectorForElement: function(element) {
      return element.find(this.getItemSelector());
    },
    getEventTargetElement: function(event) {
      return $(event.target).closest("li");
    },
    getNextElement: function(element) {
      return element.next();
    },
    getPreviousElement: function(element) {
      return element.prev();
    },
    getFirstElementInParentList: function(element) {
      var parentList = element[0].parentElement;
      var firstElementInList = parentList.firstElementChild;
      return firstElementInList;
    },
    getLastElementInParentList: function(element) {
      var parentList = element[0].parentElement;
      var lastElementInList = parentList.lastElementChild;
      return lastElementInList;
    },
    getKeyBoardReorderingSelectedItem: function() {
      return $("li.keyboard-reorder-mode");
    },
    getKeyBoardReorderingSelectedItemIndex: function(element) {
      var nodes = Array.from(element[0].parentElement.children);
      var index = nodes.indexOf(element[0]);
      return index;
    },
    mouseClickEventForDocument: function() {
      var listItemView = this.listItemView;
      if (listItemView.options.parentView.keyboardReorderMode) {
        var selectedItem = listItemView.getKeyBoardReorderingSelectedItem();
        var revertChangesKeyDownEvent = $.Event("keydown");
        revertChangesKeyDownEvent.which = 27;
        $(selectedItem).trigger(revertChangesKeyDownEvent);
      }
    },
    validateSearchText: function(options) {
      var model = options?.model, fieldDataType = options?.parentView?.options?.parentView?.alpacaField?.options?._type, optionValue = model?.get("id");
      if (fieldDataType && optionValue) {
        if (fieldDataType === "double" || fieldDataType === "integer") {
          var validNumber = Alpaca.testRegex(Alpaca.regexps.number, optionValue);
          if (!validNumber || isNaN(optionValue)) {
            model.set({
              invalid: true,
              invalidType: true
            });
          }
        }
      }
    }
  });
});