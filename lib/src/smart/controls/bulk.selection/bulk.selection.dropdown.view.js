/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "smart/controls/bulk.selection/bulk.selection.dropdown.item.view", "i18n!smart/controls/bulk.selection/impl/nls/lang", "smart/utils/otwc.loader" ], function(_, Marionette, BulkSelectionDropdownItemItemView, lang) {
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
      "clear-all": "onClearAll",
      open: "onOpen",
      close: "onClose"
    },
    onRemoveSelectedItem: function(view) {
      const selectedItemIndex = this.collection.indexOf(view.model);
      const itemToFocusIndex = selectedItemIndex === this.collection.length - 1 ? selectedItemIndex - 1 : selectedItemIndex + 1;
      let itemToFocus = null;
      if (itemToFocusIndex >= 0) {
        itemToFocus = this.children.findByIndex(itemToFocusIndex);
      } else {
        this.el.isOpen = false;
      }
      this.options.originalSelectedCollection.remove(view.model);
      itemToFocus?.el.focus();
    },
    onClearAll: function() {
      this.options.originalSelectedCollection.reset();
      this.el.isOpen = false;
    },
    onOpen: function() {
      this.triggerMethod("menu:open");
      this.el.firstElementChild.focus();
    },
    onClose: function() {
      this.triggerMethod("menu:close");
    },
    attributes: function() {
      return {
        id: `${this.options.btnId}-menu`,
        clearAll: this.options.originalSelectedCollection.length > 4 ? "true" : undefined,
        buttonid: this.options.btnId,
        buttonalignment: "start",
        clearalltext: lang.clearAllText,
        maxitems: "0",
        scrollable: ""
      };
    },
    constructor: function BulkSelectionDropdownCollectionView() {
      BulkSelectionDropdownCollectionView.__super__.constructor.apply(this, arguments);
      this.listenTo(this.options.originalSelectedCollection, "reset remove add", this.onCollectionUpdate);
    },
    onCollectionUpdate: function() {
      this.el.toggleAttribute("clearAll", this.options.originalSelectedCollection.length > 4);
    }
  });
  return BulkSelectionDropdownCollectionView;
});