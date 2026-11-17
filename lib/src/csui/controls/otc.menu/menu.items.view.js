/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette3", "csui/controls/otc.menu/menu.item.view" ], function(Marionette, MenuItemView) {
  "use strict";
  const MenuItemsView = Marionette.CollectionView.extend({
    tagName: function() {
      return this.options.parentElm ?? "otc-menugroup";
    },
    attributes: function() {
      return {
        name: this.options.name
      };
    },
    childView: MenuItemView,
    childViewOptions: function() {
      return {
        childElm: this.options.childElm
      };
    },
    constructor: function MenuItemsView(options) {
      if (!options) {
        throw new Error("options object is mandatory for MenuItemsView");
      }
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },
    childViewEvents: {
      "change:selection": "onChangeSelection"
    },
    onChangeSelection: function({
      itemValue,
      event
    }) {
      this.trigger("change:selection", {
        itemValue: itemValue,
        event: event
      });
    }
  });
  return MenuItemsView;
});