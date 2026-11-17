/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/controls/tile/behaviors/infinite.scrolling.behavior" ], function($, _, Marionette, InfiniteScrollingBehavior) {
  "use strict";
  var ClientSideInfiniteScrollingBehavior = InfiniteScrollingBehavior.extend({
    _checkScrollPositionFetch: function() {
      var collection = this.view.collection;
      if (collection.length < collection.totalCount && !collection.fetching) {
        var me = this;
        var fetchMoreItemLength = this.options["fetchMoreItemLength"] || 30;
        var fetch = collection.length + fetchMoreItemLength;
        fetch = Math.min(fetch, collection.totalCount);
        if (fetch <= collection.filteredCount) {
          this.view.trigger("before:collection:scroll:fetch");
          collection.setTop(fetch, false);
          collection.fetch({
            reset: false,
            remove: false,
            merge: false,
            success: function() {
              me.view.trigger("collection:scroll:fetch");
            }
          });
        }
      }
    },
    _checkScrollPosition: function() {
      var fetchMoreItemsThreshold = getOption.call(this, "fetchMoreItemsThreshold");
      var scrollablePercentage = Math.abs(($(this._contentParent)[0].offsetHeight + this._contentParent.scrollTop()) * 100 / $(this._contentParent)[0].scrollHeight);
      if (scrollablePercentage >= fetchMoreItemsThreshold) {
        this._checkScrollPositionFetch();
      }
    }
  });
  function getOption(property) {
    var options = this.options || {};
    var value = options[property];
    return _.isFunction(value) ? options[property].call(this.view) : value;
  }
  return ClientSideInfiniteScrollingBehavior;
});