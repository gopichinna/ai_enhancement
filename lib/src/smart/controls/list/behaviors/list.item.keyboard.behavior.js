/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/log", "nuc/lib/marionette" ], function(module, _, $, log, Marionette) {
  "use strict";
  function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }
  return Marionette.Behavior.extend({
    ui: {
      titleName: ".list-item-title",
      moreActions: ".csui-tileview-more-btn",
      checkbox: ".smart-listitem-checkbox"
    },
    events: function() {
      var events = {
        "keydown @ui.titleName": "_doDefaultAction"
      };
      if (this.view.showInlineActionBar) {
        events = _.extend(events, {
          keydown: "_handleInlineKeyDown"
        });
      } else {
        events = _.extend(events, {
          keydown: "_doDefaultAction"
        });
      }
      return events;
    },
    constructor: function ListItemKeyboardBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
    },
    _doDefaultAction: function(e) {
      if (e.keyCode == 13 || e.keyCode == 32) {
        e.stopPropagation();
        this.view.trigger("click:item", {
          target: this.view.model
        });
      }
    },
    _handleInlineKeyDown: function(e) {
      var $target = $(e.target);
      switch (e.keyCode) {
       case 13:
        this.ui.titleName.prop("tabindex", -1).trigger("focus");
        this.view.onShowInlineMenu(e);
        stopEvent(e);
        break;

       case 27:
        var hasInlineMenu = this.view.onHideInlineMenu();
        if (hasInlineMenu) {
          this.$el.trigger("focus");
          stopEvent(e);
        }
        break;

       case 37:
        if (this.ui.moreActions.is($target) || this.ui.moreActions.has($target).length) {
          this.ui.titleName.prop("tabindex", -1).trigger("focus");
          stopEvent(e);
        } else if (this.ui.titleName.is($target)) {
          stopEvent(e);
        }
        break;

       case 39:
        if (this.ui.titleName.is($target)) {
          this.view._inlineMenuView.acquireFocus();
          stopEvent(e);
        }
        break;

       case 32:
        if (this.$el.is($target) && this.view?.options?.enableSelection) {
          this.el?.querySelector(".smart-listitem-checkbox")?.click();
          stopEvent(e);
        }
        break;

       default:
        if (this.ui.moreActions.is($target) || this.ui.moreActions.has($target).length || this.ui.titleName.is($target)) {
          if (e.keyCode >= 33 && e.keyCode <= 40) {
            stopEvent(e);
          }
        }
      }
    }
  });
});