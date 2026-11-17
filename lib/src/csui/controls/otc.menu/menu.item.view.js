/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette3", "hbs!csui/controls/otc.menu/impl/menu" ], function(Marionette, template) {
  "use strict";
  const MenuItemView = Marionette.View.extend({
    template: template,
    tagName: function() {
      return this.model.get("overrideChildElm") ?? this.options.childElm ?? "otc-menuitem";
    },
    attributes: function() {
      return {
        checked: this.model.get("checked"),
        id: this.model.get("id")
      };
    },
    constructor: function MenuItemView(options) {
      Marionette.View.prototype.constructor.call(this, options);
    },
    events: {
      change: "onChanged",
      "item-click": "onChanged"
    },
    onChanged: function(event) {
      this.trigger("change:selection", {
        itemValue: this.model,
        event: event
      });
    }
  });
  return MenuItemView;
});