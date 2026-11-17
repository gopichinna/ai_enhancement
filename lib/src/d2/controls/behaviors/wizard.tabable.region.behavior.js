/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/utils/log", "nuc/utils/base", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/behaviors/keyboard.navigation/tabables.behavior" ], function(module, _, $, Marionette, log, base, TabableRegionBehavior, TabablesBehavior) {
  "use strict";
  var WizardTabableRegionBehavior = TabableRegionBehavior.extend({
    defaults: {
      initialActivationWeight: 1
    },
    constructor: function WizardTabableRegionBehavior() {
      TabableRegionBehavior.prototype.constructor.apply(this, arguments);
      _.extend(this.view, this.defaults);
      _.extend(this.view, {
        tabableRegionBehavior: this
      });
      var self = this;
      _.extend(this.view, {
        isTabable: function() {
          return true;
        },
        currentlyFocusedElement: function(event) {
          var tabElements = this.$(TabablesBehavior.focusablesSelector).filter(":visible:not([disabled])");
          if (tabElements.length) {
            tabElements.prop("tabindex", 0);
          }
          if (!!event && event.shiftKey) {
            return tabElements[tabElements.length - 1];
          } else {
            return tabElements[0];
          }
        },
        onLastTabElement: function(shiftTab, event) {
          var filterCondition = "*[tabindex=0]:visible";
          var visibleElems = this.slidingList && this.slidingList.length > 0 ? this.slidingList[this.slidingList.length - 1].find(filterCondition) : this.$(filterCondition);
          return event.target === (shiftTab ? visibleElems[0] : visibleElems[visibleElems.length - 1]);
        },
        fetchFirstFocussableElement: function() {
          return self._currentlyFocusedElementFromView(this, false);
        }
      });
      this.listenTo(this.view, "step:active", function() {
        if (self.view._isRendered) {
          TabablesBehavior.setTabableRegionActive(self);
          TabablesBehavior.setFocusInActiveTabableRegion();
        } else {
          self.listenTo(self.view, "step:rendered", function() {
            TabablesBehavior.setTabableRegionActive(self);
            TabablesBehavior.setFocusInActiveTabableRegion();
          });
        }
      });
      if (this.view.options && !this.view.options.initialActivationWeight) {
        this.view.options.initialActivationWeight = this.options.initialActivationWeight;
      }
    },
    setInitialTabIndex: function() {
      if (this.view.allForms && this.view.allForms.configuredFocusControlName && !this.view.allFormsRendered) {
        return;
      } else {
        if (!this.currentlyFocusedElement && this.view.isTabable()) {
          let currentlyFocusedElement = this.getCurrentlyFocusedElementFromView();
          currentlyFocusedElement?.off("focus." + this.view.cid);
        }
        TabableRegionBehavior.prototype.setInitialTabIndex.apply(this);
      }
    },
    getCurrentlyFocusedElementFromView: function(shiftTab) {
      try {
        if (this.view.slidingList && this.view.slidingList.length > 0) {
          return this._currentlyFocusedElementFromView(this.view, shiftTab);
        } else {
          return TabableRegionBehavior.prototype.getCurrentlyFocusedElementFromView.apply(this, arguments);
        }
      } catch (e) {
        console.warn("Could not set as active element: ", this.view.cid, e.message);
      }
    },
    _currentlyFocusedElementFromView: function(view, shiftTab) {
      var filterCondition = ":visible:not([disabled])";
      var tabElements = view.slidingList && view.slidingList.length > 0 ? view.slidingList[view.slidingList.length - 1].find(TabablesBehavior.focusablesSelector).filter(filterCondition) : view.$(TabablesBehavior.focusablesSelector).filter(filterCondition);
      if (tabElements.length) {
        tabElements.prop("tabindex", 0);
      }
      var focusEl;
      if (shiftTab) {
        focusEl = tabElements[tabElements.length - 1];
      } else {
        focusEl = tabElements[0];
      }
      return focusEl instanceof $ ? focusEl : $(focusEl);
    }
  });
  return WizardTabableRegionBehavior;
});