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
          this.activeChild = null;
          var searchInput = this.$el.find(".d2-facet-search-input");
          if (searchInput && !searchInput.hasClass("binf-hidden")) {
            this.onSearchClick();
          }
        }
        break;

       case 13:
        this.execute(this.activeChild);
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
        if (this.activeChild && this.$el.hasClass("csui-focus")) {
          retVal = this.tab(event.shiftKey);
          break;
        }
        retVal = true;
        break;

       default:
        retVal = true;
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
      if (activeChild.hasClass("csui-focus")) {
        switch (activeChild) {
         case this.ui.facetHeaderIcon:
          if (this.ui.facetHeader.hasClass("binf-disabled")) {
            break;
          }
          activeChild.trigger("click");
          if (this.ui.facetHeaderIcon.hasClass("icon-expandArrowDown")) {
            this.trigger("escape:focus");
            this.activeChild = this.getActiveChild();
          } else {
            activeChild.addClass("csui-focus");
          }
          break;

         default:
          var inputField = activeChild.find("input");
          if (inputField.length) {
            if (inputField.is(":checkbox") || inputField.is(":radio")) {
              inputField.trigger("click");
            } else {
              inputField.trigger("focus");
            }
          } else {
            activeChild.trigger("click");
          }
          this.activateChild(activeChild);
        }
      } else {
        this.activateChild(activeChild);
      }
    },
    tab: function(shiftTab) {
      var facets = this.$el.find(".d2-facet-item:not(.binf-hidden):not(.d2-topic-hidden)");
      if (this.activeChild.hasClass("csui-focus")) {
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
      this.activeChild.trigger("focus");
      this.prevChild = this.activeChild;
    },
    getActiveChild: function() {
      this.activeChild = $(this.$el.find(".d2-facet-content:not(.binf-hidden) .d2-facet-item:not(.binf-hidden) , .d2-facet-search:not(.binf-hidden) .d2-facet-search-icon")[0]);
      if (!this.activeChild.length) {
        if (this.ui.facetHeaderIcon.hasClass("icon-expandArrowDown")) {
          this.activeChild = this.ui.facetHeaderIcon;
        }
      }
      return this.activeChild;
    },
    _getNextActiveChild: function(facets) {
      var nextChild = this.activeChild;
      var activeChildId = $(this.activeChild).attr("id");
      var nextChildIndex;
      $.each(facets, function(index, element) {
        var eid = $(element).attr("id");
        if (eid === activeChildId || "more-" + eid === activeChildId || "less-" + eid === activeChildId) {
          if (index < facets.length) {
            nextChildIndex = index + 1;
          } else {
            nextChildIndex = index;
          }
        }
      });
      switch (this.activeChild[0]) {
       case this.ui.facetHeaderIcon[0]:
        if (this.ui.facetHeaderIcon.hasClass("icon-expandArrowUp")) {
          nextChild = $(facets[0]);
        }
        break;

       case this.ui.facetSearchIcon[0]:
        nextChild = this.ui.facetHeaderIcon;
        break;

       default:
        var more = $(this.activeChild).find("div.d2-filter-more.more:not(.binf-hidden)")[0];
        var less = $(this.activeChild).find("div.d2-filter-more.less:not(.binf-hidden)")[0];
        if (more) {
          nextChild = $(more);
        } else if (less) {
          nextChild = $(less);
        } else if (nextChildIndex === facets.length) {
          nextChild = this.ui.facetHeaderIcon;
        } else {
          nextChild = $(facets[nextChildIndex]);
        }
      }
      return nextChild;
    },
    _getPrevActiveChild: function(facets) {
      var prevChild = this.activeChild;
      var activeChildId = $(this.activeChild).attr("id");
      var prevChildIndex = -1;
      $.each(facets, function(index, element) {
        var eid = $(element).attr("id");
        if (eid === activeChildId) {
          if (index > 0) {
            prevChildIndex = index - 1;
          }
        } else if ("more-" + eid === activeChildId || "less-" + eid === activeChildId) {
          prevChildIndex = index;
        }
      });
      switch (this.activeChild[0]) {
       case this.ui.facetHeaderIcon[0]:
        if (this.ui.facetSearchIcon.is(":visible")) {
          prevChild = this.ui.facetSearchIcon;
        } else {
          prevChild = null;
        }
        break;

       default:
        if (prevChildIndex === -1) {
          prevChild = this.ui.facetHeaderIcon;
        } else {
          prevChild = $(facets[prevChildIndex]);
        }
      }
      return prevChild;
    }
  };
  return KeyEventNavigation;
});