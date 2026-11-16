/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/utils/otwc.loader", "hbs!csui/controls/tablesettings/menu.item.views/impl/table.settings.menu.item" ], function(_, Backbone, Marionette, otwcLoader, template) {
  "use strict";
  const TableSettingsMenuCheckboxView = Marionette.ItemView.extend({
    template: template,
    tagName: "otc-menucheckbox",
    attributes: function() {
      return {
        checked: this.model.get("checked")
      };
    },
    constructor: function TableSettingsMenuCheckboxView(options) {
      if (!options) {
        throw new Error("options object is mandatory for TableSettingsMenuCheckboxView");
      }
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.listenTo(this.model, "change", eventData => {
        if (eventData.changed.checked === undefined) {
          if (Object.keys(eventData.changed).length > 0) {
            this.render();
          }
        } else {
          if (Object.keys(eventData.changed).length > 1) {
            this.render();
          }
          this.el.checked = !!this.model.get("checked");
        }
      });
    },
    events: {
      change: "onChanged"
    },
    onChanged: function(event) {
      const checked = event.originalEvent.detail.checked;
      if (checked !== this.model.get("checked")) {
        this.trigger("change:switch", {
          checked: checked
        });
      }
    }
  });
  return TableSettingsMenuCheckboxView;
});