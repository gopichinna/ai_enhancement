/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "smart/utils/otwc.loader", "hbs!csui/controls/tablesettings/menu.item.views/impl/table.settings.menu.item" ], function(_, Backbone, Marionette, otwcLoader, template) {
  "use strict";
  const TableSettingsMenuItemView = Marionette.ItemView.extend({
    template: template,
    tagName: "otc-menuitem",
    constructor: function TableSettingsMenuItemView(options) {
      if (!options) {
        throw new Error("options object is mandatory for TableSettingsMenuItemView");
      }
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.listenTo(this.model, "change", this.render);
    },
    events: {
      "item-click": "onClicked"
    },
    onClicked: function(event) {
      this.trigger("selected:menuitem", {});
    }
  });
  return TableSettingsMenuItemView;
});