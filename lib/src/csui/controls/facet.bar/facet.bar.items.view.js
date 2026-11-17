/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "smart/controls/facet.bar/facet.bar.view" ], function(_, SmartFacetBarView) {
  var ExtendedFacetBarView = SmartFacetBarView.extend({
    constructor: function ExtendedFacetBarView(options) {
      this.listenTo(this, "remove:all", this.clearAllFilters).listenTo(this, "remove:filter", this.removeFilter).listenTo(this, "filters:updated", this.filtersUpdated);
      SmartFacetBarView.prototype.constructor.call(this, options);
    },
    clearAllFilters: function() {
      this.triggerMethod("clear:all:filters");
    },
    removeFilter: function(filter) {
      this.removeFilter = filter;
      this.triggerMethod("remove:facet:filter", this.removeFilter);
    },
    filtersUpdated: function() {
      this.triggerMethod("facet:filters:updated");
    }
  });
  return ExtendedFacetBarView;
});