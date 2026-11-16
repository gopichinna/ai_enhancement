/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "nuc/utils/log", "hbs!smart/controls/dialog/impl/dialog.header", "i18n!smart/controls/dialog/impl/nls/lang", "css!smart/controls/dialog/impl/dialog" ], function(module, _, $, Marionette, TabableRegion, log, headerTemplate, lang) {
  log = log(module.id);
  var DialogHeaderView = Marionette.ItemView.extend({
    template: headerTemplate,
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },
    ui: {
      headerControl: ".cs-header-control",
      closeButton: ".cs-close"
    },
    events: {
      keydown: "onKeyInView"
    },
    templateHelpers: function() {
      return {
        iconLeft: this.options.iconLeft,
        iconNameLeft: this.options.iconNameLeft,
        actionIconLeft: this.options.actionIconLeft,
        actionIconNameLeft: this.options.actionIconNameLeft,
        imageLeftUrl: this.options.imageLeftUrl,
        imageLeftClass: this.options.imageLeftClass,
        title: this.options.title,
        iconRight: this.options.iconRight,
        iconNameRight: this.options.iconNameRight,
        defaultCloseIcon: this.options.defaultCloseIcon,
        expandedHeader: this.options.expandedHeader,
        dialogCloseButtonTooltip: lang.dialogCloseButtonTooltip,
        dialogCloseAria: _.str.sformat(lang.dialogCloseAria, this.options.title),
        embedExternalIcon: this.hasEmbeddedExternalIcon,
        showCloseIcon: this.options.iconNameRight || this.options.iconRight || this.options.defaultCloseIcon ? true : false
      };
    },
    constructor: function DialogHeaderView(options = {}) {
      this.behaviors = this.behaviors || {};
      if (!options.headerTabableRegionBehavior) {
        options.headerTabableRegionBehavior = {
          behaviorClass: TabableRegion
        };
      }
      this.behaviors = _.extend(this.behaviors, {
        TabableRegion: options.headerTabableRegionBehavior
      });
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.hasEmbeddedExternalIcon = !!this.options.iconNameRight || !!this.options.iconRight;
      if (this.hasEmbeddedExternalIcon) {
        let warningMsg = "DEPRECATED: iconNameRight and iconRight support will be deprecated, instead," + " use otc-icon.";
        console.warn(warningMsg);
      }
      this.$el.addClass("smart-dialog-header");
    },
    isTabable: function() {
      return this.$("*[tabindex]").length > 0;
    },
    currentlyFocusedElement: function(event) {
      var tabElements = this.$("*[tabindex]");
      if (tabElements.length) {
        tabElements.prop("tabindex", 0);
      }
      if (!this.options.iconRight && !this.options.iconNameRight && !this.options.defaultCloseIcon) {
        this.ui?.closeButton?.attr("tabindex", -1);
      }
      if (!!event && event.shiftKey) {
        return $(tabElements[tabElements.length - 1]);
      } else {
        return $(tabElements[0]) && $(tabElements[0]).trigger("focus");
      }
    },
    onLastTabElement: function(shiftTab, event) {
      return shiftTab && event.target === this.$("*[tabindex]")[0];
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode;
      if (keyCode === 13 || keyCode === 32) {
        $(event.target).trigger("click");
      }
    },
    onRender: function() {
      var headers = this.options.headers || [];
      if (headers.length) {
        _.each(headers, function(header) {
          var $header = this._renderHeader(header);
          this.$el.append($header);
        }, this);
      }
      var headerControl = this.options.headerControl;
      if (headerControl) {
        this.ui.headerControl.append(headerControl.$el);
        headerControl.render();
        headerControl.trigger("dom:refresh");
      }
      if (!!this.options.actionIconLeft) {
        this._adjustTitleCSS();
      }
    },
    onDomRefresh: function() {
      var headerControl = this.options.headerControl;
      if (headerControl) {
        headerControl.triggerMethod("dom:refresh");
        headerControl.triggerMethod("after:show");
      }
      if (this.isTabable()) {
        this.currentlyFocusedElement();
      }
    },
    _renderHeader: function(options) {
      var div = $('<div class="modal-header-item"></div>').text(options.label);
      if (options.class) {
        div.addClass(options.class);
      }
      return div;
    },
    _adjustTitleCSS: function(options) {
      this.$el.find("div.tile-title").addClass("tile-action-icon-tittle");
    }
  });
  return DialogHeaderView;
});