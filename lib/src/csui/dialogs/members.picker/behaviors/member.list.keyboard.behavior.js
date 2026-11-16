/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/controls/list/behaviors/list.item.keyboard.behavior" ], function($, ListItemKeyboardBehavior) {
  "use strict";
  function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }
  return ListItemKeyboardBehavior.extend({
    ui: {
      memberName: ".user-profile-info",
      inlineActionButton: ".csui-list-inlineactions-btn"
    },
    events: function() {
      var events = {
        "keydown @ui.memberName": "_doDefaultAction",
        focus: "_onFocusInTableCell",
        blur: "_onFocusOutTableCell",
        keydown: "_handleInlineKeyDown"
      };
      return events;
    },
    constructor: function MemberListKeyboardBehaviour(options, view) {
      ListItemKeyboardBehavior.prototype.constructor.apply(this, arguments);
    },
    _onFocusInTableCell: function(e) {
      if (this.view?.options.isMemberListItem) {
        this.view.onShowInlineMenu(e);
        stopEvent(e);
      }
    },
    _onFocusOutTableCell: function(e) {
      if (this.view?.options.isMemberListItem && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
        this.view.onHideInlineMenu(e);
        stopEvent(e);
      }
    },
    _handleInlineKeyDown: function(e) {
      var $target = $(e.target);
      switch (e.key) {
       case "Enter":
        if (this.ui.memberName.length) {
          this.ui.memberName.prop("tabindex", -1).trigger("focus");
          stopEvent(e);
        }
        break;

       case "Escape":
        if (!e.target.classList.contains("csui-item-standard")) {
          var hasInlineMenu = this.view.onHideInlineMenu();
          if (hasInlineMenu) {
            this.$el.trigger("focus");
            stopEvent(e);
          }
        }
        break;

       case "ArrowLeft":
        if (this.ui.inlineActionButton.is($target) || this.ui.inlineActionButton.has($target).length) {
          this.ui.memberName.prop("tabindex", -1).trigger("focus");
          stopEvent(e);
        } else if (this.ui.memberName.is($target)) {
          stopEvent(e);
        }
        break;

       case "ArrowRight":
        if (this.ui.memberName.is($target)) {
          this.view.inlineMenuBarView.$el?.find("a").attr("tabindex", -1).trigger("focus");
          stopEvent(e);
        }
        break;

       default:
        if (this.ui.inlineActionButton.is($target) || this.ui.inlineActionButton.has($target).length || this.ui.memberName.is($target)) {
          if (e.keyCode >= 33 && e.keyCode <= 40) {
            stopEvent(e);
          }
        }
      }
    }
  });
});