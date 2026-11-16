/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/controls/tab.panel/behaviors/common.keyboard.behavior.mixin", "smart/utils/smart.base", "i18n" ], function(_, $, Marionette, KeyboardBehaviorMixin, smartbase, i18n) {
  "use strict";
  var TabLinksKeyboardBehavior = Marionette.Behavior.extend({
    constructor: function TabLinksKeyboardBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      view.keyboardBehavior = this;
      this.tabableElements = [];
      var self = this;
      this.listenTo(view, "refresh:tabable:elements", function(tabPanel) {
        self.refreshTabableElements(view, tabPanel);
      });
      KeyboardBehaviorMixin.mixin(view);
      _.extend(view, {
        _setFirstAndLastFocusable: function(event) {
          if (this.keyboardBehavior.tabableElements.length > 0) {
            var $elem = $(this.keyboardBehavior.tabableElements[0]).prop("tabindex", "-1");
            var lastElemIndex = this.keyboardBehavior.tabableElements.length - 1;
            if ($elem.is("a")) {
              $elem = $(this.keyboardBehavior.tabableElements[lastElemIndex]);
              $elem.prop("tabindex", "-1");
              while (!$elem.is("a") && lastElemIndex > 0) {
                lastElemIndex--;
                $elem = $(this.keyboardBehavior.tabableElements[lastElemIndex]);
              }
              $elem.prop("tabindex", "-1");
            }
          }
          var tabEle = this.$el.find(".smart-tab-panel-item"), tabbleEle = tabEle.filter("*[tabindex=0]");
          if (!tabbleEle.length) {
            tabEle.first().attr("tabindex", 0);
          }
        },
        _autoScrollUntilElemIsVisible: function($elem) {
          var $tabLink = $elem;
          if ($tabLink?.is("li")) {
            var tabPanel = this.options && this.options.tabPanel;
            var tabID = $tabLink?.find(".cs-tablink")?.attr("href");
            tabID && tabID[0] === "#" && (tabID = tabID?.substr(1));
            if (tabPanel && tabPanel._isTablinkVisibleInParents($tabLink) === false) {
              var tabIndex = tabPanel._findTabIndexByID ? tabPanel._findTabIndexByID(tabID) : -1;
              if (tabIndex >= 0) {
                tabPanel.skipAutoScroll = true;
                var options = {
                  animationOff: true
                };
                tabPanel?.scrollToFocusedTab(tabIndex, options);
                tabPanel.skipAutoScroll = false;
              }
            }
          }
        },
        onKeyInView: function(event) {
          var ret;
          if (this.keyboardBehavior.tabableElements.length === 0) {
            return ret;
          }
          this.keyboardBehavior.keyboardActionDeleteTabPosition = undefined;
          var self = this;
          var _focusOnTabContent = function(e) {
            var liElem = self?.keyboardBehavior?.tabableElements[self?.currentTabPosition], $hrefElem = $(liElem)?.find("a");
            e.preventDefault();
            e.stopPropagation();
            var tabPanel = self.options && self.options.tabPanel;
            tabPanel && (tabPanel.skipAutoScroll = true);
            $hrefElem.trigger("click");
            if (self.keyboardBehavior.keyboardActionDeleteTabPosition === undefined) {
              setTimeout(function() {
                var href = $hrefElem.attr("href");
                var focusEvent = $.Event("tab:content:focus", {
                  tabId: href
                });
                self.$el.trigger(focusEvent);
                tabPanel && (tabPanel.skipAutoScroll = false);
              }, 100);
            }
          };
          if (event.keyCode === 9) {
            this.activeEle = $(document.activeElement);
            this.activeEle.attr("tabindex", "0");
            if (event.shiftKey) {
              if (!this.activeEle.hasClass("smart-tab-panel-item")) {
                let liEle = this.$el?.find(".binf-active");
                this._autoScrollUntilElemIsVisible(liEle);
                ret = liEle;
              }
            }
            if (!event.shiftKey && this.activeEle.hasClass("smart-tab-panel-item")) {
              let lastEle = this.$el?.find("*[data-cstabindex]")?.filter(":visible")?.first();
              ret = lastEle?.length ? lastEle : undefined;
            }
          }
          if (event.keyCode === 35) {
            var el = this.$el.find(".cs-tablink").length - 1, endEl = el && $(this.keyboardBehavior.tabableElements[el]);
            this._autoScrollUntilElemIsVisible(endEl);
            ret = endEl;
          }
          if (event.keyCode === 36) {
            var homeEl = $(this.keyboardBehavior.tabableElements[0]);
            this._autoScrollUntilElemIsVisible(homeEl);
            ret = homeEl;
          }
          if (event.keyCode === 37) {
            document.activeElement.setAttribute("tabindex", "-1");
            var $el = smartbase.isRTL() ? this._accSetFocusToPreviousOrNextElement() : this._accSetFocusToPreviousOrNextElement(true);
            this._autoScrollUntilElemIsVisible($el);
            ret = $el;
          }
          if (event.keyCode === 39) {
            document.activeElement.setAttribute("tabindex", "-1");
            var $ele = smartbase.isRTL() ? this._accSetFocusToPreviousOrNextElement(true) : this._accSetFocusToPreviousOrNextElement();
            this._autoScrollUntilElemIsVisible($ele);
            if ($ele?.hasClass("smart-tab-panel-item")) {
              ret = $ele;
            }
          } else if (event.keyCode === 32 || event.keyCode === 13) {
            _focusOnTabContent.call(this, event);
          } else if (event.keyCode === 46) {
            var hrefElem = this.keyboardBehavior.tabableElements[this.currentTabPosition];
            if (hrefElem?.querySelector(".cs-delete-icon")) {
              event.preventDefault();
              event.stopPropagation();
              this.keyboardBehavior.keyboardActionDeleteTabPosition = this.currentTabPosition - 1;
              this.options.tabPanel.isKeyEvent = true;
              hrefElem?.querySelector(".cs-delete-icon").click();
            }
          }
          return ret;
        }
      });
    },
    refreshTabableElements: function(view, tabPanel) {
      this.tabableElements = view.$el.find("li.smart-tab-panel-item:not(.binf-hidden), *[data-cstabindex]");
      var i;
      for (i = this.tabableElements.length - 1; i >= 0; i--) {
        if ($(this.tabableElements[i]).attr("data-cstabindex") === "-1") {
          this.tabableElements.splice(i, 1);
        }
      }
      this.view.currentTabPosition = -1;
      if (this.keyboardActionDeleteTabPosition !== undefined) {
        var $elem = $(this.tabableElements[this.keyboardActionDeleteTabPosition]);
        if ($elem && $elem.length > 0) {
          this.view.currentTabPosition = this.keyboardActionDeleteTabPosition;
          this.view._autoScrollUntilElemIsVisible($elem);
          $elem?.trigger("focus");
        }
        this.keyboardActionDeleteTabPosition = undefined;
      }
      setTimeout(function() {
        view._setFirstAndLastFocusable && view._setFirstAndLastFocusable();
      }, 50);
    }
  });
  return TabLinksKeyboardBehavior;
});