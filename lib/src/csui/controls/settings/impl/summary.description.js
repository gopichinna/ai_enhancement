/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette3", "csui/controls/otc.menu/menu.items.view" ], function(Marionette, MenuItemsView) {
  "use strict";
  const SummaryDescription = Marionette.View.extend({
    tagName: "otc-submenu",
    className: "summary-description",
    attributes: function() {
      return {
        name: this.options.name
      };
    },
    template: false,
    constructor: function SummaryDescription(options) {
      options || (options = {});
      this.options = options;
      Marionette.View.call(this, options);
    },
    onRender: function() {
      this.subMenuItems = new MenuItemsView({
        collection: this.options.availableCollection,
        childElm: "otc-menuradio"
      });
      this.subMenuItems.render();
      this.el.appendChild(this.subMenuItems.el);
      this.listenTo(this.subMenuItems, "change:selection", this.handleCheckedItems);
    },
    handleCheckedItems: function({
      itemValue,
      event
    }) {
      this.trigger("otc:submenu:select", {
        itemValue: itemValue,
        event: event
      });
    }
  });
  return SummaryDescription;
});