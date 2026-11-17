/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/tab.panel/behaviors/tab.panel.keyboard.behavior" ], function(TabPanelKeyBoardBehavior) {
  "use strict";
  var D2MetadataPropertiesKeyBoardBehavior = TabPanelKeyBoardBehavior.extend({
    constructor: function TabPanelKeyboardBehavior(options, view) {
      TabPanelKeyBoardBehavior.prototype.constructor.apply(this, arguments);
      var self = this;
      this.listenTo(view, "render", function() {
        view.$el.off("d2:tab:content:render");
        view.$el.on("d2:tab:content:render", function(event, data) {
          self.refreshTabableElements(view, data && data.supressTabIndexRefresh);
        });
      });
    },
    refreshTabableElements: function(view, supressTabIndexRefresh) {
      view.tabLinks.triggerMethod("refresh:tabable:elements", view);
      view.tabContent.triggerMethod("refresh:tabable:elements", view);
      var index = 0;
      this.tabLinksIndex = index;
      this.tabableElements[this.tabLinksIndex] = view.tabLinks;
      this.tabContentHeaderIndex = -1;
      if (view.tabContentHeader) {
        this.tabContentHeaderIndex = ++index;
        this.tabableElements[this.tabContentHeaderIndex] = view.tabContentHeader;
      }
      if (view.eSignatureView && !view.eSignatureView.isDestroyed) {
        view.eSignatureView.triggerMethod("refresh:tabable:elements", view);
        this.tabableElements[++index] = view.eSignatureView;
      }
      if (view.errorPanelView && !view.errorPanelView.isDestroyed && !view.options.wizard) {
        view.errorPanelView.triggerMethod("refresh:tabable:elements", view);
        this.tabableElements[++index] = view.errorPanelView;
      }
      this.tabContentIndex = ++index;
      this.tabableElements[this.tabContentIndex] = view.tabContent;
      if (view.errorPanelView && !view.errorPanelView.isDestroyed && view.options.wizard) {
        view.errorPanelView.triggerMethod("refresh:tabable:elements", view);
        this.tabableElements[++index] = view.errorPanelView;
      }
      this.view.currentTabPosition = -1;
      if ((this.view.allForms && !this.view.allForms.configuredFocusControlName || this.activeTabContent && this.activeTabContent.childTabPanelView && this.activeTabContent.childTabPanelView.allForms && !this.activeTabContent.childTabPanelView.allForms.configuredFocusControlName) && !supressTabIndexRefresh) {
        this.view.triggerMethod("refresh:tabindexes");
      }
    }
  });
  return D2MetadataPropertiesKeyBoardBehavior;
});