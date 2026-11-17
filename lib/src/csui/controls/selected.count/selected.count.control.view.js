/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette3", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "hbs!csui/controls/selected.count/impl/selected.count.control", "smart/controls/bulk.selection/bulk.selection.view", "csui/controls/node-type.icon/node-type.icon.view", "css!csui/controls/selected.count/impl/selected.count" ], function(_, Marionette, TabableRegionBehavior, template, BulkSelectionView, NodeTypeIconView) {
  "use strict";
  let SelectedCounterView = Marionette.View.extend({
    template: template,
    className: "csui-selected-count",
    regions: {
      selectedCounter: {
        el: ".csui-selected-counter-region",
        replaceElement: true
      }
    },
    constructor: function SelectedCounterView(options) {
      options || (options = {});
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    onRender: function() {
      this.selectedCountView = new BulkSelectionView({
        collection: this.collection,
        getNodeTypeIconView: this.getNodeTypeIconView.bind(this)
      });
      this.showChildView("selectedCounter", this.selectedCountView);
    },
    getNodeTypeIconView: function(iconViewOptions) {
      return new NodeTypeIconView(iconViewOptions);
    },
    currentlyFocusedElement: function() {
      return this.selectedCountView?.selectedLabel?.el;
    }
  });
  return SelectedCounterView;
});