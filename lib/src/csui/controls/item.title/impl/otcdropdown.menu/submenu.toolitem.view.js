/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette", "csui/controls/item.title/impl/otcdropdown.menu/menu.toolitem.view", "csui/controls/mixins/view.state/toolitems.state.mixin", "hbs!csui/controls/item.title/impl/otcdropdown.menu/submenu.toolitem" ], function(_, Marionette, MenuToolItemView, ToolItemsStateMixin, template) {
  "use strict";
  const SubMenuToolItemView = Marionette.CompositeView.extend({
    tagName: "otc-submenu",
    attributes: function() {
      const attrs = {
        role: "none"
      };
      if (!this.model.isSeparator()) {
        attrs.name = this.model.get("name");
        const signature = this.model.get("signature") || "";
        attrs["data-csui-command"] = signature.toLowerCase();
        if (this.options.role) {
          attrs.role = this.options.role;
        }
      }
      return attrs;
    },
    template: template,
    getChildView: function(item) {
      return item.toolItems && item.toolItems.length ? SubMenuToolItemView : MenuToolItemView;
    },
    childEvents: {
      "toolitem:action": function(childView, args) {
        this.triggerMethod("toolitem:action", args);
      }
    },
    constructor: function SubMenuToolItemView(options) {
      this.options = options || {};
      this.collection = options.collection || options.model && options.model.toolItems;
      this.model = this.options.model;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    }
  });
  _.extend(SubMenuToolItemView.prototype, ToolItemsStateMixin);
  return SubMenuToolItemView;
});