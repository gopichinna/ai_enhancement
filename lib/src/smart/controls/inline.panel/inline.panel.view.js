/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette3", "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "smart/behaviors/keyboard.navigation/smart.tabables.behavior", "smart/controls/inline.panel/resizer/inline.panel.resizer.view", "hbs!smart/controls/inline.panel/impl/inline.panel", "smart/utils/non-emptying.region/non-emptying.region", "nuc/utils/log", "smart/utils/smart.base", "smart/themes/theming", "css!smart/controls/inline.panel/impl/inline.panel", "smart/lib/binf/js/binf" ], function(module, _, $, Marionette, LayoutViewEventsPropagationMixin, TabablesBehavior, InlinePanelResizer, template, NonEmptyingRegion, log, smartBase, theming) {
  log = log(module.id);
  const SMART_INLINEPANEL_SIBLING_CLS = "smart-inlinepanel-siblings";
  const SMART_INLINEPANEL_CLOSE_CLS = "smart-inlinepanel-close";
  const SMART_INLINEPANEL_OPEN_CLS = "smart-inlinepanel-open";
  const DEFAULTS = {
    resize: false,
    parentElement: document.querySelector(".csui-perspective-view"),
    width: "30%",
    openFrom: undefined
  };
  let InlinePanelView = Marionette.View.extend({
    className: function() {
      var classNames = [ `smart-inlinepanel ${SMART_INLINEPANEL_SIBLING_CLS} csui-normal-scrolling` ];
      if (!!this.options.inlinePanelClassName) {
        classNames.push(this.options.inlinePanelClassName);
      }
      if (InlinePanelView.SUPPORTED_SLIDE_ANIMATIONS.indexOf(this.options.openFrom) !== -1) {
        classNames.push("smart-inlinepanel--from-" + this.options.openFrom);
      }
      return _.unique(classNames).join(" ");
    },
    getAttributes: function() {
      return {
        tabindex: -1,
        "aria-label": this.options.ariaLabel ?? this.options.title ?? ""
      };
    },
    template: false,
    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior,
        recursiveNavigation: false,
        containTabFocus: true
      }
    },
    events: {
      keydown: "handleKeyDown"
    },
    constructor: function InlinePanelView(options = {}) {
      options = _.defaults(options, DEFAULTS);
      options.openFrom = smartBase.isRTL() ? "left" : "right";
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      this.listenToOnce(this, "destroy:inline:panel", this._doDestroy);
    },
    show: function(callback) {
      this.trigger("before:show");
      this.wrapperEle = this.options.parentElement;
      this.wrapperEle.addClass("smart-inlinepanel-wrapper");
      this.siblingEle = this.wrapperEle.find(">*");
      this.siblingEle.addClass(SMART_INLINEPANEL_SIBLING_CLS);
      this.siblingEle.addClass("smart-inlinepanel-left-column");
      if (this.options.resize) {
        this.resizerView = new InlinePanelResizer({});
        let resizeContainer = this.wrapperEle, resizeRegion = new NonEmptyingRegion({
          el: resizeContainer
        });
        resizeRegion.show(this.resizerView);
      }
      let inlinePanelRegion = new NonEmptyingRegion({
        el: this.wrapperEle
      });
      inlinePanelRegion.show(this);
      setTimeout(_.bind(this._doShow, this));
      return this;
    },
    _applyResize: function(leftColumn, resizer, rightColumn) {
      let throttleTimeout;
      function onMouseMove(e) {
        if (!throttleTimeout) {
          throttleTimeout = setTimeout(() => {
            throttleTimeout = null;
            const containerOffsetLeft = resizer.parentNode.offsetLeft;
            const pointerRelativeXpos = e.clientX - containerOffsetLeft;
            const leftColumnMinWidth = 100;
            const rightColumnMinWidth = 100;
            const totalWidth = resizer.parentNode.offsetWidth;
            if (pointerRelativeXpos > leftColumnMinWidth && pointerRelativeXpos < totalWidth - rightColumnMinWidth) {
              let leftColumnWidth = pointerRelativeXpos / totalWidth * 100;
              leftColumnWidth = Math.max(leftColumnWidth, 25);
              leftColumnWidth = Math.min(leftColumnWidth, 75);
              let rightColumnWidth = 100 - leftColumnWidth - .6;
              let isRTL = smartBase.isRTL();
              if (isRTL) {
                leftColumn.style.flex = `0 0 ${rightColumnWidth}%`;
                rightColumn.style.flex = `0 0 ${leftColumnWidth}%`;
              } else {
                leftColumn.style.flex = `0 0 ${leftColumnWidth}%`;
                rightColumn.style.flex = `0 0 ${rightColumnWidth}%`;
              }
              updatePanelAnimation(leftColumnWidth, rightColumnWidth);
            }
          }, 16);
        }
      }
      function updatePanelAnimation(leftColumnWidth, rightColumnWidth) {
        leftColumn.style.setProperty("--panel-start", `${leftColumnWidth}%`);
        leftColumn.style.setProperty("--panel-end", `${100 - 1}%`);
        rightColumn.style.setProperty("--panel-start", `${100 - leftColumnWidth}%`);
        rightColumn.style.setProperty("--panel-end", `${100 - 99}%`);
      }
      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }
      const resizeObserver = new window.ResizeObserver(entries => {
        for (let entry of entries) {
          const width = entry.contentRect.width;
          if (width < 768 - 112) {
            leftColumn.classList.remove("smart-content-md", "smart-content-lg", "smart-content-xl");
            leftColumn.classList.add("smart-content-sm");
          } else if (width < 992 - 120) {
            leftColumn.classList.remove("smart-content-sm", "smart-content-lg", "smart-content-xl");
            leftColumn.classList.add("smart-content-md");
          } else if (width < 1440 - 128) {
            leftColumn.classList.remove("smart-content-sm", "smart-content-md", "smart-content-xl");
            leftColumn.classList.add("smart-content-lg");
          } else {
            leftColumn.classList.remove("smart-content-sm", "smart-content-md", "smart-content-lg");
            leftColumn.classList.add("smart-content-xl");
          }
          this._triggerWindowResize();
        }
        resizer.addEventListener("mousedown", e => {
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });
      });
      resizeObserver.observe(leftColumn);
    },
    _doShow: function() {
      document.body.classList.add(SMART_INLINEPANEL_OPEN_CLS);
      this.siblingEle.addClass("csui-normal-scrolling");
      this.options.resize && this._applyResize(this.siblingEle[0], this.resizerView.el, this.el);
      this._registerEventHandlers();
      this._showContentView();
      this.trigger("after:show");
    },
    _doDestroy: function() {
      this._doCleanup();
    },
    _doCleanup: function() {
      this.options.resize && this.resizerView && this.resizerView.trigger("destroy");
      document.body.classList.add(SMART_INLINEPANEL_CLOSE_CLS);
      this._resetStylesOnClose(this.siblingEle[0], this.el);
      smartBase.onTransitionEnd(this.$el, _.bind(function() {
        this.wrapperEle.removeClass("smart-inlinepanel-wrapper");
        this.siblingEle.removeClass("csui-normal-scrolling");
        this.siblingEle.removeClass("smart-inlinepanel-left-column");
        this.siblingEle.removeClass(SMART_INLINEPANEL_SIBLING_CLS);
        document.body.classList.remove(SMART_INLINEPANEL_OPEN_CLS);
        document.body.classList.remove(SMART_INLINEPANEL_CLOSE_CLS);
        this._triggerWindowResize();
        Marionette.View.prototype.destroy.call(this);
      }, this));
    },
    _resetStylesOnClose: function(leftColumn, rightColumn) {
      leftColumn.style.removeProperty("--panel-start");
      leftColumn.style.removeProperty("--panel-end");
      leftColumn.style.removeProperty("flex");
      leftColumn.style.flex = "";
      leftColumn.style.animation = "";
      rightColumn.style.flex = "";
    },
    _showContentView: function() {
      var contentViewRegion = new NonEmptyingRegion({
        el: this.el
      });
      this.listenToOnce(this.options.contentView, "show", _.bind(function() {
        this.listenToOnce(this.options.contentView, "before:destroy", _.bind(function() {
          this.trigger("destroy:inline:panel");
        }, this));
      }, this));
      contentViewRegion.show(this.options.contentView);
      this._triggerWindowResize();
    },
    _handleClick: function() {
      this.$el.off("click", this._handleClick);
      this.trigger("destroy:inline:panel");
    },
    _triggerWindowResize: function() {
      setTimeout(function() {
        window.dispatchEvent(new Event("resize"));
      }, 300);
    },
    _registerEventHandlers: function() {},
    onSetFocus: function() {
      this._focusonFirstFocusableElement();
    },
    _focusonFirstFocusableElement: function() {
      var contFocusableElements = smartBase.findFocusables(this.el);
      contFocusableElements?.first().trigger("focus");
    }
  }, {
    SUPPORTED_SLIDE_ANIMATIONS: [ "left", "right" ]
  });
  LayoutViewEventsPropagationMixin.mixin(InlinePanelView.prototype);
  return InlinePanelView;
});