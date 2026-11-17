/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/log", "nuc/lib/marionette" ], function(module, _, $, log, Marionette) {
  "use strict";
  var TabPosition = {
    none: -1,
    search: 0,
    open_perspective: 1,
    close_search: 1,
    list: 2
  };
  function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }
  return Marionette.Behavior.extend({
    constructor: function ListViewKeyboardBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      view.keyboardBehavior = this;
      this.tabableElements = [];
      var self = this;
      this.listenTo(view, "show", function() {
        self.refreshTabableElements(view);
      });
      this.listenTo(view, "childview:click:item childview:click:tree:header", function(item) {
        var selIndex = view.selectedIndex;
        var selectedElem = view.getElementByIndex(selIndex);
        selectedElem && selectedElem.prop("tabindex", "-1");
        view.currentTabPosition = TabPosition.list;
        view.selectedIndex = view.collection.indexOf(item.model);
        selectedElem = view.getElementByIndex(view.selectedIndex);
        selectedElem && selectedElem.prop("tabindex", "0");
      });
      this.listenTo(view, "change:filterValue", function() {
        self.refreshTabableElements(view);
      });
      this.listenTo(view, "before:collection:scroll:fetch", function() {
        view._beforeCollectionScrollFetch();
      });
      this.listenTo(view, "collection:scroll:fetch", function() {
        view._afterCollectionScrollFetch();
      });
      _.extend(view, {
        _focusSearchButton: function(event) {
          this.currentTabPosition = TabPosition.search;
          var shiftTab = event && event.shiftKey;
          if (this._isSearchInputVisible()) {
            return $(this.ui.searchInput);
          }
        },
        _focusOnSearchButton: function(event) {
          this.currentTabPosition = TabPosition.search;
          if (this._isSearchInputVisible()) {
            return $(this.ui.smartSearchBtn[0].innerInputField);
          } else {
            return $(this.ui.smartSearchBtn);
          }
        },
        _isSearchInputVisible: function() {
          return this.ui.smartSearchBtn[0]?.hasAttribute("isopen");
        },
        _isOpenPerspectiveButtonFocusable: function() {
          return this.ui.openPerspectiveButton.css && this.ui.openPerspectiveButton.hasClass("cs-open-perspective-button") && this.ui.openPerspectiveButton.css("display") !== "none";
        },
        _focusOpenPerspectiveButton: function() {
          this.currentTabPosition = TabPosition.open_perspective;
          return $(this.ui.openPerspectiveButton);
        },
        _focusCloseSearchButton: function() {
          this.currentTabPosition = TabPosition.close_search;
          return $(this.ui.smartSearchInput);
        },
        _focusList: function(event) {
          this.currentTabPosition = TabPosition.list;
          if (this.selectedIndex < 0 || this.selectedIndex > this.collection.length - 1) {
            this.selectedIndex = 0;
          }
          return this.getElementByIndex(this.selectedIndex, event);
        },
        currentlyFocusedElement: function(event) {
          if (this.isDestroyed) {
            return this.$el;
          }
          var currentTabPosition = this._getCurrentTabPosition();
          if (_.isUndefined(currentTabPosition) || currentTabPosition === TabPosition.none) {
            if (event && event.shiftTab) {
              currentTabPosition = TabPosition.list;
            } else {
              if (!this.hideSearch) {
                currentTabPosition = TabPosition.search;
              } else {
                currentTabPosition = TabPosition.open_perspective;
              }
            }
          }
          return this._setFocusAtTabPosition(currentTabPosition);
        },
        _setFocusAtTabPosition: function(tabPosition) {
          switch (tabPosition) {
           case TabPosition.search:
            return this._focusSearchButton();

           case TabPosition.open_perspective:
            return this._focusOpenPerspectiveButton();

           case TabPosition.list:
            return this._focusList();
          }
        },
        isMoreActionsDropdownOpen: function() {
          return this.$el.find(".csui-table-cell-name-appendix .csui-table-actionbar" + " .binf-dropdown-menu").is(":visible");
        },
        _isSearchInFocus: function() {
          return document.activeElement.classList.contains("smart-list-search");
        },
        _isOpenPerspectiveButtonInFocus: function() {
          return this.currentTabPosition === TabPosition.title || this.ui.headerTitle.is(":focus");
        },
        _isSearchButtonVisible: function() {
          return !this.ui.smartSearchBtn[0]?.hasAttribute("isopen");
        },
        _isSearchButtonFocusable: function() {
          return this._isSearchButtonVisible();
        },
        _beforeCollectionScrollFetch: function() {
          this.selectedIndexInFocus = false;
          if (this.selectedIndex >= 0 && this.selectedIndex < this.collection.length) {
            var $elem = this.getElementByIndex(this.selectedIndex);
            if ($elem && $elem.is(":focus")) {
              $elem.prop("tabindex", "-1");
              this.selectedIndexInFocus = true;
            }
          }
        },
        _afterCollectionScrollFetch: function() {
          if (this.selectedIndexInFocus === true && this.selectedIndex >= 0 && this.selectedIndex < this.collection.length) {
            setTimeout(this._setFocusToListElement.bind(this, this.selectedIndex), 100);
          }
        },
        _setFocusToListElement: function(selectedIndex) {
          var $elem = this.getElementByIndex(selectedIndex);
          if ($elem) {
            $elem.prop("tabindex", "0");
            $elem.focus();
          }
        },
        _moveTo: function(event, $elem, $preElem) {
          stopEvent(event);
          this.trigger("before:keyboard:change:focus");
          $preElem && $preElem.prop("tabindex", "-1");
          $elem && $elem.prop("tabindex", "0");
          $elem && $elem.trigger("focus");
          this.trigger("changed:focus");
          this.trigger("after:keyboard:change:focus");
        },
        onKeyInView: function(event) {
          if (event.keyCode === 9) {
            this._onTabKey(event);
          } else if (event.keyCode === 32 || event.keyCode === 13) {
            if (event.target.closest(".tile-content")) {
              this._onEnterOrSpace(event);
            }
          }
        },
        _onTabKey: function(event) {
          if (this._isSearchInFocus() && this.ui.searchInput.is(":focus") && !!this.ui.searchInput.val().length) {
            return;
          }
          this._moveToTabPosition(event, this._getNextTabPosition(event));
        },
        _isListFocusable: function() {
          return this.collection && this.collection.length > 0;
        },
        _getCurrentTabPosition: function() {
          var curPos = this.currentTabPosition;
          if (this._isSearchInFocus()) {
            curPos = TabPosition.search;
          } else if (this._isOpenPerspectiveButtonInFocus()) {
            curPos = TabPosition.open_perspective;
          } else if (this._isSearchInputInFocus()) {
            curPos = TabPosition.close_search;
          }
          return curPos;
        },
        _isTabPositionFocusable: function(tabPosition) {
          switch (tabPosition) {
           case TabPosition.list:
            return this._isListFocusable();

           case TabPosition.open_perspective:
            return this._isOpenPerspectiveButtonFocusable();

           case TabPosition.search:
            return this._isSearchButtonFocusable();
          }
          return false;
        },
        _isSearchInputInFocus: function() {
          return document.activeElement.classList.contains("smart-list-search-input");
        },
        _getFirstTabPosition: function() {
          return !this.hideSearch ? TabPosition.search : TabPosition.open_perspective;
        },
        _getLastTabPosition: function() {
          return TabPosition.list;
        },
        _getValidTabPosition: function(curPos, shiftKey) {
          var i, firstTabPosition = this._getFirstTabPosition(), lastTabPosition = this._getLastTabPosition();
          if (shiftKey) {
            for (i = lastTabPosition; i >= firstTabPosition; i--) {
              if (curPos === i && !this._isTabPositionFocusable(i)) {
                curPos--;
              }
            }
          } else {
            for (i = firstTabPosition; i <= lastTabPosition; i++) {
              if (curPos === i && !this._isTabPositionFocusable(i)) {
                curPos++;
              }
            }
          }
          if (curPos < firstTabPosition || curPos > lastTabPosition) {
            return TabPosition.none;
          }
          return curPos;
        },
        _getNextTabPosition: function(event) {
          var curPos = this._getCurrentTabPosition(), shiftKey = event.shiftKey;
          if (curPos === TabPosition.none) {
            return;
          }
          shiftKey ? curPos-- : curPos++;
          return this._getValidTabPosition(curPos, shiftKey);
        },
        _moveToTabPosition: function(event, curPos) {
          var func;
          switch (curPos) {
           case TabPosition.search:
            func = this._focusSearchButton;
            break;

           case TabPosition.open_perspective:
            if (!this._isSearchInputVisible()) {
              func = this._focusOpenPerspectiveButton;
            }
            break;

           case TabPosition.list:
            func = this._focusList;
            break;
          }
          if (this._canApplyFocusableFunction(event)) {
            if (func) {
              var element = func.apply(this, event);
              if (element && element.length > 0) {
                return this._moveTo(event, element);
              }
            }
          }
        },
        _canApplyFocusableFunction: function(event) {
          return !(event?.originalEvent?.composedPath()[0].tagName === "BUTTON" && event?.originalEvent?.composedPath()[3]?.classList.contains("ot-input-search__close-icon")) && !(event?.originalEvent?.composedPath()[0]?.tagName === "INPUT" && !!this.ui.searchInput.val().length);
        },
        _onEnterOrSpace: function(event) {
          stopEvent(event);
          $(event.target).trigger("click");
        },
        _onEscape: function(event) {
          if (this.isMoreActionsDropdownOpen()) {
            return false;
          } else if (this._isSearchInputInFocus()) {
            this._focusSearchButton();
          }
        },
        onKeyDown: function(event) {
          if (this._isSearchInFocus()) {
            this.onKeyInView(event);
            return;
          }
          var $preElem;
          switch (event.which) {
           case 33:
           case 36:
            $preElem = this.getElementByIndex(this.selectedIndex);
            this._moveTo(event, this._selectFirstListElement(), $preElem);
            break;

           case 34:
           case 35:
            $preElem = this.getElementByIndex(this.selectedIndex);
            this._moveTo(event, this._selectLastListElement(event), $preElem);
            break;

           case 38:
            if (this.selectedIndex > 0) {
              $preElem = this.getElementByIndex(this.selectedIndex);
              this._moveTo(event, this._selectPreviousListElement(event), $preElem);
            } else {
              stopEvent(event);
            }
            break;

           case 40:
            if (this.selectedIndex < this.collection.length - 1) {
              $preElem = this.getElementByIndex(this.selectedIndex);
              this._moveTo(event, this._selectNextListElement(), $preElem);
            } else {
              stopEvent(event);
            }
            break;

           default:
            this.onKeyInView(event);
            return;
          }
        },
        _selectFirstListElement: function() {
          this.selectedIndex = 0;
          return this.getElementByIndex(this.selectedIndex);
        },
        _selectLastListElement: function(event) {
          var focusableItem;
          var currentIndex = this.selectedIndex;
          if (currentIndex < 0 || currentIndex >= this.collection.length) {
            currentIndex = 0;
          }
          var focusableIndex = this.collection.length;
          while (focusableIndex > currentIndex && !focusableItem) {
            focusableIndex--;
            focusableItem = this.getElementByIndex(focusableIndex, event);
          }
          if (focusableItem) {
            this.selectedIndex = focusableIndex;
            return focusableItem;
          }
          return this.getElementByIndex(this.selectedIndex);
        },
        _selectNextListElement: function() {
          var focusableItem;
          var focusableIndex = this.selectedIndex;
          if (focusableIndex < 0 || focusableIndex >= this.collection.length) {
            focusableIndex = -1;
          }
          while (focusableIndex < this.collection.length - 1 && !focusableItem) {
            focusableIndex++;
            focusableItem = this.getElementByIndex(focusableIndex);
          }
          if (focusableItem) {
            this.selectedIndex = focusableIndex;
            return focusableItem;
          }
          return this.getElementByIndex(this.selectedIndex);
        },
        _selectPreviousListElement: function(event) {
          if (this.selectedIndex > 0) {
            this.selectedIndex--;
          }
          return this.getElementByIndex(this.selectedIndex, event);
        }
      });
    },
    refreshTabableElements: function(view) {
      log.debug("ListViewKeyboardBehavior::refreshTabableElements " + view.constructor.name) && console.log(log.last);
      this.view.currentTabPosition = TabPosition.none;
      this.view.selectedIndex = -1;
    }
  });
});