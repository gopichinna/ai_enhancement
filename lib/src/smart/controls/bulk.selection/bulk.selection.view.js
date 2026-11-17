/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/bulk.selection/bulk.selection.dropdown.view", "smart/controls/bulk.selection/bulk.selection.count.label.view", "hbs!smart/controls/bulk.selection/impl/bulk.selection", "smart/utils/otwc.loader" ], function(_, Backbone, Marionette, BulkSelectionDropdownView, BulkSelectionCountLabelView, bulkSelectionTemplate) {
  "use strict";
  var BulkSelectionView = Marionette.LayoutView.extend({
    template: bulkSelectionTemplate,
    className: "selected-count",
    regions: {
      selectedLabel: ".selected-counter-region",
      selectedItemsDropdown: ".selected-dropdown"
    },
    childEvents: {
      "menu:close": "onMenuClosed",
      "menu:open": "onMenuOpened"
    },
    constructor: function BulkSelectionView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.viewCollection = new Backbone.Collection();
      this.listenTo(this.collection, "update reset remove", () => {
        if (this._menuIsOpen) {
          this._updateViewCollection();
        }
      });
    },
    onRender: function() {
      let btnId = _.uniqueId("bulk-selection-");
      this.selectedLabel = new BulkSelectionCountLabelView({
        collection: this.collection,
        btnId: btnId,
        buttonText: this.options.buttonText
      });
      this.showChildView("selectedLabel", this.selectedLabel);
      this.selectedItemsCollectionView = new BulkSelectionDropdownView({
        collection: this.viewCollection,
        btnId: btnId,
        originalSelectedCollection: this.collection,
        getNodeTypeIconView: this.options.getNodeTypeIconView
      });
      this.showChildView("selectedItemsDropdown", this.selectedItemsCollectionView);
    },
    onMenuOpened: function() {
      this._menuIsOpen = true;
      this._updateViewCollection();
    },
    onMenuClosed: function() {
      this._menuIsOpen = false;
      this.viewCollection.reset([]);
    },
    _updateViewCollection: function() {
      this.viewCollection.set(this.collection.models, {
        add: true,
        remove: true,
        merge: true
      });
    }
  });
  return BulkSelectionView;
});