/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "i18n!d2/dialogs/new.file/impl/nls/lang", "hbs!d2/dialogs/new.file/impl/custom.profile.link", "css!d2/dialogs/new.file/impl/custom.profile.link" ], function(_, $, Backbone, Marionette, PerfectScrollingBehavior, lang, template) {
  "use strict";
  var CustomProfileLinkView = Marionette.ItemView.extend({
    className: "d2-custom-profile-link-view",
    template: template,
    ui: {
      actionTitle: "> .name-interactive",
      actionImport: ".custom-actions .action-import",
      actionAdd: ".custom-actions .action-add"
    },
    events: {
      "click @ui.actionTitle": "onActionClick",
      "click @ui.actionImport": "onActionClick",
      "click @ui.actionAdd": "onActionClick",
      keydown: "onKeyDown",
      focusout: "onFocusLost"
    },
    behaviors: {},
    constructor: function CustomProfileLinkView(options) {
      options = options || {};
      this.mode = options.mode || "";
      this.isZeroState = _.isBoolean(options.isZeroState) ? options.isZeroState : false;
      if (this.isZeroState) {
        _.extend(this.behaviors, {
          PerfectScrolling: {
            behaviorClass: PerfectScrollingBehavior,
            suppressScrollX: true,
            scrollYMarginOffset: 15
          }
        });
      }
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    templateHelpers: function() {
      return {
        isZeroState: this.isZeroState,
        lang: lang,
        nameInteractive: this.mode !== ""
      };
    },
    onRender: function() {
      this.$el.addClass(this.className + (this.isZeroState ? " zero-state" : ""));
      if (this.model.isCustomAllowed()) {
        this.$el.removeClass("binf-hidden");
      } else {
        this.$el.addClass("binf-hidden");
      }
    },
    onActionClick: function(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      var eTarget = $(event.target);
      if (eTarget.hasClass("action-import")) {
        this.triggerActionImport();
      } else if (eTarget.hasClass("action-add")) {
        this.triggerActionCreate();
      } else {
        this.triggerAction(this.mode);
      }
    },
    onKeyDown: function(event) {
      if (event.keyCode === 9) {
        var $itemTabables = this.$("[tabindex]");
        var currIndex = $.inArray(event.target, $itemTabables);
        if (currIndex !== -1) {
          var nextIndex = event.shiftKey ? currIndex - 1 : currIndex + 1;
          if (nextIndex >= 0 && nextIndex < $itemTabables.length) {
            event.stopPropagation();
            event.preventDefault();
            this.ignoreFocusLoss = true;
            this.$el.addClass("active");
            $itemTabables.eq(nextIndex).trigger("focus");
            return;
          }
        }
        this.$el.removeClass("active");
        this.trigger("focus:lost", event);
      } else if (event.keyCode === 13 || event.keyCode === 32) {
        this.onActionClick(event);
      }
    },
    onFocusLost: function() {
      if (this.ignoreFocusLoss) {
        this.ignoreFocusLoss = false;
        return;
      }
      this.$el.removeClass("active");
    },
    setFocus: function(event) {
      if (event && event.keyCode === 9 && event.type === "keydown") {
        event.stopPropagation();
        event.preventDefault();
        this.$el.addClass("active");
        var $itemTabables = this.$("[tabindex]");
        $itemTabables.eq(event.shiftKey ? $itemTabables.length - 1 : 0).trigger("focus");
      }
    },
    triggerActionImport: function() {
      this.triggerAction("import");
    },
    triggerActionCreate: function() {
      this.triggerAction("create");
    },
    triggerAction: function(actionName) {
      actionName && this.triggerMethod("action:" + actionName);
    }
  });
  return CustomProfileLinkView;
});