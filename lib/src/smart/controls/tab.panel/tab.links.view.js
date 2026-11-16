/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "smart/utils/smart.base", "hbs!smart/controls/tab.panel/impl/tab.links", "smart/controls/tab.panel/tab.link.view", "smart/controls/tab.panel/behaviors/tab.links.keyboard.behavior", "smart/utils/smart.base", "smart/lib/binf/js/binf" ], function(_, Marionette, smartBase, tabLinksTemplate, TabLinkView, TabLinksKeyboardBehavior, SmartBase) {
  "use strict";
  var TabLinkCollectionView = Marionette.CompositeView.extend({
    className: function() {
      var ret = "tab-links smart-tab-links";
      if (this.options.mode === "spy") {
        ret += " scrollspy";
      }
      return ret;
    },
    childViewOptions: function(model, index) {
      return _.extend(this.options, {
        index: index,
        activeTab: this.options.activeTab,
        parentView: this,
        clickActivatingSemaphore: createClickActivatingSemaphore(this)
      });
    },
    template: tabLinksTemplate,
    templateHelpers: function() {
      return {
        tab_type: this.tabType
      };
    },
    childView: TabLinkView,
    childViewContainer: function() {
      return ">." + this.tabType;
    },
    behaviors: {
      TabLinksKeyboardBehavior: {
        behaviorClass: TabLinksKeyboardBehavior
      }
    },
    constructor: function TabLinkCollectionView(options) {
      this.tabType = options.tabType || "binf-nav-tabs";
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.options.activeTab, "change:tabIndex", this._updateActiveTab);
      this._clickActivatingSemaphore = 0;
      this.isRTL = SmartBase.isRTL();
    },
    onChildviewActivateTab: function(childView) {
      this.children.each(function(view) {
        var $link = view.$el;
        if ($link.attr("aria-selected") !== undefined) {
          $link.attr("aria-selected", "false");
        }
      });
      childView.$el.attr("aria-selected", "true");
    },
    onShow: function() {
      this.options?.tabPanel?.trigger("trigger:adjustTabLinks");
    },
    _updateActiveTab: function() {
      var tabIndex = this.options.activeTab.get("tabIndex"), linkView = this.children.findByIndex(tabIndex);
      if (linkView) {
        if (tabIndex === linkView._index) {
          if (!linkView.isActive()) {
            linkView.activate();
          }
        }
      } else {
        tabIndex = 0;
        this.children.find(function(linkView, index) {
          if (linkView.isActive()) {
            tabIndex = index;
            return true;
          }
        });
        this.options.activeTab.set("tabIndex", tabIndex);
      }
    },
    _isTablinkVisibleInParents: function($el, options) {
      var levels = options && options.levels || 3;
      var percentX = options && options.percentX || 100;
      var percentY = options && options.percentY || 100;
      return smartBase.isElementVisibleInParents($el, levels, percentX, percentY);
    },
    deleteTabById: function(tabId) {
      return;
    }
  });
  return TabLinkCollectionView;
  function createClickActivatingSemaphore(view) {
    return {
      enter: function() {
        return view._clickActivatingSemaphore++ === 0;
      },
      exit: function() {
        return --view._clickActivatingSemaphore === 0;
      }
    };
  }
});