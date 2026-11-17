/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/tab.panel/tab.links.ext.scroll.mixin", "smart/behaviors/keyboard.navigation/smart.tabables.behavior", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "smart/controls/tab.panel/tab.panel.view", "smart/controls/tab.panel/tab.contents.view", "smart/controls/tab.panel/tab.links.view", "smart/controls/tab.panel/behaviors/tab.panel.keyboard.behavior", "csui-ext!smart/controls/user/tab.extension", "csui-ext!esoc/widgets/userprofile/tab.extension", "hbs!smart/controls/user/impl/user.profile.tabs", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "smart/utils/smart.base", "i18n!smart/controls/user/nls/lang", "css!smart/controls/user/impl/userprofile.css" ], function(require, $, _, Backbone, Marionette, TabLinksScrollMixin, TabablesBehavior, TabableRegionBehavior, LayoutViewEventsPropagationMixin, TabPanelView, TabContentCollectionView, TabLinkCollectionView, TabPanelKeyboardBehavior, extraSmartExtnTabs, extraEsocExtnTabs, simpleUserWidgetTabsTemplate, theming, jatoIcons, SmartBase, Lang) {
  _.extend(TabPanelView.prototype, TabLinksScrollMixin);
  var UserProfileTabContentCollectionView, UserProfileTabPanelView, UserProfileTabLinkCollectionView;
  UserProfileTabContentCollectionView = TabContentCollectionView.extend({
    className: "esoc-simple-user-widget-tab-view",
    constructor: function UserProfileTabContentCollectionView(options) {
      options || (options = {});
      _.defaults(options, {
        toolbar: true,
        searchTabContentForTabableElements: true
      });
      TabContentCollectionView.prototype.constructor.apply(this, arguments);
    }
  });
  UserProfileTabPanelView = TabPanelView.extend({
    className: "esoc-simple-user-widget-tab-view",
    constructor: function UserProfileTabPanelView(options) {
      options || (options = {});
      _.defaults(options, {
        toolbar: true,
        searchTabContentForTabableElements: true
      });
      TabPanelView.prototype.constructor.apply(this, arguments);
    },
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      },
      TabPanelKeyboardBehavior: {
        behaviorClass: TabPanelKeyboardBehavior
      }
    },
    currentlyFocusedElement: function(shiftTab) {
      var element = this.options.focusedElement;
      if (shiftTab === undefined || shiftTab.shiftKey === false) {
        return $(this.$el.find("a[title]").filter(":visible").filter(":not(a:empty)")[0]);
      } else if (element && $(element).length) {
        return element;
      }
    },
    onLastTabElement: function(shiftTab) {
      var tabableElements = this.$el.find("[tabindex=" + this.options.tabCount + "]").filter(":visible").filter(":not(a:empty)");
      var focusElement = shiftTab ? this.$el.find("a[title]").filter(":visible").filter(":not(a:empty)")[0] : tabableElements.last();
      if (!shiftTab && tabableElements.length === 1 && this.options.tabIndex + 1 === this.options.tabCount) {
        this.options.tabIndex = 0;
        return true;
      }
      return $(focusElement).hasClass(TabableRegionBehavior.accessibilityActiveElementClass);
    }
  });
  UserProfileTabLinkCollectionView = TabLinkCollectionView.extend({
    className: "esoc-simple-user-widget-tab-view",
    constructor: function UserProfileTabLinkCollectionView(options) {
      options || (options = {});
      _.defaults(options, {
        toolbar: true,
        searchTabContentForTabableElements: true
      });
      TabLinkCollectionView.prototype.constructor.apply(this, arguments);
    }
  });
  var SimpleUserWidgetViewTabs = Marionette.ItemView.extend({
    className: "smart-tab-panel esoc-simple-user-widget-tab-view",
    template: simpleUserWidgetTabsTemplate,
    templateHelpers: function() {
      const isRTL = SmartBase.isRTL();
      const leftArrowIconName = isRTL ? "smart_action:action_caret_right32" : "smart_action:action_caret_left32";
      const rightArrowIconName = isRTL ? "smart_action:action_caret_left32" : "smart_action:action_caret_right32";
      const actionCaretRightSvg = jatoIcons.actionChevronLargeRight;
      const actionCaretLeftSvg = jatoIcons.actionChevronLargeLeft;
      const jatoLeftArrowIconName = isRTL ? actionCaretRightSvg : actionCaretLeftSvg;
      const jatoRightArrowIconName = isRTL ? actionCaretLeftSvg : actionCaretRightSvg;
      var tabs = _.union(extraSmartExtnTabs, extraEsocExtnTabs);
      return {
        isJATO: theming.isJATOTheme(),
        uniqueId: this.options.uniqueId,
        extraTabs: this.getExtraTabs(tabs),
        gotoNextTooltip: this.options?.gotoNextTooltip || Lang.next,
        gotoPreviousTooltip: this.options?.gotoPreviousTooltip || Lang.previous,
        leftArrowIconName: leftArrowIconName,
        rightArrowIconName: rightArrowIconName,
        jatoLeftArrowIconName: jatoLeftArrowIconName,
        jatoRightArrowIconName: jatoRightArrowIconName,
        messages: {
          profile: Lang.profile,
          settings: Lang.settings
        }
      };
    },
    events: {
      "click .cs-tablink": "onSwitchTab",
      keydown: "onKeyPress"
    },
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      },
      TabPanelKeyboardBehavior: {
        behaviorClass: TabPanelKeyboardBehavior
      }
    },
    onKeyPress: function(event) {
      if ($(event.target).hasClass("esoc-user-profile-tab") && !(event.keyCode === 9 || event.shiftKey || event.keyCode === 27)) {
        this.onKeyInView(event);
        event.preventDefault();
        event.stopPropagation();
      }
    },
    constructor: function SimpleUserWidgetViewTabs(options) {
      options = options || {};
      _.defaults(options, {
        toolbar: true,
        tabClickedOnce: false,
        initialActivationWeight: 1
      });
      $(window).on("resize", {
        view: this
      }, this._onWindowResize);
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.parentView = this.options.parentView;
      this.uniqueId = _.uniqueId();
      this.userProfileTabViewMapping = {};
    },
    onSwitchTab: function(e) {
      var dfd = $.Deferred(), self = this;
      _.defaults(this.parentView.options, {
        switchTabCallBack: function() {
          return $.Deferred().resolve({
            switchTab: true
          });
        }
      });
      dfd = this.parentView.options.switchTabCallBack(e);
      dfd.promise().done(function(args) {
        if (args.switchTab) {
          self.showTab(e);
          self.userProfileTabPanelViewClass.currentTabPosition = 0;
          self.refreshTabbales(self.userProfileTabPanelViewClass, $(e.currentTarget.parentElement));
          let parentEle = e.currentTarget.parentElement;
          setTimeout(function() {
            if (!self.isTabVisible(parentEle)) {
              self.tabPanel.scrollToActiveTab();
            }
          }, 0);
        }
      });
    },
    refreshTabbales: function(view, $elem) {
      var elem = view.keyboardBehavior.tabableElements[view.currentTabPosition], tabEle = elem && elem._behaviors.length && elem._behaviors[0].tabableElements;
      if (tabEle && tabEle.length) {
        tabEle.prop("tabindex", "-1");
      }
      if ($elem && $elem instanceof $) {
        $elem.attr("tabindex", 0);
      }
    },
    onRender: function(e) {
      var that = this;
      this.propagateEventsToRegions();
      this.userProfileTabPanelViewClass = new UserProfileTabPanelView(_.extend(that));
      this.userProfileTabPanelViewClass.tabLinks = new UserProfileTabLinkCollectionView(_.extend(that));
      this.userProfileTabPanelViewClass.tabContent = new UserProfileTabContentCollectionView(_.extend(that));
      this.userProfileTabPanelViewClass.options = that.options;
      $.extend(that, this.userProfileTabPanelViewClass);
      this._initializeOthers();
    },
    onShow: function() {
      this.tabPanel?.trigger("trigger:adjustTabLinks");
    },
    onAfterShow: function() {},
    _onWindowResize: function(event) {
      if (event && event.data && event.data.view) {
        event.data.view._enableToolbarState();
      }
    },
    _initializeOthers: function() {
      var options = {
        gotoPreviousTooltip: Lang.previous,
        gotoNextTooltip: Lang.next
      };
      this.listenTo(this.tabPanel, "trigger:adjustTabLinks", _.bind(() => {
        this.userProfileTabPanelViewClass._adjustTabLinks(options);
      }, this));
      this.userProfileTabPanelViewClass._listenToTabEvent();
      setTimeout(_.bind(this.userProfileTabPanelViewClass._enableToolbarState, this.userProfileTabPanelViewClass), 300);
    },
    showTab: function(e) {
      this.options.userwidgetmodel = this.options.model;
      var item = this.userProfileTabViewMapping[e.currentTarget.parentElement.id];
      if (item) {
        var regionId = "esoc-simple-user-widget-form-body-" + this.options.uniqueId, contentRegion = new Marionette.Region({
          el: this.$el.find("#" + regionId)
        }), viewInstance = new this.userProfileTabViewMapping[e.currentTarget.parentElement.id](this.options);
        contentRegion.show(viewInstance);
      }
      var $selected = this.$el.find("#" + e.currentTarget.parentElement.id);
      $selected.attr("aria-selected", true);
      $selected.siblings().attr("aria-selected", false);
    },
    sortExtratabs: function(extraTabs, sortOrder) {
      sortOrder.forEach(function(ele, i) {
        var temp = _.findIndex(extraTabs, function(item) {
          return item.tabName === ele;
        });
        var value = extraTabs.splice(temp, 1);
        value.length && extraTabs.splice(i, 0, value[0]);
      });
    },
    getExtraTabs: function(extraTabs) {
      var that = this;
      extraTabs = _.flatten(extraTabs, true);
      that.extraTabsShownCount = 0;
      _.each(extraTabs, function(tab) {
        if (!!tab.tabCount) {
          tab.tabCount.count = tab.tabCount.getItemCount(that.model, that.options);
        }
        tab.show = true;
        if (!!tab.showTab) {
          tab.show = tab.showTab(that.model, that.options);
        }
        if (tab.show) {
          var str = "esoc-user-profile-" + tab.tabName + "-tab";
          that.userProfileTabViewMapping[str] = tab.tabContentView;
          that.extraTabsShownCount += 1;
        }
      });
      if (this.options.sequence) {
        this.sortExtratabs(extraTabs, this.options.sequence);
      }
      return extraTabs;
    }
  });
  _.extend(SimpleUserWidgetViewTabs.prototype, LayoutViewEventsPropagationMixin);
  return SimpleUserWidgetViewTabs;
});