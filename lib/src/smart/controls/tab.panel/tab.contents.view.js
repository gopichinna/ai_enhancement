/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/controls/tab.panel/tab.content.view", "smart/mixins/view.events.propagation/view.events.propagation.mixin", "smart/controls/tab.panel/behaviors/tab.contents.keyboard.behavior", "smart/controls/tab.panel/behaviors/tab.contents.proxy.keyboard.behavior", "smart/lib/binf/js/binf" ], function(_, $, Marionette, TabContentView, ViewEventsPropagationMixin, TabContentKeyboardBehavior, TabContentProxyKeyboardBehavior) {
  "use strict";
  var TabContentCollectionView = Marionette.CollectionView.extend({
    className: function() {
      var ret = "binf-tab-content smart-tab-content";
      if (this.options?.mode === "spy") {
        ret += " scrollspy";
      }
      return ret;
    },
    childView: TabContentView,
    childViewOptions: function(model, index) {
      return _.extend(this.options, {
        index: index,
        parentView: this,
        activeTab: this.options.activeTab
      });
    },
    behaviors: {},
    defaults: {
      implementTabContentsDefaultKeyboardHandling: true,
      tabContentAccSelectors: "a[href], area[href], input:not([disabled])," + " select:not([disabled]), textarea:not([disabled])," + " button:not([disabled]), iframe, object, embed," + " *[tabindex], *[data-cstabindex], *[contenteditable]"
    },
    constructor: function TabContentCollectionView(options) {
      _.defaults(options, this.defaults);
      if (options.implementTabContentsDefaultKeyboardHandling) {
        this.behaviors = _.extend({
          TabContentKeyboardBehavior: {
            behaviorClass: TabContentKeyboardBehavior
          }
        }, this.behaviors);
      } else if (options.implementTabContentsDefaultKeyboardHandling === false) {
        this.behaviors = _.extend({
          TabContentProxyKeyboardBehavior: {
            behaviorClass: TabContentProxyKeyboardBehavior
          }
        }, this.behaviors);
      }
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.reactToChildEvent = false;
      this.listenTo(this, "add:child", this.propagateEventsToViews);
    },
    onBeforeDestroy: function() {
      this.reactToChildEvent = false;
    },
    onRender: function() {
      this.reactToChildEvent = true;
      this._setLastTabCssClass();
    },
    onReorder: function() {
      this._setLastTabCssClass();
    },
    onAddChild: function(childView) {
      this._setLastTabCssClass();
    },
    onRemoveChild: function(childView) {
      this._setLastTabCssClass();
    },
    _setLastTabCssClass: function() {
      if (this.reactToChildEvent !== true) {
        return;
      }
      var cssClass = "last-tab-panel";
      this.children.each(function(view) {
        if (view.$el.hasClass(cssClass)) {
          view.$el.removeClass(cssClass);
        }
      });
      if (this.children.length > 1) {
        var lastChildView = this.getLastVisibleChild(this.collection.length - 1);
        lastChildView && lastChildView.$el.addClass(cssClass);
      }
    },
    getLastVisibleChild: function(index) {
      var lastModel = this.collection.at(index);
      if (lastModel) {
        var lastChildView = this.children.findByModel(lastModel);
        if (lastChildView && !lastChildView.$el.hasClass("binf-hidden")) {
          return lastChildView;
        } else {
          return this.getLastVisibleChild(index - 1);
        }
      }
      return;
    },
    getTabContentFirstFocusableELement: function(tabId) {
      var ret;
      if (tabId === undefined || this.options.searchTabContentForTabableElements !== true) {
        return ret;
      }
      var uTabId = tabId.charAt(0) === "#" ? tabId.slice(1) : tabId;
      var model = this.collection.findWhere({
        uniqueTabId: uTabId
      });
      if (model) {
        var tabPane = this.children.findByModel(model);
        var tabContent = tabPane.content;
        var tabElemId = 0;
        var elems = tabContent.$el.find(this.options.tabContentAccSelectors).filter(":visible");
        if (elems.length > 0) {
          var $currentElem = $(elems[tabElemId]);
          while (this.closestTabable && this.closestTabable($currentElem) === false) {
            tabElemId++;
            if (tabElemId >= elems.length) {
              tabElemId = -1;
              break;
            }
            $currentElem = $(elems[tabElemId]);
          }
          if (tabElemId >= 0 && tabElemId < elems.length) {
            ret = $currentElem;
          }
        }
      }
      return ret;
    }
  });
  _.extend(TabContentCollectionView.prototype, ViewEventsPropagationMixin);
  return TabContentCollectionView;
});