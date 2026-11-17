/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "smart/mixins/generic.utilities/footerview.responsiveness.mixin", "smart/behaviors/keyboard.navigation/smart.tabables.behavior", "smart/controls/dialog/footer.view", "smart/controls/dialog/header.view", "hbs!smart/controls/dialog/impl/dialog", "i18n!smart/controls/dialog/impl/nls/lang", "smart/utils/non-emptying.region/non-emptying.region", "nuc/utils/log", "i18n", "css!smart/controls/dialog/impl/dialog", "smart/lib/binf/js/binf", "smart/utils/otwc.loader", "smart/themes/carbonfiber/ot-icons/icons_smart_action" ], function(module, _, $, Backbone, Marionette, LayoutViewEventsPropagationMixin, FooterViewResponsiveMixin, TabablesBehavior, DialogFooterView, DialogHeaderView, dialogTemplate, lang, NonEmptyingRegion, log, i18n) {
  log = log(module.id);
  var DialogView = Marionette.LayoutView.extend({
    className: function() {
      var className = "cs-dialog binf-modal binf-fade";
      if (this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    },
    attributes: {
      tabindex: "-1"
    },
    template: dialogTemplate,
    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior,
        recursiveNavigation: true,
        containTabFocus: true
      }
    },
    regions: {
      body: ".binf-modal-body",
      header: ".binf-modal-header",
      footer: ".binf-modal-footer"
    },
    ui: {
      header: ".binf-modal-header",
      footer: ".binf-modal-footer",
      container: ".binf-modal-content",
      body: ".binf-modal-body"
    },
    events: {
      "hide.binf.modal": "onHiding",
      "hidden.binf.modal": "onHidden",
      "click .cs-close": "onClickClose",
      "shown.binf.modal": "onShown",
      keyup: "onKeyInView",
      keydown: "onKeyDownInView",
      setCurrentTabFocus: "setCurrentTabFocus",
      tabNextRegion: "tabNextRegion",
      "click .tile-type-action-icon": "onClickActionIcon"
    },
    templateHelpers: function() {
      var binfDialogSizeClassName = "";
      !!this.options.fullSize && (binfDialogSizeClassName = "binf-modal-full");
      !!this.options.largeSize && (binfDialogSizeClassName = "binf-modal-lg");
      !!this.options.midSize && (binfDialogSizeClassName = "binf-modal-md");
      !!this.options.smallSize && (binfDialogSizeClassName = "binf-modal-sm");
      return {
        binfDialogSizeClassName: binfDialogSizeClassName,
        bodyMessage: this.options.bodyMessage,
        title: this.options.title
      };
    },
    constructor: function DialogView(options = {}) {
      this.behaviors = this.behaviors || {};
      if (!this.tabablesBehavior) {
        this.tabablesBehavior = {
          behaviorClass: TabablesBehavior,
          recursiveNavigation: true,
          containTabFocus: true
        };
      }
      this.behaviors = _.extend(this.behaviors, {
        TabablesBehavior: this.tabablesBehavior
      });
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      $(window).on("resize", _.bind(this.onDomRefresh, this));
      this.$el.on("resize", this.onDomRefresh);
      this.listenToOnce(this, "hide", TabablesBehavior.popTabableHandler);
      this.propagateEventsToRegions();
      this.currentFooterView = false;
    },
    onDomRefresh: function() {
      this?.footerView && ![ ...this.footerView.el.classList ].includes("binf-hidden") && this.currentFooterView && this.updateFooterView(this.footerView);
    },
    canBeClosed: true,
    onKeyInView: function(event) {
      if (event.keyCode === 27 && !event.isDefaultPrevented() && this.canBeClosed) {
        event.stopPropagation();
        this.destroy();
      }
    },
    onKeyDownInView: function(event) {
      if (event.keyCode === 27 && !this.canBeClosed) {
        return false;
      }
      this.canBeClosed = !(event.keyCode === 27 && event.isDefaultPrevented());
    },
    setCurrentTabFocus: function() {
      this.focusOnLastRegion = true;
      this.$el.trigger("focus");
    },
    tabNextRegion: function() {
      this.trigger("changed:focus");
    },
    show: function() {
      var container = $.fn.binf_modal.getDefaultContainer(), region = new NonEmptyingRegion({
        el: container
      });
      region.show(this);
      return this;
    },
    onRender: function() {
      this.$el.addClass(DialogView.prototype.className.call(this)).attr({
        tabindex: 0,
        "aria-label": this.options.dialogTxtAria || this.options.title || "",
        role: "region"
      });
      this._renderHeader();
      if (this.options.view) {
        this.body.show(this.options.view);
      }
      this._renderFooter();
    },
    onShow: function() {
      this.$el.binf_modal({
        backdrop: "static",
        keyboard: false,
        paddingWhenOverflowing: false
      });
    },
    kill: function() {
      this.destroy();
      return true;
    },
    destroy: function() {
      let activeEl = document.activeElement;
      if (this?.$el?.find(activeEl)?.length != 0 || this?.el?.isSameNode(activeEl)) {
        activeEl.blur();
      }
      if (this.$el.is(":visible")) {
        this.$el.binf_modal("hide");
      } else {
        DialogView.__super__.destroy.apply(this, arguments);
      }
      this._scrollToBegin();
      this.trigger("after:destroy");
      return this;
    },
    updateButton: function(id, options) {
      var footerView = this.footerView;
      if (!footerView.updateButton) {
        throw new Error("Dialog footer does not support button updating.");
      }
      footerView.updateButton(id, options);
    },
    showView: function(view) {
      this.body.show(view);
      view.triggerMethod("after:show");
    },
    onShown: function() {
      if (this.footerView && !this.footerView.$el.hasClass("binf-hidden") && this.currentFooterView) {
        this.updateFooterView(this.footerView);
        this.footerView.$el.removeClass("smart-footer-btn-wrapper");
      }
      if (this.options.view && this.options.view.triggerMethod) {
        this.options.view.triggerMethod("dom:refresh");
        this.options.view.triggerMethod("after:show");
      }
      if (this.headerView && this.headerView.triggerMethod) {
        this.headerView.triggerMethod("dom:refresh");
        this.headerView.triggerMethod("after:show");
      }
      if (this.footerView && this.footerView.triggerMethod) {
        this.footerView.triggerMethod("dom:refresh");
        this.footerView.triggerMethod("after:show");
      }
      this.trigger("after:show");
    },
    onHiding: function() {
      var self = this;
      this.$el.addClass("binf-fadein");
      setTimeout(function() {
        self.triggerMethod("before:hide");
      }, 300);
    },
    onHidden: function() {
      this.triggerMethod("hide");
      this.destroy();
    },
    onClickClose: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.destroy();
    },
    onClickActionIcon: function(event) {
      this.options?.view?.trigger("click:actionIcon");
    },
    onClickButton: function(view) {
      var attributes = view.model ? view.model.attributes : view;
      if (attributes.click) {
        attributes.click({
          dialog: this,
          button: this.$el,
          buttonAttributes: attributes
        });
      }
      if (attributes.close) {
        this.destroy();
      }
    },
    _scrollToBegin: function() {
      if (i18n?.settings?.rtl) {
        var pos = $("body").width();
        $("body").scrollLeft(pos);
      } else {
        $("body").scrollLeft(0);
      }
    },
    _renderHeader: function() {
      let headerView = this.headerView = this.options.headerView, expandedHeader = this.options.standardHeader ?? !this.options.template;
      if (headerView) {
        this.header.show(headerView);
      } else {
        let options = {
          iconLeft: this.options.iconLeft,
          iconNameLeft: this.options.iconNameLeft,
          actionIconLeft: this.options.actionIconLeft,
          actionIconNameLeft: this.options.actionIconNameLeft,
          imageLeftUrl: this.options.imageLeftUrl,
          imageLeftClass: this.options.imageLeftClass,
          jatoIconLeft: this.options.jatoIconLeft,
          jatoIconRight: this.options.jatoIconRight,
          actionJatoIconLeft: this.options.actionJatoIconLeft,
          title: this.options.title,
          iconRight: this.options.iconRight,
          iconNameRight: this.options.iconNameRight,
          defaultCloseIcon: !this.options.iconNameRight && !this.options.iconRight && !this.options.buttons ? "smart_action:action_close_max32" : undefined,
          headers: this.options.headers,
          headerControl: this.options.headerControl,
          expandedHeader: expandedHeader,
          el: this.ui.header[0],
          headerTabableRegionBehavior: this.options?.headerTabableRegionBehavior
        };
        headerView = this.headerView = new DialogHeaderView(options);
        headerView.render();
        this.header.attachView(headerView);
        this.headerView.trigger("dom:refresh");
      }
    },
    _renderFooter: function() {
      var footerView = this.footerView = this.options.footerView;
      if (footerView) {
        this.ui.footer.removeClass("binf-hidden");
        this.ui.container.addClass("smart-dialog-has-footer");
        this.footer.show(footerView);
      } else {
        this.currentFooterView = true;
        var buttons = this.options.buttons || [];
        if (buttons.length) {
          this.ui.footer.removeClass("binf-hidden");
          this.ui.container.addClass("smart-dialog-has-footer");
          var checkClose = buttons.some(function(button) {
            return button.close;
          });
          if (!checkClose) {
            buttons.push({
              id: lang.defaultButtonLabel,
              label: lang.defaultButtonLabel,
              close: true
            });
          }
        }
        footerView = this.footerView = new DialogFooterView({
          collection: new Backbone.Collection(buttons),
          el: this.ui.footer[0],
          footerTabableRegionBehavior: this.options?.footerTabableRegionBehavior
        });
        this.listenTo(footerView, "childview:click button:click", this.onClickButton);
        this.footerView.$el.addClass("smart-footer-btn-wrapper");
        footerView.render();
        this.footer.attachView(footerView);
      }
    }
  });
  _.extend(DialogView.prototype, FooterViewResponsiveMixin);
  _.extend(DialogView.prototype, LayoutViewEventsPropagationMixin);
  return DialogView;
});