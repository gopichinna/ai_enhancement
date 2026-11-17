/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette", "csui/controls/mixins/view.state/toolitems.state.mixin", "hbs!csui/controls/item.title/impl/otcdropdown.menu/menu.toolitem" ], function(_, Marionette, ToolItemsStateMixin, template) {
  "use strict";
  const MenuToolItemView = Marionette.ItemView.extend({
    tagName: function() {
      return this.model.isSeparator() ? "otc-menudivider" : "otc-menuitem";
    },
    className: function() {
      return this.model.get("className") ?? "";
    },
    attributes: function() {
      const attrs = {
        role: "none"
      };
      if (!this.model.isSeparator()) {
        const signature = this.model.get("signature") || "";
        if (signature.toLowerCase() === "add") {
          attrs["data-csui-addtype"] = this.model.get("commandData").type;
        }
        attrs["data-csui-command"] = signature.toLowerCase();
        if (this.options.role) {
          attrs.role = this.options.role;
        }
        const command = this.options.command;
        if (command && command.get("selfBlockOnly") && command.get("isExecuting")) {
          attrs.disabled = "";
        }
      }
      return attrs;
    },
    ui: {
      link: "otc-menuitem"
    },
    template: template,
    events: {
      "item-click": "_handleClick"
    },
    constructor: function MenuToolItemView(options) {
      this.options = options || {};
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  _.extend(MenuToolItemView.prototype, ToolItemsStateMixin);
  return MenuToolItemView;
});