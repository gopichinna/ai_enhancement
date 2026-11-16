/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/tab.panel/tab.links.view", "smart/controls/tab.panel/tab.contents.view", "smart/mixins/view.events.propagation/view.events.propagation.mixin", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "smart/controls/tab.panel/behaviors/tab.panel.keyboard.behavior", "smart/utils/non-emptying.region/non-emptying.region", "smart/controls/tab.panel/tab.contents.header.view", "css!smart/controls/tab.panel/impl/tab.panel", "smart/lib/binf/js/binf", "smart/themes/carbonfiber/ot-icons/icons_smart_action", "smart/utils/otwc.loader" ], function(_, $, Backbone, Marionette, TabLinkCollectionView, TabContentCollectionView, ViewEventsPropagationMixin, TabableRegionBehavior, TabPanelKeyboardBehavior, NonEmptyingRegion, TabContentHeaderView) {
  "use strict";
  var TabPanelView = Marionette.View.extend({
    className: function() {
      var className = "cs-tabpanel smart-tab-panel tab-panel";
      if (this.options.classNames) {
        className += " " + _.result(this.options, "classNames");
      }
      return className;
    },
    attributes: function() {
      var id = this.id || _.uniqueId("cs-tab");
      var attrs = {
        id: id
      };
      return attrs;
    },
    events: {
      keydown: "onKeyInView"
    },
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior,
        notSetFocus: true,
        initialActivationWeight: 100
      },
      TabPanelKeyboardBehavior: {
        behaviorClass: TabPanelKeyboardBehavior
      }
    },
    constructor: function TabPanelView(options) {
      options || (options = {});
      options.tabPanel = this;
      if (!options.collection) {
        options.collection = this._convertCollection(options);
      }
      this._generateUniqueTabId(options);
      if (options.node) {
        var initialPanel = options.node.get("initialPanel");
        if (initialPanel) {
          var initialTabIndex = options.collection.findIndex({
            name: initialPanel
          });
          if (initialTabIndex >= 0 && initialTabIndex < options.collection.length) {
            var initialPanelModel = options.collection.at(initialTabIndex);
            options.activeTab = new Backbone.Model(initialPanelModel.attributes);
            options.activeTab.set("tabIndex", initialTabIndex);
            options.selectedTab = new Backbone.Model(initialPanelModel.attributes);
          }
        }
      }
      if (!options.activeTab) {
        options.activeTab = new Backbone.Model({
          tabIndex: 0
        });
      }
      if (options?.regionBehavior) {
        this.behaviors = _.extend(this.behaviors, {
          TabableRegionBehavior: options.regionBehavior
        });
      }
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.linksRegion = new NonEmptyingRegion({
        el: this.el
      });
      this.contentRegion = new NonEmptyingRegion({
        el: this.el
      });
      this.activeTab = options.activeTab;
      var tabIndex = this.activeTab.get("tabIndex");
      if (tabIndex >= this.collection.length) {
        this.activeTab.set("tabIndex", this.collection.length - 1);
      }
      this.listenTo(this.collection, "reset", this._generateUniqueTabId);
      this.listenTo(this.collection, "add", this._setModelUniqueTabId);
      this.listenTo(this, "activate:tab", this._scrollToActiveTabOnClick);
      this.listenTo(this, "before:destroy", this._destroyContent);
      const resizeHandler = _.bind(function() {
        this.cIndex !== undefined && this.trigger("handle:dom:refresh");
      }, this);
      $(window).on("resize", resizeHandler);
      this.listenTo(this, "dom:refresh", resizeHandler);
      this.listenTo(this, "destroy", _.bind(function() {
        $(window).off("resize", resizeHandler);
        this.stopListening(this, "dom:refresh", resizeHandler);
      }, this));
      this.listenTo(this, "after:show", _.bind(this.render, this));
      this.listenTo(this, "trigger:adjustTabLinks", _.bind(() => {
        this?._adjustTabLinks();
      }, this));
    },
    _renderHeader: function(deletedIndex, activeVisible) {
      this.tabLinksBarChildren = this.el.querySelectorAll(".binf-nav-tabs li");
      this.tabContents = this.el.querySelectorAll('.binf-tab-content > div[role="tabpanel"]');
      this.calculateMaxWidth();
      this._updateCIndexToFirstVisibile();
      if (this.cIndex === this.tabLinksBarChildren.length) {
        this.cIndex = this.cIndex - 1;
        this._gotoPreviousTab();
        this._updateCIndexToFirstVisibile();
      } else if (deletedIndex === this.cIndex - 1) {
        this._gotoPreviousTab();
        this._updateCIndexToFirstVisibile();
      }
      if (!!activeVisible && this.cIndex !== 0) {
        this.scrollToActiveTab();
        this._updateCIndexToFirstVisibile();
      }
      if (this.cIndex === 0) {
        this.tabLinksBar.style.left = 0 + "px";
        if (!!activeVisible && !this.isTabVisible(this.el.querySelector(".binf-active"))) {
          this.scrollToActiveTab();
          this._updateCIndexToFirstVisibile();
        }
      }
      this._showHideNavigationButtons();
    },
    _scrollToActiveTabOnClick: function(tabContent, tabPanel, tabLink) {
      this.activeTabLink = tabLink;
      this.activeTabContent = tabContent;
      if (this.options.mode) {
        var href = tabLink.$el.find(">a").attr("href"), extraTopOffset = this.getOption("extraScrollTopOffset") || 0;
        href[0] === "#" && (href = href.substr(1));
        var hrefElems = this.$el.find("div[id='" + href + "']");
        if (hrefElems.length > 0) {
          var tabPosTop = hrefElems[0].offsetTop + extraTopOffset;
          if (this.options.mode === "spy") {
            var scrollspy = this.tabContent.$el.data("binf.scrollspy");
            scrollspy && scrollspy.refresh();
          }
          this.disableScrollSpyOnClick = true;
          this.scrollToTop(tabPosTop);
          this.trigger("tab:contents:header:view:change:tab:title", tabLink);
          var tablinkInfo = {
            tablink: tabLink
          };
          this.trigger("tablink:click", tablinkInfo);
        }
      }
      var listItem = this.activeTabLink.el;
      if (!this.isTabVisible(listItem)) {
        this.duration = 200;
        this.scrollToActiveTab();
        setTimeout(_.bind(function() {
          this.duration = 0;
        }, this));
      }
    },
    render: function() {
      this._ensureViewIsIntact();
      Marionette.triggerMethodOn(this, "before:render", this);
      this._destroyContent();
      this._renderContent();
      this._bindingToEvents();
      Marionette.triggerMethodOn(this, "render", this);
      this.listenTo(this, "delete:tab", this._renderHeader);
      return this;
    },
    _renderContent: function() {
      var TabLinkCollectionViewClass = this.options.TabLinkCollectionViewClass || TabLinkCollectionView;
      this.tabLinks = new TabLinkCollectionViewClass(this.options);
      var TabContentCollectionViewClass = this.options.TabContentCollectionViewClass || TabContentCollectionView;
      this.tabContent = new TabContentCollectionViewClass(this.options);
      this.propagateEventsToViews(this.tabLinks, this.tabContent);
      this.linksRegion.show(this.tabLinks);
      this.tabLinks.$el.after("<div class='smart-tab-contents-wrapper'></div>");
      this.contentWrapperRegion = new NonEmptyingRegion({
        el: this.el.querySelector(".smart-tab-contents-wrapper")
      });
      this.contentWrapperRegion.show(this.tabContent);
      let stickyHeaderContent, showStickyHeader = this.options.mode;
      if (showStickyHeader === "spy" && this.options.stickyHeader) {
        stickyHeaderContent = "<div class='smart-tab-contents-header-wrapper'></div>";
        this.tabContent.$el.after(stickyHeaderContent);
        this.contentHeaderRegion = new Marionette.Region({
          el: this.$el.find(".smart-tab-contents-header-wrapper")
        });
        this.tabContentHeader = new TabContentHeaderView(this.options);
        this.contentHeaderRegion.show(this.tabContentHeader);
      }
      this.listenTo(this, "handle:dom:refresh", _.bind(function() {
        this.tabLinks.trigger("handle:dom:refresh");
        this.tabContent.trigger("handle:dom:refresh");
      }, this));
      var self = this;
      this.listenTo(this.tabLinks, "childview:before:activate:tab", function(tabLink) {
        var tabPanel = this.tabContent.children.findByModel(tabLink.model);
        this.activatingTab = true;
        Marionette.triggerMethodOn(this, "before:activate:tab", tabPanel.content, tabPanel, tabLink);
      }).listenTo(this.tabLinks, "childview:activate:tab", function(tabLink) {
        var tabPanel = this.tabContent.children.findByModel(tabLink.model);
        tabPanel.ensureContent();
        var tabContent = tabPanel.content;
        setTimeout(function() {
          self.activatingTab = false;
        }, 600);
        Marionette.triggerMethodOn(this, "activate:tab", tabContent, tabPanel, tabLink);
        Marionette.triggerMethodOn(tabContent, "dom:refresh");
      }).listenTo(this.tabContent, "childview:before:populate:tab", function(tabPanel) {
        Marionette.triggerMethodOn(this, "before:populate:tab", this, tabPanel);
      }).listenTo(this.tabContent, "childview:populate:tab", function(tabPanel) {
        Marionette.triggerMethodOn(this, "populate:tab", this, tabPanel);
      });
      var tabIndex = 0;
      if (this.activeTab && this.activeTab.get("tabIndex") >= 0 && this.activeTab.get("tabIndex") < this.collection.length) {
        tabIndex = this.activeTab.get("tabIndex");
      }
      this.activeTabLink = this.tabLinks.children.findByIndex(tabIndex);
      if (this.activeTabLink) {
        this.activeTabContent = this.tabContent.children.findByIndex(tabIndex).content;
      }
    },
    _destroyContent: function() {
      this.$el.off("tab:content:focus");
      this.$el.off("tab:link:delete");
      if (this.tabLinks) {
        this.cancelEventsToViewsPropagation(this.tabLinks, this.tabContent);
        this.stopListening(this.tabLinks).stopListening(this.tabContent);
        this?.linksRegion?.empty();
        this?.contentRegion?.empty();
        this?.contentWrapperRegion?.$el?.remove();
        this?.contentHeaderRegion?.$el?.remove();
      }
    },
    _bindingToEvents: function() {
      var self = this;
      this.$el.on("tab:content:focus", function(event) {
        var $elem = self.tabContent.getTabContentFirstFocusableELement(event.tabId);
        if ($elem) {
          self.currentTabPosition = this.keyboardBehavior ? this.keyboardBehavior.tabContentIndex : -1;
          self._moveTo && self._moveTo(event, $elem);
          self.tabContent.keyboardBehavior && self.tabContent.keyboardBehavior.updateCurrentTabPosition();
        }
      });
      this.$el.on("tab:link:delete", function(event) {
        event.preventDefault();
        event.stopPropagation();
        self.tabLinks.deleteTabById(event.tabId);
      });
    },
    _convertCollection: function(options) {
      var tabs = new Backbone.Collection(options.tabs);
      tabs.each(function(tab) {
        tab.set("id", _.uniqueId("cs-tab"));
      });
      return tabs;
    },
    _generateUniqueTabId: function(options) {
      var collection = options instanceof Backbone.Collection ? options : options.collection || this.collection;
      if (collection) {
        collection.each(_.bind(function(tab) {
          this._setModelUniqueTabId(tab);
        }, this));
      }
    },
    _setModelUniqueTabId: function(model) {
      model && model.set("uniqueTabId", _.uniqueId("cstab-uid-"), {
        silent: true
      });
    },
    _isTablinkVisibleInParents: function($el, options) {
      return this.tabLinks._isTablinkVisibleInParents($el, options);
    }
  });
  _.extend(TabPanelView.prototype, ViewEventsPropagationMixin);
  return TabPanelView;
});