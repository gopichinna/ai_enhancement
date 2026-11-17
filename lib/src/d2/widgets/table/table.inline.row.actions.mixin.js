/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base" ], function($, _, Backbone, Marionette, base) {
  "use strict";
  return {
    createInlineRowAction: function(tableView, options) {
      options = options || {};
      tableView.inlineRowActionOptions = options;
      if (base.isTouchBrowser()) {
        tableView.$el.addClass("touch-browser");
      } else {
        var cellSelector = 'td:not([data-csui-attribute="d2_inline_row_actions"])';
        tableView.$el.off("focusin").on("focusin", cellSelector, function(event) {
          var $currentTarget = $(event.currentTarget), $target = $(event.target), $tableActionBubble = $currentTarget.find(".csui-table-actionbar-bubble"), hasItem = $tableActionBubble.has($target);
          if (($target.hasClass("csui-toolitem") || $target.hasClass("binf-dropdown-toggle")) && $tableActionBubble.length > 0 && hasItem.length > 0 || $currentTarget.hasClass("has-focusable-items") && $currentTarget.find($target).length > 0) {
            $currentTarget.closest("tr").removeClass("focused");
          } else {
            $currentTarget.closest("tr").addClass("focused");
          }
        });
        tableView.$el.off("focusout").on("focusout", cellSelector, function(event) {
          var $currentTarget = $(event.currentTarget);
          $currentTarget.closest("tr").removeClass("focused");
        });
      }
    }
  };
});