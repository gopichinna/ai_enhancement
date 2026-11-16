/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/behaviors/collection.state/collection.state.behavior" ], function(_, CollectionStateBehavior) {
  "use strict";
  CollectionStateBehavior.prototype._collectionReset = function(collection) {
    var state = this.collectionState.get("state");
    if (state !== "loading" && state !== "error") {
      var collectionState;
      if (collection.length) {
        collectionState = "full";
      } else if (this.view.options.filterValue) {
        collectionState = "zeroResults";
      } else {
        collectionState = "empty";
      }
      this.collectionState.set("state", collectionState);
    }
  };
  var origFetchingCollectionStarted = CollectionStateBehavior.prototype._fetchingCollectionStarted;
  CollectionStateBehavior.prototype._fetchingCollectionStarted = function() {
    origFetchingCollectionStarted.apply(this, arguments);
    if (this.view.collection.length === 0) {
      this.view.unblockActions && this.view.unblockActions();
      this.view.blockActions && this.view.blockActions();
    }
  };
});