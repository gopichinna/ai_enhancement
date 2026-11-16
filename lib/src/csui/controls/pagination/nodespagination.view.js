/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "smart/controls/pagination/nodespagination.view" ], function(_, TabableRegionBehavior, SmartPaginationView) {
  var NodesPaginationView = SmartPaginationView.extend({
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    constructor: function NodesPaginationView(options) {
      if (options.collection) {
        this.listenTo(options.collection, "collection:set:limit", _.bind(this.collectionReset, this));
      }
      SmartPaginationView.prototype.constructor.call(this, options);
    },
    collectionReset: function(resetObj) {
      this.collection.setLimit(resetObj.skipItems, resetObj.pageSize, resetObj.autoFetch, resetObj.paginationView);
    }
  });
  return NodesPaginationView;
});