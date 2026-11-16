/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "smart/utils/smart.base" ], function(_, $, smartBase) {
  "use strict";
  var KeyEventNavigation = {
    isTabable: function() {
      if (smartBase.isVisibleInWindowViewport(this.ui.pageSizeMenu) || smartBase.isVisibleInWindowViewport(this.ui.navPagingMenu)) {
        this.focusedElement = this.ui.dropDownMenu.is(":visible") ? this.ui.dropDownMenu : this.ui.navPagingMenu.find("ul li:first-child a");
        return true;
      }
    },
    currentlyFocusedElement: function() {
      var activeChild = this.getActiveChild();
      return activeChild;
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode, continueEvent = true, activeChild = this.getActiveChild();
      this.activeChild || (this.activeChild = this.focusedElement);
      if (event.altKey && (keyCode > 36 && keyCode < 41)) {
        if (activeChild !== this.ui.dropDownMenu) {
          event.stopPropagation();
        } else {
          if (keyCode === 37 || keyCode === 39) {
            event.stopPropagation();
          }
        }
        event.preventDefault();
      }
      switch (keyCode) {
       case 32:
       case 13:
        if (this.activeChild === this.ui.dropDownMenu) {
          event.stopPropagation();
          event.preventDefault();
          $(event.target).trigger("click");
          continueEvent = true;
        }
        this.executeAction(this.activeChild, event);
        break;

       case 9:
        if (this.activeChild !== this.focusedElement) {
          this.ui.dropDownMenu.attr("tabindex", "-1");
          this.activeChild.attr("tabindex", "0");
        } else {
          this.ui.dropDownMenu.attr("tabindex", "0");
        }
        break;

       case 39:
       case 40:
        var nextChild = this._getNextActiveChild();
        if (activeChild === this.ui.dropDownMenu && keyCode === 40) {
          break;
        }
        nextChild && this.setNextActiveChild(nextChild);
        break;

       case 37:
       case 38:
        var prevChild = this._getPrevActiveChild();
        if (prevChild === this.ui.dropDownMenu && keyCode === 38) {
          break;
        }
        this.activeChild.attr("tabindex", "-1");
        this.setNextActiveChild(prevChild);
        break;

       case 36:
        this._activateHomeElem();
        continueEvent = false;
        break;

       case 35:
        this._activateEndElem();
        continueEvent = false;
        break;
      }
      return continueEvent;
    },
    executeAction: function(activeChild, e) {
      e.stopPropagation();
      e.preventDefault();
      if (activeChild) {
        const pageId = activeChild.attr("data-pageid"), nextPageMenu = activeChild.attr("data-slidepage");
        if (e && pageId && nextPageMenu) {
          e.currentTarget = activeChild;
          this.onPageControlClick(e);
        } else if (nextPageMenu) {
          var pageMenu = parseInt(nextPageMenu, 10);
          this.slidePageMenu(pageMenu);
          this.activeChild = this.ui.navPagingMenu.find("a").first();
          this.activateChild(true, this.activeChild);
        } else if (pageId) {
          var pageNum = parseInt(pageId, 10);
          this.changePage(pageNum);
          this.activeChild.removeClass("csui-acc-focusable-active");
        }
      }
    },
    activateChild: function(setActive, activeChild) {
      activeChild || (activeChild = this.getActiveChild());
      if (setActive) {
        activeChild.addClass("csui-acc-focusable-active");
        activeChild.trigger("focus");
      } else {
        activeChild.removeClass("csui-acc-focusable-active");
      }
    },
    setActiveChild: function(child) {
      this.activeChild = child;
    },
    getActiveChild: function() {
      this.activeChild || (this.activeChild = this.ui.dropDownMenu.is(":visible") ? this.ui.dropDownMenu : this.ui.navPagingMenu.find("ul li:first-child a"));
      return this.activeChild;
    },
    setNextActiveChild: function(nextChild) {
      if (nextChild !== this.activeChild) {
        this.activateChild(false, this.activeChild);
        this.activateChild(true, nextChild);
        this.activeChild = nextChild;
      }
    },
    resetActiveChild: function() {
      var activeChild = this.activeChild;
      this.activateChild(false);
      this.activeChild = null;
      if (activeChild) {
        var pageId = activeChild.attr("data-pageid");
        var pageMenu = activeChild.attr("data-slidepage");
        if (pageId) {
          this.activeChild = this._updatedChildPosition(pageId, activeChild);
        } else if (pageMenu && this.numSlideMenus > 1) {
          var nextPageTab = activeChild.parent().prev();
          if (nextPageTab.length > 0) {
            nextPageTab = nextPageTab.find("a");
          } else {
            nextPageTab = activeChild.parent().next().find("a");
          }
          pageId = nextPageTab.attr("data-pageid");
          this.activeChild = this._updatedChildPosition(pageId, nextPageTab);
        }
      }
      if (smartBase.isVisibleInWindowViewport(this.ui.pageSizeMenu) || smartBase.isVisibleInWindowViewport(this.ui.navPagingMenu)) {
        this.focusedElement = this.ui.dropDownMenu.is(":visible") ? this.ui.dropDownMenu : this.ui.navPagingMenu.find("ul li:first-child a");
        this.activeChild || (this.activeChild = this.focusedElement);
      }
    },
    _updatedChildPosition: function(pageId, activeChild) {
      pageId = parseInt(pageId, 10);
      if (this.totalCount > this.pageSize) {
        var numPages = this.numPages - 1;
        pageId = pageId > numPages ? numPages : pageId;
        var pageMenu = Math.floor(pageId / this.pageTabsPerMenu);
        if (pageMenu > 0) {
          this._initializePageTabMenu(true, true, pageMenu);
        }
        pageId += "";
        activeChild = _.find(this.ui.navPagingMenu.find("a"), function(child) {
          return $(child).attr("data-pageid") === pageId;
        });
        return $(activeChild);
      }
      return null;
    },
    _getPrevActiveChild: function() {
      var nextChild = this.focusedElement, activeChild = this.activeChild, activeEle = $(document.activeElement);
      var nextSibling = activeChild.parent().prev().find("a");
      if (!activeEle.is(activeChild)) {
        nextSibling = activeEle.parent().prev().find("a");
      }
      if (nextSibling.length > 0) {
        nextChild = nextSibling;
        if (!activeEle.hasClass("binf-dropdown-toggle") && activeEle.attr("tabindex") === "0") {
          activeEle.attr("tabindex", "-1");
          this.ui.dropDownMenu.attr("tabindex", "0");
        }
      }
      return nextChild;
    },
    _getNextActiveChild: function() {
      var nextChild = this.focusedElement, activeChild = this.activeChild, activeEle = $(document.activeElement);
      var nextSibling = activeChild.parent().next().find("a");
      if (!activeEle.is(activeChild)) {
        nextSibling = activeEle.parent().next().find("a");
      }
      if (nextSibling.length > 0) {
        nextChild = nextSibling;
        if (!activeEle.hasClass("binf-dropdown-toggle") && activeEle.attr("tabindex") === "0") {
          activeEle.attr("tabindex", "-1");
          this.ui.dropDownMenu.attr("tabindex", "0");
        }
      } else if (activeEle.hasClass("smart-dropdown-toggle")) {
        nextChild = this.ui.navPagingMenu.find("a").first();
      } else {
        nextChild = null;
      }
      return nextChild;
    },
    _activateHomeElem: function() {
      this.activeChild.attr("tabindex", "-1");
      this.activeChild = this._getFirstElem();
      this.activateChild(true, this.activeChild);
    },
    _activateEndElem: function() {
      this.activeChild.attr("tabindex", "-1");
      this.activeChild = this._getLastElem();
      this.activateChild(true, this.activeChild);
    },
    _getLastElem: function() {
      if (this.ui.dropDownMenu.parent().hasClass("binf-open")) {
        return this.$el.find(".binf-dropdown ul > li:last-child > a ");
      }
      return this.ui.navPagingMenu.find("a").last();
    },
    _getFirstElem: function() {
      if (this.ui.dropDownMenu.parent().hasClass("binf-open")) {
        return this.$el.find(".binf-dropdown ul > li:first-child > a ");
      }
      return this.ui.navPagingMenu.find("a").first();
    }
  };
  return KeyEventNavigation;
});