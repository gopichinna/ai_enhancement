/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "hbs!d2/widgets/table/impl/columns.settings.item" ], function(Marionette, template) {
  var ColumnsSettingsItemView = Marionette.ItemView.extend({
    template: template,
    templateHelpers: function() {
      return {
        label: this.model.get("label"),
        name: this.model.get("name"),
        selected: this.model.get("selected")
      };
    }
  });
  return ColumnsSettingsItemView;
});