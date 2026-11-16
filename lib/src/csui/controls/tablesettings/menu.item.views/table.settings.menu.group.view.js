/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/tablesettings/menu.item.views/table.settings.menu.select.view", "smart/utils/otwc.loader", "hbs!csui/controls/tablesettings/menu.item.views/impl/table.settings.menu.item" ], function(_, Backbone, Marionette, TableSettingsMenuSelectView, otwcLoader, template) {
  "use strict";
  const TableSettingsMenuGroupView = Marionette.CollectionView.extend({
    childView: TableSettingsMenuSelectView,
    template: template,
    tagName: "otc-menugroup",
    constructor: function TableSettingsMenuGroupView(options) {
      if (!options) {
        throw new Error("options object is mandatory for TableSettingsMenuGroupView");
      }
      if (!options.model) {
        throw new Error("options object.model is mandatory for TableSettingsMenuGroupView");
      }
      Marionette.CollectionView.prototype.constructor.call(this, options);
      const items = options.model.get("itemValue");
      this.collection = new Backbone.Collection(items);
      this.listenTo(options.model, "change", () => {
        this.collection.reset(options.model.get("itemValue"));
      });
    },
    childEvents: {
      "change:selection": "onChangeSelection"
    },
    onChangeSelection: function(itemView, eventData) {
      this.trigger("change:selection", {
        selectionView: itemView,
        itemValue: eventData.itemValue
      });
    }
  });
  return TableSettingsMenuGroupView;
});