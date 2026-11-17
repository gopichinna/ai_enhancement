/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette", "csui/lib/jquery", "csui/perspective.manage/pman.view", "csui/utils/non-emptying.region/non-emptying.region", "csui/utils/contexts/factories/connector", "csui/perspective.manage/impl/top.ribbon/top.ribbon.view", "csui/perspective.manage/mixins/landing.page.pman.mixin", "csui/perspective.manage/mixins/landing.page.pman.carousel.mixin", "csui/utils/perspective/perspective.util", "i18n!csui/perspective.manage/impl/nls/lang", "hbs!csui/perspective.manage/impl/landing.page.pman", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "css!csui/perspective.manage/impl/landing.page.pman" ], function(Marionette, $, PManView, NonEmptyingRegion, ConnectorFactory, TopRibbonView, LandingPagePmanMixin, LandingPagePmanCarouselMixin, PerspectiveUtil, lang, template, theming, jatoActionIcons) {
  let LandingPagePManView = PManView.extend({
    className: function() {
      return `${PManView.prototype.className.call(this)} pman-landing-page`;
    },
    ui: Object.assign({
      topRibbonCarousel: ".csui-top-ribbon-carousel",
      topRibbon: ".pman-top-ribbon",
      topRibbonControlButton: ".csui-carousel-control",
      prevButton: ".csui-prev-button",
      nextButton: ".csui-next-button",
      addPageBtn: ".csui-add-new-page"
    }, PManView.prototype.ui),
    events: Object.assign({
      "click @ui.topRibbonControlButton": "onClickSlide",
      "click @ui.addPageBtn": "onClickAdd",
      "keydown @ui.topRibbonControlButton": "onClickSlide",
      "keydown @ui.addPageBtn": "onKeyInAddPageBtn",
      "keydown @ui.prevButton": "onKeyInprevButton"
    }, PManView.prototype.events),
    template: template,
    templateHelpers: function() {
      let helpers = PManView.prototype.templateHelpers.call(this);
      return {
        ...helpers,
        ...{
          cancel: lang.close,
          previousTitle: lang.previousTitle,
          nextTitle: lang.nextTitle,
          addPageTitle: lang.addPerspective,
          isJATO: theming.isJATOTheme(),
          carouselLeftSVG: jatoActionIcons.actionChevronLargeLeft,
          carouselRightSVG: jatoActionIcons.actionChevronLargeRight,
          iconActionAdd: jatoActionIcons.actionAdd,
          helpSVG: jatoActionIcons.actionHelpCircle
        }
      };
    },
    constructor: function LandingPagePManView(options) {
      let self = this;
      PManView.prototype.constructor.call(this, options);
      this.connector = this.options.context.getObject(ConnectorFactory);
      this.departmentMap = {};
      this.listenTo(this, "toggle:carousel", function(e) {
        this.toggleCarousel(e);
      }).listenTo(this, "enable:carousel", this.enableCarousel).listenTo(this, "toggle:save", this.toggleSave).listenTo(this.context, "finish:serialize:welcomepage", this.onFinishSerializeWelcomePage).listenTo(this.context, "finish:enter:edit:perspective", this.onFinishEnterEditPerspective);
      $(window).on("resize.landingpagepmanview", this.toggleCarousel.bind(this));
    },
    onShow: function() {
      this.options.container.addClass("csui-top-ribbon-enabled");
      this.toggleCarousel();
    },
    onFinishEnterEditPerspective: function() {
      !this._isShown && this.show();
      this.context.trigger("unblock:actions");
    },
    show: function() {
      var container = this.getContainer(), region = new NonEmptyingRegion({
        el: container
      });
      region.show(this, {
        render: false
      });
      return this;
    },
    _initializeWidgets: function() {
      this.topRibbonRegion = new Marionette.Region({
        el: this.ui.topRibbon
      });
      this.topRibbonView = new TopRibbonView({
        context: this.context,
        parentView: this
      });
      this.topRibbonRegion.show(this.topRibbonView);
    },
    _doCleanup: function() {
      this.options.container.removeClass("csui-top-ribbon-enabled");
      PManView.prototype._doCleanup.apply(this, arguments);
    },
    _doExitPerspective: async function() {
      try {
        if (this.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
          await this.loadDefaultPerspective();
        }
      } catch (err) {
        console.error(err);
      } finally {
        PManView.prototype._doExitPerspective.apply(this, arguments);
      }
    },
    onBeforeDestroy: function() {
      $(window).off("resize.landingpagepmanview");
      this.context.pmanView = undefined;
    },
    _changeLayout: function(newLayoutType) {
      PManView.prototype._changeLayout.call(this, newLayoutType);
      let cView = this.topRibbonView.children.find(c => c.model === this.perspective);
      cView?.render();
      cView?.markPerspectiveAsModified();
    },
    _swapLayout: function(newLayoutType) {
      PManView.prototype._swapLayout.call(this, newLayoutType);
      let cView = this.topRibbonView.children.find(c => c.model === this.perspective);
      cView?.render();
      cView?.markPerspectiveAsModified();
    },
    onClickAdd: function() {
      let nextPerspectiveModel = this.topRibbonView.createNewPerspectiveModel();
      this.options.context.triggerMethod("serialize:welcomepage", this.perspective, "add", nextPerspectiveModel, true);
    },
    onClickSlide: function(event) {
      let topRibbonActionDropdown = document.querySelectorAll(".csui-top-ribbon-actions-dropdown-toggle");
      if (event.type === "keydown") {
        switch (event.key) {
         case "ArrowLeft":
          if (!$(event.target).is(this.ui.prevButton)) {
            topRibbonActionDropdown[topRibbonActionDropdown.length - 1].focus();
          }
          break;

         case "ArrowRight":
          if ($(event.target).is(this.ui.prevButton)) {
            topRibbonActionDropdown[0].focus();
          } else {
            document.querySelectorAll(".csui-top-ribbon-actions otc-button")[0]?.focus();
          }
          break;

         case "Tab":
          document.querySelectorAll(".csui-pman-sidebar-ribbon otc-button")[0]?.focus();
          event.preventDefault();
        }
      } else {
        this.slide(event);
        event.preventDefault();
      }
    },
    onClickSave: function() {
      this.options.context.triggerMethod("serialize:welcomepage", this.perspective, "save", null, false);
    },
    onClickClose: async function() {
      this.options.context.triggerMethod("serialize:welcomepage", this.perspective, "close", null, true);
    },
    toggleSave: function() {
      if (this.el.querySelectorAll(".csui-server-error-perspective").length > 0 || this.el.querySelectorAll(".csui-error-perspective").length > 0 || this.topRibbonView.collection.modifiedCount == 0) this.ui.saveBtn[0].disabled = true; else this.ui.saveBtn[0].disabled = false;
    },
    onKeyInAddPageBtn: function(event) {
      let toolButtons = document.querySelectorAll(".pman-right-tools button");
      let topRibbonlayouts;
      switch (event.key) {
       case "ArrowLeft":
        topRibbonlayouts = this.topRibbonView.el.querySelectorAll(".csui-top-ribbon-layout");
        topRibbonlayouts[topRibbonlayouts.length - 1].focus();
        break;

       case "Tab":
        if (event.shiftKey && event.key === "Tab" && $(event.target).is(this.ui.addPageBtn)) {
          toolButtons[toolButtons.length - 1].focus();
          event.preventDefault();
        } else {
          document.querySelectorAll(".csui-pman-sidebar-ribbon otc-button")[0].focus();
          event.preventDefault();
        }
      }
    },
    onKeyInprevButton: function(event) {
      let toolButtons;
      switch (event.key) {
       case "ArrowLeft":
        topRibbonPerspectiveActions[topRibbonPerspectiveActions.length - 1].focus();
        break;

       case "Tab":
        if (event.shiftKey && event.key === "Tab" && $(event.target).is(this.ui.prevButton)) {
          toolButtons = document.querySelectorAll(".pman-right-tools button");
          toolButtons[toolButtons.length - 1].focus();
          event.preventDefault();
        } else {
          this.trigger("toggle:carousel", event);
          this.topRibbonView.el.querySelectorAll(".csui-top-ribbon-layout")[0].focus();
          event.preventDefault();
        }
      }
    },
    _setFocusOnFirstWidget: function(event) {
      if (event?.target.classList.contains("pman-cancel-edit")) {
        if (!this.ui.prevButton[0].disabled) {
          this.ui.prevButton[0].focus();
        } else {
          this.topRibbonView.el.querySelectorAll(".csui-top-ribbon-layout")[0].focus();
        }
      } else if (!!event && this.mode === "personalize") {
        PManView.prototype._setFocusOnFirstWidget.call(this);
      } else {
        let activePerspective = this.topRibbonView.el.querySelector(".binf-active .csui-top-ribbon-layout");
        activePerspective.focus();
      }
    }
  });
  LandingPagePmanMixin.mixin(LandingPagePManView.prototype);
  LandingPagePmanCarouselMixin.mixin(LandingPagePManView.prototype);
  return LandingPagePManView;
});