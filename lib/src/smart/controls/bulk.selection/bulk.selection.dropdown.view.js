/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/bulk.selection/bulk.selection.dropdown.item.view", "smart/utils/otwc.loader" ], function(_, $, Backbone, Marionette, BulkSelectionDropdownItemItemView) {
  "use strict";
  var BulkSelectionDropdownCollectionView = Marionette.CollectionView.extend({
    tagName: "otc-menu",
    childView: BulkSelectionDropdownItemItemView,
    childViewOptions: function() {
      return {
        getNodeTypeIconView: this.options.getNodeTypeIconView
      };
    },
    childEvents: {
      "remove:selected:item": "onRemoveSelectedItem"
    },
    events: {
      "clear-all": "onClearAll"
    },
    onRemoveSelectedItem: function(view) {
      this.collection.remove(view.model);
    },
    onClearAll: function() {
      this.collection.reset();
    },
    attributes: function() {
      return {
        id: `${this.options.baseId}-menu`,
        buttonId: `${this.options.baseId}-button`,
        clearAll: this.collection.length > 4 ? "true" : undefined,
        clearAllText: this.options.clearAllText
      };
    },
    constructor: function BulkSelectionDropdownCollectionView(options = {}) {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.collection, "reset remove add", this.onCollectionUpdate);
    },
    onCollectionUpdate: function() {
      this.el.toggleAttribute("clearAll", this.collection.length > 4);
    }
  });
  return BulkSelectionDropdownCollectionView;
});