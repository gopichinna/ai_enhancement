/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "hbs!d2/dialogs/target.browse/impl/header/table.settings/table.settings", "i18n!d2/dialogs/target.browse/impl/nls/lang" ], function(_, $, Marionette, tableSettingsTemplate, lang) {
  var TableSettingsView = Marionette.LayoutView.extend({
    template: tableSettingsTemplate,
    className: "d2-target-table-settings",
    ui: {
      pinIcon: "a.d2-header-pin-icon",
      listIcon: "a.d2-header-list-icon"
    },
    events: {
      "click @ui.pinIcon": "onTableModeChangePinned",
      "click @ui.listIcon": "onTableModeChangeList"
    },
    templateHelpers: function() {
      var options = this.options;
      return {
        isPinnedMode: options.currentTableMode === "PINNED",
        isListView: options.currentTableMode === "LIST",
        listView: lang.listView,
        pinnedColumns: lang.pinnedColumns
      };
    },
    constructor: function SearchBoxView(options) {
      this.options = options;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },
    onTableModeChangePinned: function() {
      this.trigger("change:tablemode", "PINNED");
    },
    onTableModeChangeList: function() {
      this.trigger("change:tablemode", "LIST");
    }
  });
  return TableSettingsView;
});