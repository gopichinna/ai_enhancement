/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/bulk.selection/bulk.selection.dropdown.view", "hbs!smart/controls/bulk.selection/impl/bulk.selection", "i18n!smart/controls/bulk.selection/impl/nls/lang", "smart/utils/otwc.loader" ], function(_, $, Backbone, Marionette, BulkSelectionDropdownView, bulkSelectionTemplate, lang) {
  "use strict";
  var BulkSelectionView = Marionette.LayoutView.extend({
    template: bulkSelectionTemplate,
    templateHelpers: function() {
      return {
        baseId: this.options.baseId,
        buttonText: this.options.buttonText || lang.buttonText,
        selectedCount: this.collection?.length
      };
    },
    ui: {
      selectedCountBadge: "otc-badge"
    },
    regions: {
      menuRegion: ".csui-bulk-selection-dropdown"
    },
    constructor: function BulkSelectionView(options = {}) {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.options.baseId = _.uniqueId("bulkSelection");
      this.options.clearAllText = lang.clearAllText;
      this.listenTo(this.collection, "reset remove add", this.onCollectionUpdate);
    },
    onRender: function() {
      this.bulkSelectionDropdownView = new BulkSelectionDropdownView({
        ...this.options,
        collection: this.collection
      });
      this.menuRegion.show(this.bulkSelectionDropdownView);
    },
    onCollectionUpdate: function() {
      this.selectedCount = this.collection.length;
      this.ui.selectedCountBadge.prop("value", this.selectedCount);
    }
  });
  return BulkSelectionView;
});