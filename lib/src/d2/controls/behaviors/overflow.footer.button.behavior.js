/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/lib/backbone", "d2/controls/overflow.footer/overflow.footer.button.view" ], function($, _, Marionette, Backbone, OverflowFooterButtonView) {
  "use strict";
  var OverflowFooterButtonBehavior = Marionette.Behavior.extend({
    constructor: function OverflowFooterButtonBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.listenTo(view, "footer:adjust:button", this._adjustFooterButton);
      this.listenTo(view, "render", this._onViewRender);
      this.wrappedButtonCollection = new Backbone.Collection();
    },
    _onViewRender: function() {
      this.view.$el.addClass("binf-hidden");
      this.overflowView = new OverflowFooterButtonView({
        collection: this.wrappedButtonCollection,
        footerView: this.view
      });
      this.overflowView.render();
      this.$el.append(this.overflowView.$el);
      this.view.$el.removeClass("binf-hidden");
      this._adjustFooterButton();
    },
    onBeforeDestroy: function() {
      this.overflowView && this.overflowView.destroy();
    },
    _adjustFooterButton: function() {
      this._checkWidthAndAdjustButton();
    },
    _checkWidthAndAdjustButton: function() {
      var visibleButtons = this.view.$el.find("otc-button").filter(":visible:not(.overflow-btn)"), footerWidth = this.view.$el.innerWidth(), overflowButtonWidth = this.overflowView.$el.outerWidth(true), wrappedButtonCollection = this.wrappedButtonCollection, totalVisibleButtonWidth = wrappedButtonCollection.length > 0 ? overflowButtonWidth : 0;
      visibleButtons.each(function() {
        var $button = $(this), buttonWidth = $button.outerWidth(true);
        totalVisibleButtonWidth = totalVisibleButtonWidth + buttonWidth;
      });
      if (footerWidth < totalVisibleButtonWidth) {
        var lastVisibleButton = visibleButtons.eq(visibleButtons.length - 1), buttonId = lastVisibleButton.attr("button-id"), actionName = lastVisibleButton.attr("action-name"), buttonWidth = lastVisibleButton.outerWidth(true), buttonText = lastVisibleButton.attr("title"), isDisabled = lastVisibleButton.is("[disabled]");
        wrappedButtonCollection.unshift({
          id: buttonId,
          action: actionName,
          name: buttonText,
          width: buttonWidth,
          disabled: isDisabled
        });
        lastVisibleButton.addClass("btn-wrapped");
        this._checkWidthAndAdjustButton();
      } else if (wrappedButtonCollection.length > 0) {
        var lastWrappedButttonItem = wrappedButtonCollection.at(0), lastwrappedButtonWidth = lastWrappedButttonItem.get("width"), calculatedButtonsWidth = totalVisibleButtonWidth + lastwrappedButtonWidth;
        if (footerWidth > calculatedButtonsWidth) {
          wrappedButtonCollection.shift();
          var $lastWrappeDButtonEl = this.view.$el.find("otc-button[button-id=" + lastWrappedButttonItem.get("id") + "]");
          $lastWrappeDButtonEl.removeClass("btn-wrapped");
          this._checkWidthAndAdjustButton();
        }
      }
      if (wrappedButtonCollection.length > 0) {
        this.overflowView.$el.removeClass("binf-hidden");
      } else {
        this.overflowView.$el.addClass("binf-hidden");
      }
    }
  });
  return OverflowFooterButtonBehavior;
});