/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "i18n!smart/controls/tab.panel/impl/nls/lang", "smart/utils/smart.base" ], function(_, $, Backbone, lang, SmartBase) {
  let DATA_ATTRS = {
    ATTR_KEY: "left",
    DATA_ATTR_KEY: "data-left"
  };
  var TabLinksScrollMixin = {
    intializeTabVars: function() {
      this.isRTL = this?.tabLinks?.isRTL ?? false;
      if (this.isRTL) {
        DATA_ATTRS = {
          ATTR_KEY: "right",
          DATA_ATTR_KEY: "data-right"
        };
      }
      this.partiallyVisibileWidth = 40;
      this.suppressWidth = 0;
      const leftToolbar = this.$el?.find(".left-toolbar");
      const rightToolbar = this.$el?.find(".right-toolbar");
      let leftToolbarWidth = leftToolbar.outerWidth() ?? 0;
      let rightToolbarWidth = rightToolbar.outerWidth() ?? 0;
      let toolbarWidth = leftToolbarWidth + rightToolbarWidth;
      this.suppressWidth = toolbarWidth !== 0 ? toolbarWidth : 98;
      this.tabLinksBarChildren = this.el.querySelectorAll(".binf-nav-tabs li:not(.binf-hidden)");
      this.tabLinksBar = this.el.querySelector(".binf-nav-tabs");
      this.tabLinksBarOuterParent = this.el.querySelector(".tab-links-bar");
      this.tabLinksMasterParent = this.el.querySelector(".tab-links .smart-tab-links-bar-toolbar-wrapper");
      this.tabLinksBarWidth = this.tabLinksBar?.offsetWidth;
      this.scrollspyTabContent = this.el.querySelector(".binf-tab-content.scrollspy");
      this.tabContents = this.el.querySelectorAll('.binf-tab-content > div[role="tabpanel"]');
      this.calculateMaxWidth();
    },
    setAttributes: function(el, attrs) {
      for (var key in attrs) {
        if (key) {
          el.setAttribute(key, attrs[key]);
        }
      }
    },
    calculateMaxWidth: function() {
      var deferred = $.Deferred();
      this.tabLinksBarOuterParentWidth = Math.abs(this.tabLinksMasterParent?.offsetWidth - this.suppressWidth);
      let tabEleMaxWidth = Math.abs(this.tabLinksBarOuterParentWidth - 2 * this.partiallyVisibileWidth);
      let len = this.tabLinksBarChildren.length - 1;
      let width = 0;
      for (var i = 0; i <= len; i++) {
        let dataWidth = this.tabLinksBarChildren[i].offsetWidth > tabEleMaxWidth ? tabEleMaxWidth : this.tabLinksBarChildren[i].offsetWidth;
        let dataRight = i === 0 ? 0 : width;
        this.setAttributes(this.tabLinksBarChildren[i], {
          style: $(this.tabLinksMasterParent).is(":visible") ? `max-width:${tabEleMaxWidth}px;` : `max-width: 920px;`,
          "data-left": this.tabLinksBarChildren[i].offsetLeft,
          "data-right": dataRight,
          "data-width": dataWidth
        });
        width += dataWidth;
      }
      return deferred.resolve().promise();
    },
    initializePreviousNextBtn: function() {
      if ((this.cIndex == 0 || this.cIndex > this.tabLinksBarChildren.length) && this.leftToolbar[0]) {
        this.cIndex = 0;
        this.leftToolbar.addClass("binf-hidden");
      } else if (this.cIndex == this.tabLinksBarChildren.length && this.rightToolbar[0]) {
        this.rightToolbar.addClass("binf-hidden");
      }
      var tabElment = this.tabLinksBarChildren[this.cIndex];
      tabElment && tabElment.setAttribute("aria-selected", "true");
      var tabId = tabElment && tabElment?.firstElementChild?.getAttribute("href")?.replace("#", "");
      var tabContent = this.el.querySelector("#" + tabId);
      tabContent && tabContent.classList.add("binf-active");
      tabContent && this.scrollToTop(tabContent.offsetTop);
    },
    scrollToTop: function(tabPosTop) {
      this.isAnimationInProgress = true;
      $(this.scrollspyTabContent).animate({
        scrollTop: tabPosTop
      }, 200, _.bind(function() {
        this.isAnimationInProgress = false;
      }, this));
    },
    _adjustTabLinks: function(options) {
      options = options || {};
      this.cIndex = 0;
      this.intializeTabVars();
      this._initializeToolbars(options);
      this.initializePreviousNextBtn();
      this._showHideNavigationButtons();
      this._listenToTabEvent();
      this._listenToActiveTabClickEvent();
    },
    _initializeToolbars: function(options) {
      options = options || {};
      this.tabsSelector = "> ul li:not('.binf-hidden')";
      this.tablinksOuterMasterWrapper = $(this.$el.find(".tab-links.smart-tab-links")[0]);
      this.tabLinksMasterParentWrapper = $(this.$el.find(".tab-links .smart-tab-links-bar-toolbar-wrapper")[0]);
      this.tablinksToolbar = $(this.$el.find(".tab-links .tab-links-bar")[0]);
      this.leftToolbar = $(this.$el.find(".tab-links .left-toolbar")[0]);
      if (this.leftToolbar) {
        this.gotoPreviousPage = $(this.$el.find(".tab-links .goto_previous_div .smart-goto-previous-page")[0]);
        this.gotoPreviousPage.off("click").on("click", _.bind(this._gotoPreviousTab, this));
      }
      this.rightToolbar = $(this.$el.find(".tab-links .right-toolbar")[0]);
      if (this.rightToolbar) {
        this.gotoNextPage = $(this.$el.find(".tab-links .goto_next_div .smart-goto-next-page")[0]);
        this.gotoNextPage.off("click").on("click", _.bind(this._gotoNextTab, this));
      }
    },
    isTabVisible: function(tabElement) {
      var tabRect = tabElement?.getBoundingClientRect(), isVisibile = false;
      if (!this.tabLinksBarChildren) {
        this.intializeTabVars();
      }
      var linksBarRect = this.tabLinksBarOuterParent?.getBoundingClientRect();
      isVisibile = (tabRect?.left >= linksBarRect?.left || Math.floor(tabRect?.left - linksBarRect?.left) == -1) && (tabRect?.right <= linksBarRect?.right || Math.floor(tabRect?.right - linksBarRect?.right) == 0);
      return isVisibile;
    },
    scrollToFocusedTab: function(tabIndex) {
      var activeTab = this?.tabLinksBarChildren[tabIndex];
      var activeTabIndex = Array.from(this.tabLinksBarChildren).indexOf(activeTab);
      var calcLeft;
      this.cIndex = tabIndex;
      this.calculateMaxWidth().done(_.bind(function() {
        var activeTabWidth = parseFloat(activeTab?.getAttribute("data-width"));
        var activeTabLeft = parseFloat(activeTab?.getAttribute(DATA_ATTRS.DATA_ATTR_KEY));
        if (!this.isTabVisible(this.tabLinksBarChildren[this.cIndex]) && this.cIndex !== 0) {
          calcLeft = activeTabLeft - this.partiallyVisibileWidth;
          this.doAnimationOfActiveTab(calcLeft);
        } else if (this.cIndex === 0) {
          let styleObj = {};
          styleObj[DATA_ATTRS.ATTR_KEY] = 0;
          $(this.tabLinksBar).animate(styleObj, 0);
          this._showHideNavigationButtons();
        }
      }, this));
    },
    scrollToActiveTab: function(tabIndex) {
      var activeTab = this.el.querySelector(".tab-links-bar .binf-active");
      this.tabLinksBarChildren = this.el.querySelectorAll(".binf-nav-tabs li:not(.binf-hidden)");
      var activeTabIndex = Array.from(this.tabLinksBarChildren).indexOf(activeTab);
      var calcLeft;
      this.cIndex = activeTabIndex;
      this.calculateMaxWidth().done(_.bind(function() {
        var activeTabWidth = parseFloat(activeTab?.getAttribute("data-width"));
        var activeTabLeft = parseFloat(activeTab?.getAttribute(DATA_ATTRS.DATA_ATTR_KEY));
        if ((this.cIndex === this.tabLinksBarChildren.length - 1 || this.isTabVisible(this.tabLinksBarChildren[this.cIndex - 1])) && this.tabLinksBarChildren.length !== 1) {
          calcLeft = activeTabLeft + activeTabWidth + this.partiallyVisibileWidth - this.tabLinksBarOuterParentWidth;
          this.doAnimationOfActiveTab(calcLeft);
        } else if (this.isTabVisible(this.tabLinksBarChildren[this.cIndex + 1]) && this.cIndex !== 0) {
          calcLeft = activeTabLeft - this.partiallyVisibileWidth;
          this.doAnimationOfActiveTab(calcLeft);
        } else if (this.cIndex === 0) {
          let styleObj = {};
          styleObj[DATA_ATTRS.ATTR_KEY] = 0;
          $(this.tabLinksBar).animate(styleObj, 0);
          this.leftToolbar?.addClass("binf-hidden");
          !this.isTabVisible(this.tabLinksBarChildren[this.tabLinksBarChildren.length - 1]) && this.rightToolbar?.removeClass("binf-hidden");
        } else {
          calcLeft = activeTabLeft - this.partiallyVisibileWidth;
          this.doAnimationOfActiveTab(calcLeft);
        }
      }, this));
      let userLanguage = SmartBase.getUserMetadataLanguageInfo();
      var newTabHeaderText = activeTab?.querySelector(".cs-tablink-text")?.textContent;
      newTabHeaderText && this.trigger("change:activetab:title", newTabHeaderText[userLanguage] || newTabHeaderText);
    },
    doAnimationOfActiveTab: function(absCalcLeft) {
      let calcLeft = absCalcLeft;
      let duration = this.inDeleteFlow ? 0 : this?.duration ?? 0;
      this.inDeleteFlow = false;
      let styleObj = {};
      styleObj[DATA_ATTRS.ATTR_KEY] = -calcLeft + "px";
      $(this.tabLinksBar).animate(styleObj, duration, _.bind(function() {
        this._updateCIndexToFirstVisibile();
        this._showHideNavigationButtons();
      }, this));
    },
    _updateCIndexToFirstVisibile: function() {
      for (var i = this.cIndex - 1; i >= 0; i--) {
        var tabElement = this.tabLinksBarChildren[i];
        if (!this.isTabVisible(tabElement) && i != 0) {
          this.cIndex = i + 1;
          break;
        } else if (i == 0) {
          this.cIndex = i;
        }
      }
    },
    _listenToTabEvent: function() {
      var self = this;
      const scrollFun = function() {
        var scrollTop = Math.ceil(self.scrollspyTabContent.scrollTop), tabIndex = 0;
        self.tabContents.forEach(function(content) {
          if (content.offsetTop <= scrollTop && content.offsetTop + content.offsetHeight > scrollTop) {
            var tabId = content?.getAttribute("id");
            var listItem = self.el.querySelector('.tab-links-bar [href="#' + tabId + '"]')?.parentNode;
            if (!self.disableScrollSpyOnClick) {
              self.tabLinksBarChildren.forEach(function(item) {
                item.classList.remove("binf-active");
              });
              listItem?.classList.add("binf-active");
              self.tabContents.forEach(function(content) {
                content.classList.remove("binf-active");
              });
              content.classList.add("binf-active");
              content?.closest(".binf-tab-pane")?.classList?.add("binf-active");
            }
            setTimeout(function() {
              self.disableScrollSpyOnClick = undefined;
            }, 200);
            if (tabId) {
              tabId[0] === "#" && (tabId = tabId.substr(1));
              tabIndex = self._findTabIndexByID(tabId);
              if (!!self.tabContentHeader) {
                let userLanguage = SmartBase.getUserMetadataLanguageInfo();
                var newTabHeaderText = self?.collection?.models[tabIndex]?.attributes?.title;
                newTabHeaderText && self.trigger("change:activetab:title", newTabHeaderText[userLanguage] || newTabHeaderText);
              }
            }
            self.listItem = listItem;
            setTimeout(function() {
              if (self.listItem && !self.isTabVisible(self.listItem)) {
                self.scrollToActiveTab();
              } else {
                self._showHideNavigationButtons();
              }
            }, 200);
          }
        });
      };
      self.intializeTabVars();
      if (this.scrollspyTabContent) {
        this.scrollspyTabContent.removeEventListener("scroll", scrollFun);
        this.scrollspyTabContent.addEventListener("scroll", scrollFun);
      }
    },
    _listenToActiveTabClickEvent: function() {
      var self = this;
      const anonFun = function(event) {
        let target = event.target;
        let makeActivateClickedTab = false;
        let tagName = target.tagName.toLowerCase();
        if (target?.classList?.contains("cs-tablink-text") || target?.classList?.contains("cs-tablink") || target?.parentNode?.classList?.contains("smart-tab-contents-count")) {
          target = $(event.target).closest("li.smart-tab-panel-item");
          if (target?.hasClass("binf-active")) {
            makeActivateClickedTab = true;
          }
        }
        if (makeActivateClickedTab) {
          if (!self.isTabVisible(target[0])) {
            self.duration = 200;
            self.scrollToActiveTab();
            setTimeout(_.bind(function() {
              self.duration = 0;
            }, self));
          } else {
            self._showHideNavigationButtons();
          }
        }
      };
      this?.el?.removeEventListener("click", anonFun);
      this?.el?.addEventListener("click", anonFun);
    },
    _listenToTabIdEvent: function() {
      this._listenToTabEvent();
    },
    _findTabIndexByID: function(tabID) {
      var tabIndex = -1;
      var tabs = this.tablinksToolbar && this.tablinksToolbar.find(this.tabsSelector);
      if (tabs) {
        var i;
        for (i = 0; i < tabs.length; i++) {
          var href = $(tabs[i]).find(">a").attr("href");
          let domTitle = $(tabs[i]).find(">a").attr("title");
          let title = this?.collection?.models[i]?.attributes?.title;
          href[0] === "#" && (href = href.substr(1));
          let userLanguage = SmartBase.getUserMetadataLanguageInfo();
          title = (title && title[userLanguage] || title) ?? domTitle;
          if (tabID === href && domTitle === title) {
            tabIndex = i;
            break;
          } else {
            if (tabID === href) {
              let idx = 0, flag = false;
              let tabsArray = this.el.querySelectorAll(".smart-tab-panel-item");
              for (idx = 0; idx < tabsArray.length; idx++) {
                let ele = tabsArray[idx];
                let link = ele.querySelector(".smart-tablink");
                let linkHref = link.getAttribute("href");
                linkHref[0] === "#" && (linkHref = linkHref.substr(1));
                let collTitle = this?.collection?.models[idx]?.attributes?.title;
                collTitle = collTitle && collTitle[userLanguage] || collTitle;
                let collDomTitle = $(ele).find(">a").attr("title");
                if (linkHref === tabID && collTitle === collDomTitle) {
                  tabIndex = idx;
                  flag = true;
                  break;
                }
              }
              if (flag) {
                break;
              }
            }
          }
        }
      }
      return tabIndex;
    },
    _firstVisibleTabIndex: function(iTabs) {
      var tabIndex = -1;
      var tabs = iTabs === undefined ? this.tablinksToolbar && this.tablinksToolbar.find(this.tabsSelector) : iTabs;
      if (tabs) {
        var i;
        for (i = 0; i < tabs.length; i++) {
          if (this._isTablinkVisibleInParents($(tabs[i]))) {
            tabIndex = i;
            break;
          }
        }
      }
      return tabIndex;
    },
    _lastVisibleTabIndex: function(iTabs) {
      var tabIndex = -1;
      var tabs = iTabs === undefined ? this.tablinksToolbar && this.tablinksToolbar.find(this.tabsSelector) : iTabs;
      if (tabs) {
        var i;
        for (i = tabs.length - 1; i >= 0; i--) {
          if (this._isTablinkVisibleInParents($(tabs[i]))) {
            tabIndex = i;
            break;
          }
        }
      }
      return tabIndex;
    },
    _enableToolbarState: function(iTabs) {},
    _gotoPreviousTab: function(options) {
      Backbone.trigger("closeToggleAction");
      let calcLeft = 0;
      let deferred = $.Deferred();
      this.calculateMaxWidth().done(_.bind(function() {
        calcLeft = parseFloat(this.tabLinksBarChildren[this.cIndex]?.getAttribute(DATA_ATTRS.DATA_ATTR_KEY)) - parseFloat(this.tabLinksBarOuterParentWidth) + this.partiallyVisibileWidth;
      }, this));
      calcLeft = calcLeft > 0 ? calcLeft : 0;
      let duration = this.inDeleteFlow ? 0 : 200;
      this.inDeleteFlow = false;
      let styleObj = {};
      styleObj[DATA_ATTRS.ATTR_KEY] = -calcLeft + "px";
      $(this.tabLinksBar)?.animate(styleObj, duration, _.bind(function() {
        this._updateCIndexToFirstVisibile();
        this._showHideNavigationButtons();
        deferred.resolve();
      }, this));
      return deferred.promise();
    },
    _gotoNextTab: function(options) {
      Backbone.trigger("closeToggleAction");
      let deferred = $.Deferred();
      var width = 0, previousVisibileWidth = 0;
      previousVisibileWidth = this.cIndex == 0 ? 0 : this.partiallyVisibileWidth;
      this.calculateMaxWidth().done(_.bind(function() {
        for (var index = this.cIndex; index < this.tabLinksBarChildren.length; index++) {
          width = width + parseFloat(this.tabLinksBarChildren[index]?.getAttribute("data-width"));
          if (width + previousVisibileWidth > Math.ceil(this.tabLinksBarOuterParent.offsetWidth)) {
            this.cIndex = index;
            break;
          }
        }
        let calcLeft = parseFloat(this.tabLinksBarChildren[this.cIndex]?.getAttribute(DATA_ATTRS.DATA_ATTR_KEY)) - parseFloat(this.partiallyVisibileWidth);
        let styleObj = {};
        styleObj[DATA_ATTRS.ATTR_KEY] = -calcLeft + "px";
        $(this.tabLinksBar).animate(styleObj, 200, _.bind(function() {
          this._showHideNavigationButtons();
          deferred.resolve();
        }, this));
      }, this));
      return deferred.promise();
    },
    _showHideNavigationButtons: function() {
      let tabsVisibile;
      tabsVisibile = this.el.querySelectorAll(".binf-nav-tabs li:not(.binf-hidden)");
      if (this.isTabVisible(tabsVisibile[0]) && this.isTabVisible(tabsVisibile[tabsVisibile.length - 1])) {
        this.leftToolbar && this.leftToolbar.addClass("binf-hidden");
        this.rightToolbar && this.rightToolbar.addClass("binf-hidden");
      } else if (this.isTabVisible(tabsVisibile[0])) {
        this.leftToolbar && this.leftToolbar.addClass("binf-hidden");
        this.rightToolbar && this.rightToolbar.removeClass("binf-hidden");
      } else if (this.isTabVisible(tabsVisibile[tabsVisibile.length - 1])) {
        this.leftToolbar && this.leftToolbar.removeClass("binf-hidden");
        this.rightToolbar && this.rightToolbar.addClass("binf-hidden");
      } else {
        this.leftToolbar && this.leftToolbar.removeClass("binf-hidden");
        this.rightToolbar && this.rightToolbar.removeClass("binf-hidden");
      }
    },
    _autoScrollTabTo: function(index, options) {
      options || (options = {});
      var tabs = this.tablinksToolbar && this.tablinksToolbar.find(this.tabsSelector);
      var scrollOptions = _.extend({
        visibleTabIndex: index
      }, options, {
        tabs: tabs
      });
      var firstVisibleIndex = this._firstVisibleTabIndex(tabs);
      var lastVisibleIndex = this._lastVisibleTabIndex(tabs);
      if (firstVisibleIndex >= 0 && firstVisibleIndex < tabs.length && lastVisibleIndex >= 0 && lastVisibleIndex < tabs.length && index >= 0 && index < tabs.length) {
        this.autoScrollingLastTab = true;
        var deferred;
        if (index < firstVisibleIndex) {
          deferred = this._gotoPreviousTab(scrollOptions);
        } else if (index > lastVisibleIndex) {
          deferred = this._gotoNextTab(scrollOptions);
        } else {
          this.autoScrollingLastTab = false;
          return $.Deferred().resolve();
        }
        deferred.done(_.bind(function() {
          this.autoScrollingLastTab = false;
        }, this));
        return deferred;
      } else {
        return $.Deferred().resolve();
      }
    }
  };
  return TabLinksScrollMixin;
});