/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/table.settings/impl/columns.side.panel.edit.group.collection.view", "hbs!smart/controls/table.settings/impl/columns.side.panel.edit", "i18n!smart/controls/table.settings/impl/nls/lang", "css!smart/controls/table.settings/impl/columns.side.panel.edit" ], function(module, _, Backbone, Marionette, ColumnsSidePanelEditGroupCollectionView, template, lang) {
  return Marionette.LayoutView.extend({
    className: "smart-table-settings-columns-edit-view",
    template: template,
    regions: {
      columns: ".smart-table-settings-column-edit-list"
    },
    ui: {
      searchInput: ".smart-table-settings-column-edit-filter"
    },
    events: {
      "change @ui.searchInput": "onSearchChanged",
      "input @ui.searchInput": "onSearchChanged"
    },
    constructor: function ColumnsSidePanelEditView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.options || (this.options = {});
      this.allColumnsCollection = this.options.allColumns;
      this.selectedColumns = this.options.selectedColumns;
      this.groupCollectionView = new ColumnsSidePanelEditGroupCollectionView({
        allColumns: this.allColumnsCollection,
        selectedColumns: this.selectedColumns,
        ungroupedFirst: this.options.ungroupedFirst,
        id: "columnList"
      });
    },
    onBeforeShow: function() {
      this.showChildView("columns", this.groupCollectionView);
    },
    templateHelpers: function() {
      return {
        searchPlaceholder: lang.searchPlaceholder,
        searchAriaLabel: lang.searchAriaLabel,
        clearAriaLabel: lang.clearAriaLabel,
        clearTitle: lang.clearTitle
      };
    },
    getSelectedColumns: function() {
      return this.groupCollectionView.getSelectedColumns();
    },
    getCurrentlySelectedColumnsHash() {
      let hash = "";
      this.groupCollectionView.getSelectedColumns().each(column => {
        if (hash) {
          hash += ",";
        }
        hash += column.get("id");
      });
      return hash;
    },
    onSearchChanged: function() {
      const filter = this.ui.searchInput[0].value;
      this.groupCollectionView.setFilter(filter);
    },
    markShown: function(isShown) {
      this._markedShown = isShown;
    },
    setInitialFocus: async function() {
      const searchInputElement = this.ui.searchInput[0];
      await searchInputElement.updateComplete;
      searchInputElement.focus();
    }
  });
});