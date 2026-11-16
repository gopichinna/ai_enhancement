/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "hbs!smart/controls/progresspanel/progresspanel.wrapper", "i18n!smart/controls/progresspanel/progresspanel/impl/nls/progresspanel.lang" ], function(_, $, Backbone, Marionette, template, lang) {
  const ProgressPanelWrapperView = Marionette.LayoutView.extend({
    className: "smart-progresspanel-wrapper hide-all-btns",
    template: template,
    ui: {
      minimizeBtn: ".icon-progresspanel-minimize",
      progressPanelContainer: ".progresspanel-container",
      showlessBtn: ".showless",
      showMoreBtn: ".showmore",
      closeallBtn: ".closeall"
    },
    templateHelpers: function() {
      return {
        enableMinimiseButton: this.options.enableMinimiseButton,
        minimizeAria: lang.minimizeAria,
        minimizeTitle: lang.minimize,
        showLess: lang.ShowLessBtnText,
        showMore: lang.ShowMoreBtnText,
        closeAll: lang.CloseAllBtnText
      };
    },
    events: {
      click: "_onWrapperClick",
      "click @ui.minimizeBtn": "showMiniProgressbar",
      "click .smart-show-all-progress": "showAllProgressPanels",
      "click @ui.showMoreBtn": "showAllProgressPanels",
      "click @ui.showlessBtn": "collapseAllProgressPanels",
      "click @ui.closeallBtn": "_closeAllPanels",
      "keydown @ui.showlessBtn": "onKeyInShowlessBtn",
      "keydown @ui.showMoreBtn": "onKeyInShowMoreBtn",
      "keydown @ui.closeallBtn": "onKeyInCloseallBtn",
      keydown: "onKeyInWrapperView",
      mouseenter: "_handleWrapperMouseEnter",
      mouseleave: "_handleWrapperMouseLeave",
      focusin: "_handleWrapperFocusIn",
      focusout: "_handleWrapperFocusOut"
    },
    constructor: function ProgressPanelWrapperView(options = {}) {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.stackProgressPanels = [];
      options?.messageRegionView?.listenTo(this.options.messageRegionView, "add:progressPanelwrapper:eventhandlers", _.bind(this._addStackPanelsEventHandlers, this));
    },
    onRender: function() {
      this.progressPanelContainer = new Backbone.View({
        el: this.ui.progressPanelContainer
      });
    },
    _onWrapperClick: function() {
      this._handleWrapperMouseEnter();
      return;
    },
    _handleWrapperMouseEnter: function() {
      this.isHovered = true;
      this.$el?.removeClass("hide-all-btns");
    },
    _handleWrapperMouseLeave: function() {
      const _isKeyboardFocused = this._isKeyboardFocused();
      if (!_isKeyboardFocused && !this._isExpandedView()) {
        this.$el?.addClass("hide-all-btns");
      }
      this.isHovered = false;
    },
    _handleWrapperFocusIn: function() {
      const _isKeyboardFocused = this._isKeyboardFocused();
      _isKeyboardFocused && this.$el?.removeClass("hide-all-btns");
    },
    _handleWrapperFocusOut: function() {
      const _isKeyboardFocused = this._isKeyboardFocused();
      if (!_isKeyboardFocused && !this._isExpandedView()) {
        this.$el?.addClass("hide-all-btns");
      }
    },
    _isFocused: function() {
      return this._getAllFocusableElements()?.includes(document.activeElement);
    },
    _isKeyboardFocused: function() {
      return this._isFocused && document.activeElement.matches(":focus-visible");
    },
    _isExpandedView: function() {
      if (this.stackProgressPanels?.length > 1) {
        return this.$el?.hasClass("smart-expanded");
      }
      const panel = this.stackProgressPanels[this.stackProgressPanels?.length - 1];
      return this.$el?.hasClass("smart-expanded") || panel && panel.$el.hasClass("csui-expanded");
    },
    _addStackPanelsEventHandlers: function(view) {
      view.listenTo(view.collection, "change", _.bind(function() {
        this._getPanelStatus();
      }, this));
      this.options?.messageRegionView?.listenTo(this.options?.messageRegionView, "processing:completed processing:error", _.bind(this._onAllProcessCompleted, this));
      this.options?.messageRegionView?.listenTo(this.options?.messageRegionView, "collection:not:updated", _.bind(this._onAllProcessCompleted, this));
      view.listenTo(this.options?.messageRegionView, "show:stacked:panels", _.bind(function() {
        this._getPanelStatus();
        this.options?.messageRegionView.listenTo(this.options?.messageRegionView, "processing:error", _.bind(this._updateButtons, this));
        this.options?.messageRegionView.listenTo(this.options?.messageRegionView, "processbar:update", _.bind(this._onProcessPending, this));
      }, this));
      this.options?.messageRegionView?.listenTo(this.options?.messageRegionView, "processbar:update:overall", _.bind(this._updateOverAllProgress, this));
      this.options?.messageRegionView?.listenTo(this.options?.messageRegionView, "make:stack:panels", _.bind(this._makeStackPanels, this));
      this.options?.messageRegionView?.listenTo(this.options?.messageRegionView, "removepanel:from:stack", function(panels) {
        this.stackProgressPanels = panels;
      });
      this.options?.messageRegionView?.listenTo(this.options?.messageRegionView, "csui:after:hide", _.bind(this._onCsuiAfterHide, this));
      this.options?.messageRegionView?.listenTo(this.options?.messageRegionView, "processbar:maximize", _.bind(this._handleProgrecessbarMaximize, this));
      this.options?.messageRegionView?.progressView?.listenTo(this.options?.messageRegionView?.progressView, "processbar:maximize", _.bind(this._maximizeProgressbar, this));
    },
    _maximizeProgressbar: function() {
      this.$el.removeClass("binf-hidden");
    },
    _handleProgrecessbarMaximize: function(event) {
      if (!this.isDestroyed) {
        this.$el.removeClass("binf-hidden");
        const minimizeBtn = this.ui.minimizeBtn;
        if (minimizeBtn.length) {
          minimizeBtn[0]?.setAttribute("tabindex", 0);
          minimizeBtn[0]?.focus();
        } else {
          const allFocusableElements = this._getAllFocusableElements();
          allFocusableElements[0]?.setAttribute("tabindex", 0);
          allFocusableElements[0]?.focus();
          this.currentFocusIndex = 0;
        }
        this.stackProgressPanels?.forEach(panel => {
          panel.isProgressCompleted() && !panel.isProgressFailed() && panel.autoHideSuccessBanner();
        });
        if (event?.type === "click" && !this._isExpandedView()) {
          this.$el?.addClass("hide-all-btns");
        }
      }
    },
    _onCsuiAfterHide: function({
      panel,
      prevEle
    }) {
      if (!this.isDestroyed) {
        this._handleProgressBarStackRemove(panel);
        if (this.stackProgressPanels.length > 0) {
          if (this.stackProgressPanels.length <= 1) {
            this.collapseAllProgressPanels();
            this.ui.closeallBtn?.addClass("smart-hide-behind");
            this.ui.showMoreBtn?.addClass("smart-hide-behind");
          }
          this._makeStackPanels({
            panel: panel,
            prevEle: prevEle
          });
        } else {
          this.ui.minimizeBtn?.length && this.ui.minimizeBtn?.addClass("binf-hidden");
          this.destroy();
        }
      }
    },
    showMiniProgressbar: function() {
      this.$el.addClass("binf-hidden");
      this.options?.messageRegionView?.trigger("processbar:minimize");
      this.options?.messageRegionView?.progressView?.trigger("processbar:minimize");
      this._getPanelStatus();
    },
    showAllProgressPanels: function() {
      var progressPanels = this.$el.find(".csui-progresspanel");
      if (progressPanels.length > 1) {
        this.$el.addClass("smart-expanded");
        this.ui.showlessBtn.removeClass("smart-hide-behind");
        this.ui.showMoreBtn.addClass("smart-hide-behind");
        this.options?.messageRegionView?.trigger("show:stacked:panels");
        this._getAllFocusableElements()?.[0]?.focus();
        this.currentFocusIndex = 0;
      }
    },
    _onProcessPending: function() {
      this.$el?.find(".csui-minimize")?.removeClass("binf-hidden");
      this.$el?.hasClass("smart-expanded") && this.$el?.find(".showless")?.removeClass("binf-hidden");
      this.$el?.find(".closeall")?.addClass("smart-hide-behind");
    },
    _onAllProcessCompleted: function() {
      this.$el?.find(".csui-minimize")?.addClass("binf-hidden");
      this.$el?.find(".showless")?.addClass("binf-hidden");
      this.$el?.hasClass("smart-expanded") && this.$el?.find(".closeall").removeClass("smart-hide-behind");
    },
    _handleProgressBarStackRemove: function(panel) {
      if (panel) {
        this.stackProgressPanels = this.stackProgressPanels.filter(stackPanel => stackPanel?.cid !== panel?.cid);
        const allFocusableElements = this._getAllFocusableElements() || [];
        if (!allFocusableElements.includes(document.activeElement)) {
          allFocusableElements[0]?.setAttribute("tabindex", 0);
          allFocusableElements[0]?.focus();
        }
      }
    },
    collapseAllProgressPanels: function(event) {
      if (this.$el?.hasClass("smart-expanded")) {
        $(window).trigger("smart:progresspanel:collapse");
        this.$el.removeClass("smart-expanded");
        this.ui.showlessBtn.addClass("smart-hide-behind");
        const lastPP = this.stackProgressPanels[this.stackProgressPanels?.length - 1];
        if (lastPP) {
          const expandAction = lastPP.$el?.find(".csui-header .csui-expand-down");
          if (expandAction?.length) {
            expandAction?.trigger("focus");
          } else {
            this._getAllFocusableElements()?.[0]?.focus();
          }
        }
        if (this.stackProgressPanels?.length > 1) {
          this.ui.showMoreBtn?.removeClass("smart-hide-behind");
        } else {
          this.ui.showMoreBtn?.addClass("smart-hide-behind");
        }
      }
      setTimeout(function() {
        if (event?.type === "click" && !this.isHovered) {
          this.$el?.addClass("hide-all-btns");
        }
      }, 600);
    },
    _closeAllPanels: function() {
      if (this.$el.hasClass("smart-expanded")) {
        this.$el?.find(".closeall")?.slideUp();
        $(window).trigger("smart:progresspanel:closeall");
      }
    },
    _updateOverAllProgress: function(percentage) {
      this.overallProgress = percentage || 0;
    },
    _updateButtons: function() {
      if (this.$el.hasClass("smart-expanded")) {
        this.$el.find(".showless").addClass("binf-hidden");
        this.$el.find(".closeall").removeClass("smart-hide-behind");
      }
    },
    onKeyInShowlessBtn: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.collapseAllProgressPanels(event);
        event.preventDefault();
      }
    },
    onKeyInShowMoreBtn: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.showAllProgressPanels();
        event.preventDefault();
      }
    },
    onKeyInCloseallBtn: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this._closeAllPanels();
        event.preventDefault();
      }
    },
    onKeyInWrapperView: function(event) {
      if (event.keyCode === 9) {
        const activeElement = document.activeElement, allFocusableElements = this._getAllFocusableElements();
        let focusIndex = allFocusableElements?.length ? allFocusableElements.indexOf(activeElement) : -1, nextFocusIndex = focusIndex;
        if (event.shiftKey) {
          nextFocusIndex--;
        } else {
          nextFocusIndex++;
        }
        const nextFocusableEl = allFocusableElements[nextFocusIndex];
        this.currentFocusIndex = nextFocusIndex;
        if (nextFocusIndex < 0) {
          allFocusableElements[0]?.setAttribute("tabindex", 0);
          this.currentFocusIndex = 0;
          return;
        } else if (nextFocusIndex >= allFocusableElements.length) {
          allFocusableElements[allFocusableElements.length - 1]?.setAttribute("tabindex", 0);
          this.currentFocusIndex = allFocusableElements?.length - 1;
          return;
        }
        if (nextFocusableEl) {
          allFocusableElements.forEach(el => {
            el?.setAttribute("tabindex", -1);
          });
          const lastChildItem = activeElement.closest(".csui-progressbar.csui-progressrow");
          lastChildItem?.classList.remove("focused-row");
          const nextChildItem = nextFocusableEl.closest(".csui-progressbar.csui-progressrow");
          nextChildItem?.classList.add("focused-row");
          nextFocusableEl.setAttribute("tabindex", 0);
          nextFocusableEl.focus();
          event.preventDefault();
        } else {
          allFocusableElements[0]?.setAttribute("tabindex", 0);
          allFocusableElements[0]?.focus();
          this.currentFocusIndex = 0;
        }
      }
    },
    _getAllFocusableElements: function() {
      let allFocusableElements = [], smartWrapper = this.$el;
      for (let i = this.stackProgressPanels?.length - 1; i >= 0; i--) {
        const panel = this.stackProgressPanels[i];
        const headerEls = panel?._getAllFocusableElements() || [];
        allFocusableElements = [ ...allFocusableElements, ...headerEls ];
        if (i === this.stackProgressPanels.length - 1) {
          const minimizeBtn = smartWrapper?.find(".miniprogressbar-btn-wrapper .csui-minimize button:visible");
          if (minimizeBtn?.length) {
            allFocusableElements.push(minimizeBtn[0]);
          }
          if (!smartWrapper.hasClass("smart-expanded") && this.stackProgressPanels.length > 1) {
            break;
          }
        }
        if (panel.$el.hasClass("csui-expanded")) {
          const childEls = panel?._getChildFocusableElements() || [];
          allFocusableElements = [ ...allFocusableElements, ...childEls ];
        }
      }
      const smartBtn = smartWrapper?.find(".progresspanel-btn-wrapper *[tabindex]:not(.smart-hide-behind)").not(".binf-hidden");
      if (smartBtn?.length) {
        allFocusableElements.push(smartBtn[0]);
      }
      return allFocusableElements;
    },
    _getPanelStatus: function() {
      var failed = this.$el.find(".processing-error").length, completed = this.$el.find(".processing-completed").length, pending = this.$el.find(".processing-update").length;
      if (failed && !pending) {
        this.options?.messageRegionView?.trigger("processing:error");
      } else if (!pending && completed) {
        this.options?.messageRegionView?.trigger("processing:completed");
      } else {
        this.options?.messageRegionView?.trigger("processbar:update", this.overallProgress);
      }
      const allFocusableElements = this._getAllFocusableElements();
      if (allFocusableElements.includes(document.activeElement) && allFocusableElements[this.currentFocusIndex] && document.activeElement !== allFocusableElements[this.currentFocusIndex]) {
        allFocusableElements[this.currentFocusIndex]?.setAttribute("tabindex", 0);
        allFocusableElements[this.currentFocusIndex]?.focus();
      } else if (!allFocusableElements[this.currentFocusIndex]) {
        allFocusableElements[0]?.setAttribute("tabindex", 0);
      } else if (allFocusableElements[this.currentFocusIndex]) {
        allFocusableElements[this.currentFocusIndex]?.setAttribute("tabindex", 0);
      }
    },
    _makeStackPanels: function({
      panel,
      prevEle
    }) {
      var existingDialogs = this.$el.find(".csui-progresspanel.csui-global-message");
      if (existingDialogs.length) {
        var currentProgressBar = prevEle ? prevEle : panel.el, previousProgessBar = existingDialogs.length > 1 ? $(currentProgressBar.previousElementSibling) : null, olderProgessBar = existingDialogs.length > 2 ? $(currentProgressBar.previousElementSibling?.previousElementSibling) : null;
        $(currentProgressBar).css({
          top: "0"
        });
        if ($(currentProgressBar).hasClass("prev-progess-bar-ele")) {
          $(currentProgressBar).removeClass("prev-progess-bar-ele");
        }
        if (previousProgessBar) {
          previousProgessBar.addClass("prev-progess-bar-ele").removeClass("old-progess-bar-ele");
        }
        if (olderProgessBar) {
          olderProgessBar.addClass("old-progess-bar-ele").removeClass("prev-progess-bar-ele");
        }
      }
      if (existingDialogs) {
        if (!this.isDestroyed) {
          this.ui.showMoreBtn?.removeClass("right-x-32");
          this.ui.showMoreBtn?.removeClass("right-x-16");
          if (existingDialogs.length === 1) {
            $(existingDialogs[0]).removeClass("prev-progess-bar-ele");
            $(existingDialogs[0]).removeClass("old-progess-bar-ele");
            if (!panel?.isDestroyed) {
              this.ui.showMoreBtn?.addClass("right-x-16");
            } else {
              this.ui.showMoreBtn?.addClass("smart-hide-behind");
            }
          } else if (existingDialogs.length === 2) {
            $(existingDialogs[1]).removeClass("prev-progess-bar-ele");
            $(existingDialogs[0]).removeClass("old-progess-bar-ele");
            $(existingDialogs[0]).addClass("prev-progess-bar-ele");
            if (!panel?.isDestroyed) {
              this.ui.showMoreBtn?.addClass("right-x-32");
            } else {
              this.ui.showMoreBtn?.addClass("right-x-16");
            }
          } else if (existingDialogs.length > 2) {
            this.ui.showMoreBtn?.addClass("right-x-32");
          }
          if (existingDialogs.length > 1) {
            this.ui.showMoreBtn?.removeClass("smart-hide-behind");
          }
        }
      }
    }
  });
  return ProgressPanelWrapperView;
});