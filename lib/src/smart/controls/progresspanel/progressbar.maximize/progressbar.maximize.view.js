/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "i18n!smart/controls/progresspanel/progressbar.maximize/impl/nls/progressbar-maximize.lang", "hbs!smart/controls/progresspanel/progressbar.maximize/impl/progressbar.maximize", "css!smart/controls/progresspanel/progressbar.maximize/impl/progressbar-maximize" ], function(_, $, Marionette, lang, template) {
  "use strict";
  var ProgressbarMaximizeView = Marionette.ItemView.extend({
    className: "csui-progressbar-maximize-view",
    template: template,
    templateHelpers: function() {
      return {
        maximize: lang.maximize,
        maximizeAria: lang.maximizeAria
      };
    },
    ui: {
      favoritesButtonContainer: ".csui-favorites-icon-container",
      favoritesViewContainer: ".csui-favorites-view-container",
      progresspanelMaximize: ".csui-maximize .csui-button-icon",
      progressRight: ".csui-progressbar-pie .csui-progressbar-right-side",
      progressLeft: ".csui-progressbar-pie .csui-progressbar-left-side",
      wrapper: ".csui-progressbar-pie-wrapper.progress .csui-progressbar-pie"
    },
    events: {
      click: "_onClick",
      "keydown @ui.progresspanelMaximize": "onKeyInView"
    },
    constructor: function ProgressbarMaximizeView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(options.parentView, "processbar:minimize", this._doProcessbarMaximize);
      this.listenTo(options.parentView, "processbar:update", this._doProgressbarAnimation);
      this.listenTo(options.parentView, "processbar:finished", this._doFinishedProgressbar);
      this.listenTo(options.parentView, "processing:completed", this._docompletedProgressbar);
      this.listenTo(options.parentView, "processing:error", this._doFailedProgressbar);
    },
    _doProcessbarMaximize: function() {
      if (this.options.miniProgressBarClass) {
        this.options.parentView.$el.find("." + this.options.miniProgressBarClass).removeClass("binf-hidden");
      } else {
        this.options.parentView.$el.find(".csui-progressbar-maximize").removeClass("binf-hidden");
      }
      this.$el.find(".csui-progressbar-animation").removeClass("binf-hidden");
      this.ui.progresspanelMaximize.removeClass("icon-progresspanel-success");
      this.ui.progresspanelMaximize.removeClass("icon-progresspanel-error");
      this.ui.progresspanelMaximize.trigger("focus");
    },
    onKeyInView: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this._onClick(event);
        return false;
      }
    },
    _doFailedProgressbar: function() {
      var self = this;
      this.ui.progresspanelMaximize.removeClass("icon-progresspanel-success");
      this.ui.progresspanelMaximize.removeClass("icon-progresspanel-pending");
      this.$el.find(".csui-progressbar-animation").addClass("binf-hidden");
      this.ui.progresspanelMaximize.addClass("icon-progresspanel-error");
      setTimeout(function() {
        self._onClick();
      }, 1e3);
    },
    _docompletedProgressbar: function() {
      var self = this;
      this.ui.progresspanelMaximize.removeClass("icon-progresspanel-error");
      this.ui.progresspanelMaximize.removeClass("icon-progresspanel-pending");
      this.$el.find(".csui-progressbar-animation").addClass("binf-hidden");
      this.ui.progresspanelMaximize.addClass("icon-progresspanel-success");
      setTimeout(function() {
        self._onClick();
      }, 1e3);
    },
    _doFinishedProgressbar: function() {
      this.ui.wrapper.css("clip", "rect(0, 1em, 1em, 0.5em)");
      this.ui.progressLeft.css("transform", "rotate(" + 360 + "deg)");
      this.ui.progressRight.css("transform", "rotate(" + 0 + "deg)");
      if (this.options.miniProgressBarClass) {
        this.options.parentView.$el.find("." + this.options.miniProgressBarClass).addClass("binf-hidden");
      } else {
        this.options.parentView.$el.find(".csui-progressbar-maximize").addClass("binf-hidden");
      }
    },
    _doProgressbarAnimation: function(progressPercent) {
      var calc = Math.round(3.6 * progressPercent);
      if (progressPercent <= 50) {
        this.ui.wrapper.css("clip", "rect(0, 1em, 1em, 0.5em)");
        this.ui.progressLeft.css("transform", "rotate(" + 360 + "deg)");
        this.ui.progressRight.css("transform", "rotate(" + calc + "deg)");
      }
      if (progressPercent >= 50 && progressPercent <= 100) {
        this.ui.wrapper.css("clip", "rect(auto, auto, auto, auto)");
        this.ui.progressRight.css("transform", "rotate(" + 180 + "deg)");
        this.ui.progressLeft.css("transform", "rotate(" + calc + "deg)");
      }
    },
    _onClick: function(event) {
      if (this.options.miniProgressBarClass) {
        this.options.parentView.$el.find("." + this.options.miniProgressBarClass).addClass("binf-hidden");
      } else {
        this.options.parentView.$el.find(".csui-progressbar-maximize").addClass("binf-hidden");
      }
      this.options.parentView.trigger("processbar:maximize", event);
    },
    onRender: function() {}
  });
  return ProgressbarMaximizeView;
});