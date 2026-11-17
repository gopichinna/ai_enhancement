/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/utils/log", "smart/themes/theming", "hbs!smart/controls/tab.panel/impl/tab.link", "smart/lib/binf/js/binf" ], function(module, _, Marionette, log, theming, tabLinkTemplate) {
  "use strict";
  log = log(module.id);
  var TabLinkView = Marionette.ItemView.extend({
    tagName: "li",
    className: function() {
      let tabIndex = this.options?.activeTab?.get("tabIndex") >= 0 && this.options?.activeTab?.get("tabIndex") < this.model?.collection.length ? this.options?.activeTab?.get("tabIndex") : 0;
      let activeClass = this.model === this.model?.collection?.at(tabIndex) ? " binf-active " : "";
      let classNames = " smart-tab-panel-item " + activeClass;
      classNames += " " + (theming.isJATOTheme() ? "jatx-tab-links-delete-resize" : "");
      return classNames;
    },
    template: tabLinkTemplate,
    templateHelpers: function() {
      var uniqueTabId = this.model.get("uniqueTabId");
      return {
        linkId: "tablink-" + uniqueTabId
      };
    },
    events: {
      "show.binf.tab > a": "onShowingTab",
      "shown.binf.tab > a": "onShownTab"
    },
    ui: {
      link: ">a"
    },
    constructor: function TabLinkView(options = {}) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.options?.parentView && this.listenTo(this.options.parentView, "handle:dom:refresh", _.bind(function() {
        let tabIndex = this?.options?.activeTab?.get("tabIndex") ?? 0;
        let canActivateCurrentTabLink = tabIndex === this.options.index;
        if (canActivateCurrentTabLink) {
          this.options?.tabPanel?.calculateMaxWidth().done(_.bind(function() {
            this._activateSpecificTab(this?.options?.activeTab?.get("tabIndex") || 0);
            this.options?.tabPanel?._updateCIndexToFirstVisibile();
            this.options?.tabPanel?.cIndex !== 0 && this.options?.tabPanel?.scrollToActiveTab();
          }, this));
        }
      }, this));
    },
    activate: function(setFocus) {
      var $a = this.$el.find(">a");
      $a.removeAttr("aria-selected");
      this.ui.link.binf_tab("show");
      setFocus && this?.ui?.link?.trigger("focus");
    },
    isActive: function() {
      return this.$el.hasClass("binf-active");
    },
    onShowingTab: function(event) {
      log.debug("Starting a tab link activation (tab {0}, {1}).", this._index, this.cid) && console.log(log.last);
      this.triggerMethod("before:activate:tab", this);
    },
    onShownTab: function(event) {
      var tabIndex = this.model.collection.indexOf(this.model);
      var activeTab = this.options.activeTab;
      if (log.can("DEBUG")) {
        log.debug("Finishing a tab link activation (tab {0}: {1}, previous {2}).", tabIndex, this.cid, activeTab ? activeTab.get("tabIndex") : "unknown") && console.log(log.last);
      }
      activeTab && activeTab.set("tabIndex", tabIndex);
      this.triggerMethod("activate:tab", this);
    }
  });
  return TabLinkView;
});