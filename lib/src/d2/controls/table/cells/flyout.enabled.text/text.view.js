/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/table/cells/text/text.view", "csui/controls/table/cells/cell.registry", "hbs!d2/controls/table/cells/flyout.enabled.text/impl/text", "i18n", "css!d2/controls/table/cells/flyout.enabled.text/impl/text" ], function($, _, Backbone, Marionette, TextView, cellViewRegistry, textViewTemplate, i18n) {
  "use strict";
  var FlyoutEnabledTextCellView = TextView.extend({
    constructor: function FlyoutEnabledTextCellView() {
      TextView.prototype.constructor.apply(this, arguments);
    },
    template: textViewTemplate,
    ui: {
      textFieldInner: ".span-text"
    },
    events: {
      "mouseenter @ui.textFieldInner": "_onMouseEnter",
      "mouseleave @ui.textFieldInner": "_onMouseLeave",
      "focusout @ui.textFieldInner": "_onFocusOut"
    },
    onRender: function() {
      if (this.options.column.attributes.flyout_view && this.model.get(this.options.column.attributes.flyout_view)) {
        var placement = this.options.column.attributes.flyout_placement || "right";
        if (i18n && i18n.settings.rtl) {
          if (placement === "right") {
            placement = "left";
          } else if (placement === "left") {
            placement = "right";
          }
        }
        this.ui.textFieldInner.binf_popover({
          content: this.model.get(this.options.column.attributes.flyout_view),
          html: true,
          placement: placement
        });
      }
    },
    _onMouseEnter: function() {
      this.ui.textFieldInner.binf_popover("show");
    },
    _onMouseLeave: function() {
      this.ui.textFieldInner.binf_popover("hide");
    },
    _onFocusOut: function() {
      this._onMouseLeave();
    }
  }, {
    columnClassName: "d2-table-cell-with-flyout"
  });
  cellViewRegistry.registerByColumnKey("basicPermissionTranslatedString", FlyoutEnabledTextCellView);
  return FlyoutEnabledTextCellView;
});