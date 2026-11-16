/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette3", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/selected.count/impl/selected.count.label.view", "csui/controls/selected.count/impl/selected.items.collection.view", "hbs!csui/controls/selected.count/impl/selected.count.control", "css!csui/controls/selected.count/impl/selected.count" ], function(_, Marionette, TabableRegionBehavior, SelectedCountLabelView, SelectedItemsCollectionView, template) {
  "use strict";
  let SelectedCounterView = Marionette.View.extend({
    className: "csui-selected-count",
    template: template,
    regions: {
      selectedLabel: ".csui-selected-counter-region",
      selectedItemsDropdown: ".csui-selected-dropdown"
    },
    constructor: function SelectedCounterView(options) {
      options || (options = {});
      this.options = options;
      this.options.collection = this.options.collection;
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    onRender: function() {
      this.selectedLabel = new SelectedCountLabelView({
        collection: this.options.collection,
        parentView: this
      });
      this._regions.selectedLabel.show(this.selectedLabel);
    },
    showSelectedDropdown: function() {
      this.selectedItemsCollectionView = new SelectedItemsCollectionView({
        collection: this.options.collection,
        parentView: this
      });
      this._regions.selectedItemsDropdown.show(this.selectedItemsCollectionView);
    },
    destroySelectedDropdown: function() {
      if (this.selectedLabel?.el?.ariaExpanded === "true") this.selectedLabel.el.ariaExpanded = false;
      this.selectedItemsCollectionView?.destroy();
    },
    currentlyFocusedElement: function() {
      return this.selectedLabel?.el;
    },
    resetState: function() {
      this.selectedItemsCollectionView?.resetState();
    }
  });
  return SelectedCounterView;
});