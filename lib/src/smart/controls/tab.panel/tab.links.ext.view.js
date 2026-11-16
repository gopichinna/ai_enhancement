/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "smart/controls/tab.panel/tab.links.view", "hbs!smart/controls/tab.panel/impl/tab.links.ext", "smart/controls/tab.panel/tab.link.ext.view", "smart/mixins/view.events.propagation/view.events.propagation.mixin", "i18n!smart/controls/tab.panel/impl/nls/lang", "smart/utils/smart.base", "smart/lib/binf/js/binf" ], function(_, TabLinkCollectionView, tabLinksTemplate, TabLinkViewExt, ViewEventsPropagationMixin, lang, SmartBase) {
  "use strict";
  var TabLinkCollectionViewExt = TabLinkCollectionView.extend({
    template: tabLinksTemplate,
    templateHelpers: function() {
      const isRTL = SmartBase.isRTL();
      const leftArrowIconName = isRTL ? "smart_action:action_caret_right32" : "smart_action:action_caret_left32";
      const rightArrowIconName = isRTL ? "smart_action:action_caret_left32" : "smart_action:action_caret_right32";
      return {
        tab_type: this.options.tabType || "binf-nav-tabs",
        toolbar: this.options?.toolbar ?? false,
        nextTooltip: this.options.gotoNextTooltip || lang.gotoNextTooltip,
        leftArrowIconName: leftArrowIconName,
        rightArrowIconName: rightArrowIconName,
        previousTooltip: this.options.gotoPreviousTooltip || lang.gotoPreviousTooltip
      };
    },
    childView: TabLinkViewExt,
    childViewContainer: function() {
      return ".tab-links-bar >." + this.tabType;
    },
    constructor: function TabLinkCollectionViewExt(options) {
      this.options = options || {};
      TabLinkCollectionView.prototype.constructor.apply(this, arguments);
    },
    onToolbarClicked: function(event) {
      event.preventDefault();
      event.stopPropagation();
    },
    deleteTabById: function(tabId) {
      var ret = false;
      if (tabId === undefined) {
        return ret;
      }
      var uTabId = tabId.charAt(0) === "#" ? tabId.slice(1) : tabId;
      var model = this.collection.findWhere({
        uniqueTabId: uTabId
      });
      if (model) {
        var tabLink = this.children.findByModel(model);
        if (tabLink) {
          tabLink.deleteCurrentTab();
          ret = true;
        }
      }
      return ret;
    }
  });
  _.extend(TabLinkCollectionViewExt.prototype, ViewEventsPropagationMixin);
  return TabLinkCollectionViewExt;
});