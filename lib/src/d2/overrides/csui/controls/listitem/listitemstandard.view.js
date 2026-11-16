/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/listitem/listitemstandard.view" ], function(StandardListItem) {
  "use strict";
  var proto = StandardListItem.prototype, oldOnShowInlineMenu = proto.onShowInlineMenu;
  proto.onShowInlineMenu = function() {
    this.model.setNonPromotedActionsOptions && this.model.setNonPromotedActionsOptions({
      isNonPromoted: false
    });
    oldOnShowInlineMenu.apply(this, arguments);
    if (this._inlineMenuView) {
      this._inlineMenuView._focusFirstItem = function(event) {
        if (event.type === "keydown") {
          if (this.$el.find(".binf-dropdown-menu li:first a").length) {
            this.$el.find(".binf-dropdown-menu li:first a").trigger("focus");
          } else {
            this.$el.find(".tile-nav li a").trigger("focus");
          }
        }
      };
    }
  };
});