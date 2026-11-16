/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/utils/non-emptying.region/non-emptying.region", "d2/dialogs/about.d2/impl/about.d2.form.view", "i18n!d2/dialogs/about.d2/impl/nls/lang", "hbs!d2/dialogs/about.d2/impl/about.d2.dialog", "css!d2/dialogs/about.d2/impl/about.d2.dialog" ], function($, _, Marionette, NonEmptyingRegion, AboutD2FormView, lang, template) {
  "use strict";
  return Marionette.LayoutView.extend({
    className: "d2-about-dialog cs-dialog binf-modal binf-fade",
    template: template,
    attributes: {
      tabindex: "-1",
      role: "dialog",
      "aria-hidden": "true"
    },
    ui: {
      header: ".binf-modal-header",
      body: ".binf-modal-body",
      version: ".d2-version",
      closeBtn: ".cs-close"
    },
    regions: {
      body: "@ui.body"
    },
    events: {
      "hidden.binf.modal": "onHidden",
      "click @ui.closeBtn": "onClickClose",
      keyup: "onKeyInView"
    },
    templateHelpers: function() {
      return {
        closeTooltip: lang.DialogCloseBtn,
        version: _.str.sformat(lang.SmartViewVersion, this.options.data["D2SmartViewVersion"].value)
      };
    },
    constructor: function AboutD2Dialog(options) {
      options = options || {};
      if (!options.data) {
        throw Error("data option is mandatory");
      }
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },
    onKeyInView: function(event) {
      if (event.keyCode === 27) {
        this.destroy();
        return;
      }
      if ((event.keyCode === 13 || event.keyCode === 32) && $.contains(this.ui.closeBtn[0], event.target)) {
        this.onClickClose(event);
      }
    },
    show: function() {
      var container = $.fn.binf_modal.getDefaultContainer(), region = new NonEmptyingRegion({
        el: container
      });
      region.show(this);
      $(window).scrollTop(0);
      this.$el.binf_modal({
        backdrop: "static",
        keyboard: false,
        paddingWhenOverflowing: false
      });
      return this;
    },
    onRender: function() {
      this.$el.attr("tabindex", 0);
      var view = new AboutD2FormView(this.options);
      this.body.show(view);
    },
    onHidden: function() {
      this.destroy();
    },
    onClickClose: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.destroy();
    },
    destroy: function() {
      if (this.$el.is(":visible")) {
        this.$el.binf_modal("hide");
      }
      Marionette.LayoutView.prototype.destroy.apply(this, arguments);
      return this;
    }
  });
});