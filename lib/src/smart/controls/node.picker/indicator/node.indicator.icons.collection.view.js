/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "smart/themes/theming" ], function(_, $, Backbone, Marionette, TabableRegionBehavior, theming) {
  var NodeIndicatorItemView = Marionette.ItemView.extend({
    tagName: function() {
      return theming.isJATOTheme() && this.model?.has("jatoIcon") ? "span" : "otc-icon";
    },
    template: false,
    attributes: function() {
      let modelTitle = this.model.get("title");
      let modelAriaLabel = this.model.get("ariaLabel");
      let title = _.isFunction(modelTitle) ? modelTitle(this.options) : modelTitle;
      let ariaLabel = _.isFunction(modelAriaLabel) ? modelAriaLabel(this.options) : modelAriaLabel;
      let retObj = {
        ariaLabel: ariaLabel,
        title: title,
        ...this._getIconInfo()
      };
      return retObj;
    },
    constructor: function NodeIndicatorItemView(options = {}) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      if (theming.isJATOTheme() && this.model?.has("jatoIcon")) {
        this.el.innerHTML = this.model?.get("jatoIcon");
      }
    },
    _getIconInfo: function() {
      let retIconObj = {};
      if (theming.isJATOTheme() && this.model?.has("jatoIcon")) {
        retIconObj.role = "presentation";
      } else {
        retIconObj.icon = this.model?.get("otcIconName");
      }
      return retIconObj;
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