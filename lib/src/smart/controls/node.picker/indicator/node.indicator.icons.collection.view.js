/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior" ], function(_, $, Backbone, Marionette, TabableRegionBehavior) {
  var NodeIndicatorItemView = Marionette.ItemView.extend({
    tagName: "otc-icon",
    template: false,
    attributes: function() {
      let modelTitle = this.model.get("title");
      let modelAriaLabel = this.model.get("ariaLabel");
      let title = _.isFunction(modelTitle) ? modelTitle(this.options) : modelTitle;
      let ariaLabel = _.isFunction(modelAriaLabel) ? modelAriaLabel(this.options) : modelAriaLabel;
      let retObj = {
        ariaLabel: ariaLabel,
        title: title,
        icon: this.model.get("otcIconName")
      };
      return retObj;
    },
    constructor: function NodeIndicatorItemView(options = {}) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  var NodeIndicatorCollectionView = Marionette.CollectionView.extend({
    className: "smart-indicator-icons",
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    childView: NodeIndicatorItemView,
    childViewOptions: function() {
      return this.options;
    },
    constructor: function NodeIndicatorCollectionView(options = {}) {
      Marionette.CollectionView.call(this, options);
    },
    is: "NodeIndicatorCollectionView"
  });
  return NodeIndicatorCollectionView;
});