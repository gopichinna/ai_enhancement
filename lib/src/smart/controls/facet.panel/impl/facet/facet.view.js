/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "module", "nuc/lib/jquery", "nuc/lib/marionette", "smart/controls/facet.panel/impl/facet/facet.item.view" ], function(_, module, $, Marionette, FacetItemView) {
  var config = module.config();
  _.defaults(config, {
    displayCount: "Always"
  });
  var FacetView = Marionette.CollectionView.extend({
    childView: FacetItemView,
    childViewContainer: ".cs-filter-group",
    childViewOptions: function() {
      return {
        enableCheckBoxes: this.model.get("select_multiple") !== undefined ? this.model.get("select_multiple") : true,
        displayCountProps: this.displayCountProps,
        maxCount: this.maxCount,
        context: this.options.context,
        showButtonsInEachFacet: this.showButtonsInEachFacet
      };
    },
    constructor: function FacetView(options) {
      options || (options = {});
      options.data || (options.data = {});
      this.showButtonsInEachFacet = options.showButtonsInEachFacet;
      this.displayCountProps = options.displayCountProps, Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.maxCount = this.options.maxCount;
    },
    filter: function(view, index, children) {
      let value = this.maxCount ? index < this.maxCount : true;
      return value;
    }
  });
  return FacetView;
});