/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery" ], function(_, $) {
  "use strict";
  var KeyEventNavigation = {
    onKeyInView: function(event) {
      var keyCode = event.keyCode;
      var retVal = false;
      switch (keyCode) {
       case 27:
        this.trigger("escape:focus");
        if (this.activeChild) {
          this.activeChild.removeClass("csui-focus");
        }
        break;

       case 32:
       case 13:
        if (event.target == this.ui.searchInput[0]) {
          retVal = true;
        } else {
          this.execute(this.activeChild);
        }
        break;

       case 38:
       case 33:
       case 40:
       case 34:
        if (this.activeChild && this.activeChild.hasClass("csui-focus")) {
          break;
        }
        retVal = true;
        break;

       case 9:
        if (event.target == this.ui.searchInput[0] || event.shiftKey && event.target.tagName.toUpperCase() === "OTC-CHECKBOX") {
          retVal = this.handleFocusOnOtcSearch(event);
        } else {
          retVal = this.tab(event.shiftKey);
        }
        break;

       default:
        retVal = true;
      }
      return retVal;
    },
    handleFocusOnOtcSearch: function(event) {
      let retVal = true;
      let multiSelects = this.$el.find(".csui-multi-select");
      let facets = this.$el.find(".csui-facet-item:not(.binf-hidden)");
      var childViewContainers;
      if (!event.shiftKey && (event.target.value.length > 0 && event?.originalEvent?.composedPath()[3]?.classList?.contains("ot-search__startsearch-button") || event.target.value.length === 0 && event?.originalEvent?.composedPath()[0]?.classList?.contains("ot-search__searchterm-field"))) {
        childViewContainers = this.$el.find(".csui-facet-item:not(.binf-hidden)");
        if (childViewContainers.length > 0) {
          let nextChild = this._getLastFilterFocus(facets);
          this.activeChild = $(nextChild);
          this.activateChild($(nextChild[0]));
        } else if (childViewContainers.length == 0 && multiSelects.length > 0) {
          this.activeChild = this.ui.apply;
          this.activateChild(this.ui.apply);
        } else {
          this.activeChild = this.ui.facetHeaderIcon;
          this.activateChild(this.ui.facetHeaderIcon);
        }
        retVal = false;
      } else if (event.shiftKey && event?.originalEvent?.composedPath()[0]?.classList?.contains("ot-search__searchterm-field")) {
        childViewContainers = this.$el.find(".csui-facet-item:not(.binf-hidden)");
        if (this.ui.facetHeader.hasClass("binf-disabled") && multiSelects.length > 0) {
          this.activeChild = this.ui.cancel;
          this.activateChild(this.ui.cancel);
        } else {
          this.activeChild = this.ui.facetHeaderIcon;
          this.activateChild(this.ui.facetHeaderIcon);
        }
        retVal = false;
      } else if (event.shiftKey && event.target.tagName.toUpperCase() === "OTC-CHECKBOX") {
        childViewContainers = this.$el.find(".csui-facet-item:not(.binf-hidden)");
        if (this.$el.find(".smart-facet-search").length > 0) {
          this.activeChild = this.$el.find(".smart-facet-search");
          this.activateChild(this.$el.find(".smart-facet-search"));
        } else if (this.ui.facetHeader.hasClass("binf-disabled") && multiSelects.length > 0) {
          this.activeChild = this.ui.cancel;
          this.activateChild(this.ui.cancel);
        } else {
          this.activeChild = this.ui.facetHeaderIcon;
          this.activateChild(this.ui.facetHeaderIcon);
        }
        retVal = false;
      }
      return retVal;
    },
    execute: function(activeChild) {
      this.$el.addClass("csui-focus");
      if (this.$el.find(".facet-disabled").length) {
        this.onShowFacet();
      } else {
        this.setfocus(activeChild);
      }
    },
    setfocus: function(activeChild) {
      activeChild && activeChild.is(":visible") || (activeChild = this.getActiveChild());
      if (typeof activeChild?.hasClass === "function" && activeChild.hasClass("csui-focus") || activeChild[0].classList.contains("csui-focus")) {
        switch (activeChild) {
         case this.ui.facetHeaderIcon:
          if (this.ui.facetHeader.hasClass("binf-disabled")) {
            break;
          }
          activeChild[0].click();
          if (this.ui.facetHeaderIcon.hasClass("smart-icon-collapsed")) {
            activeChild.removeClass("csui-focus");
            this.trigger("escape:focus");
            this.activeChild = this.getActiveChild();
          } else {
            activeChild.addClass("csui-focus");
            activeChild[0].querySelector(".smart-caret-up").focus();
          }
          break;

         case this.ui.apply:
         case this.ui.cancel:
          activeChild[0].click();
          this.trigger("escape:focus");
          this.activeChild = undefined;
          break;

         case this.ui.facetMore:
          activeChild[0].click();
          if (activeChild === this.ui.facetMore) {
            this.activateChild(activeChild);
          }
        }
      } else {
        this.activateChild(activeChild);
      }
    },
    tab: function(shiftTab) {
      var facets = this.$el.find(".csui-facet-item:not(.binf-hidden)");
      if (this.activeChild && this.activeChild.hasClass("csui-focus")) {
        if (shiftTab) {
          this.activeChild = this._getPrevActiveChild(facets);
        } else {
          this.activeChild = this._getNextActiveChild(facets);
        }
        this.activateChild(this.activeChild);
        return false;
      }
      return true;
    },
    activateChild: function(activeChild) {
      activeChild || (activeChild = this.getActiveChild());
      if (this.prevChild) {
        this.prevChild.removeClass("csui-focus");
      }
      activeChild.addClass("csui-focus");
      if (activeChild.hasClass("smart-icon-expanded")) {
        activeChild[0].querySelector(".smart-caret-up").focus();
      } else if (activeChild.hasClass("smart-icon-collapsed")) {
        activeChild[0].querySelector(".smart-caret-down").focus();
      } else if (activeChild.hasClass("smart-facet-search")) {
        activeChild[0].setFocus();
      } else if (activeChild.find(".csui-checkbox").length > 0) {
        activeChild.find(".csui-checkbox")[0].focus();
      } else {
        activeChild.focus();
      }
      this.prevChild = this.activeChild;
    },
    getActiveChild: function() {
      var childViewContainers = this.$el.find(".csui-facet-item:not(.binf-hidden)");
      if (!this.activeChild || !this.activeChild.is(":visible")) {
        if (this.ui.facetHeaderIcon.hasClass("smart-icon-collapsed")) {
          this.activeChild = this.ui.facetHeaderIcon;
        } else if (this.$el.find(".smart-facet-search").length > 0) {
          this.activeChild = this.$el.find(".smart-facet-search");
        } else {
          var activeChildContainer = childViewContainers[0];
          this.activeChild = $(activeChildContainer).find(".csui-checkbox");
          if (this.activeChild.length === 0) {
            this.activeChild = $(activeChildContainer).find("div[tabindex]");
          }
          this.activeChildIndex = 0;
        }
      }
      return this.activeChild;
    },
    cursorNextFilter: function(view, keyUp, target) {
      var childViewContainers = this.$el.find(".csui-facet-item:not(.binf-hidden)"), numViews = childViewContainers.length - 1;
      this.activeChildIndex = this.activeChildIndex ? this.activeChildIndex : 0;
      if (keyUp) {
        this.activeChildIndex = this.activeChildIndex === 0 ? numViews : --this.activeChildIndex;
      } else {
        this.activeChildIndex = this.activeChildIndex === numViews ? 0 : ++this.activeChildIndex;
      }
      this.activeChild = $(childViewContainers[this.activeChildIndex]).find(".csui-checkbox");
      if (!this.activeChild.length) {
        this.activeChild = $(childViewContainers[this.activeChildIndex]).find(".csui-filter-name");
      }
      this.facetListView.children.findByIndex(this.activeChildIndex).activeChild = this.activeChild;
      this.activateChild(this.activeChild);
    },
    _getLastFilterFocus: function(facets) {
      this.activeChildIndex = this.activeChildIndex ? this.activeChildIndex : 0;
      var childViewContainers = this.$el.find(".csui-facet-item:not(.binf-hidden)");
      var childIndex = this.activeChildIndex;
      this.activeChildIndex = childIndex && childIndex < facets.length ? childIndex : 0;
      var activeChild = this.facetListView.children.findByIndex(this.activeChildIndex).activeChild;
      activeChild = activeChild ? activeChild : $(childViewContainers[this.activeChildIndex]).find(".csui-checkbox");
      return activeChild;
    },
    _getNextActiveChild: function(facets) {
      var nextChild = this.activeChild;
      var multiSelects = this.$el.find(".csui-multi-select");
      switch (this.activeChild) {
       case this.ui.facetHeaderIcon:
        if (this.ui.facetHeaderIcon.hasClass("smart-icon-expanded")) {
          if (this.ui.searchInput.length > 0) {
            nextChild = this.ui.searchInput;
          } else if (facets.length > 0) {
            nextChild = this._getLastFilterFocus(facets);
          }
        }
        break;

       case this.ui.facetMore:
        if (multiSelects.length > 0) {
          nextChild = this.ui.apply;
        } else if (multiSelects.length === 0 && this.ui.facetHeaderIcon.hasClass("smart-icon-expanded")) {
          nextChild = this.ui.facetHeaderIcon;
        }
        break;

       case this.ui.cancel:
        if (multiSelects.length > 0 && !this.ui.facetHeader.hasClass("binf-disabled") && this.ui.facetHeaderIcon.hasClass("smart-icon-expanded")) {
          nextChild = this.ui.facetHeaderIcon;
        } else if (this.ui.facetHeader.hasClass("binf-disabled")) {
          if (this.ui.searchInput.length > 0) {
            nextChild = this.ui.searchInput;
          } else if (facets.length > 0) {
            nextChild = this._getLastFilterFocus(facets);
          }
        }
        break;

       case this.ui.apply:
        nextChild = this.ui.cancel;
        break;

       default:
        if (this.ui.facetMore.length > 0 && !this.ui.facetMore.parent().hasClass("binf-hidden")) {
          nextChild = this.ui.facetMore;
        } else if (multiSelects.length > 0) {
          nextChild = this.ui.apply;
        } else if (multiSelects.length === 0 && (this.ui.facetMore.length === 0 || this.ui.facetMore.parent().hasClass("binf-hidden"))) {
          nextChild = this.ui.facetHeaderIcon;
        }
      }
      return nextChild;
    },
    _getPrevActiveChild: function(facets) {
      var nextChild = this.activeChild;
      var childViewContainers = this.$el.find(".csui-facet-item:not(.binf-hidden)");
      switch (this.activeChild) {
       case this.ui.facetHeaderIcon:
        if (this.$el.find(".csui-multi-select").length > 0) {
          nextChild = this.ui.cancel;
        } else if (facets.length === 0 && this.$el.find(".smart-facet-search").length > 0) {
          nextChild = this.$el.find(".smart-facet-search");
        } else if (this.$el.find(".csui-multi-select").length === 0 && (this.ui.facetMore.length === 0 || this.ui.facetMore.parent().hasClass("binf-hidden"))) {
          nextChild = this._getLastFilterFocus(facets);
        } else if (this.$el.find(".csui-multi-select").length === 0 && this.ui.facetMore.length > 0 && !this.ui.facetMore.parent().hasClass("binf-hidden")) {
          nextChild = this.ui.facetMore;
        }
        break;

       case this.ui.facetMore:
        nextChild = this._getLastFilterFocus(facets);
        break;

       case this.ui.cancel:
        nextChild = this.ui.apply;
        break;

       case this.ui.apply:
        if (this.ui.facetMore.length > 0 && !this.ui.facetMore.parent().hasClass("binf-hidden")) {
          nextChild = this.ui.facetMore;
        } else if (childViewContainers.length === 0 && this.ui.searchInput.length > 0) {
          nextChild = this.ui.searchInput;
        } else {
          nextChild = this._getLastFilterFocus(facets);
        }
        break;

       default:
        if (this.ui.facetHeader.hasClass("binf-disabled")) {
          nextChild = this.ui.cancel;
          break;
        }
        nextChild = this.ui.facetHeaderIcon;
      }
      return nextChild;
    }
  };
  return KeyEventNavigation;
});