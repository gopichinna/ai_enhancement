/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore" ], function(_) {
  "use strict";
  var D2FetchableMixin = {
    mixin: function(prototype) {
      var originalFetch = prototype.fetch;
      return _.extend(prototype, {
        makeD2Fetchable: function() {
          return this;
        },
        fetch: function(options) {
          if (this.fetching === false && this.delayedActions && this.delayedActions.fetching) {
            this.delayedActions.fetching = false;
          }
          return originalFetch.call(this, options);
        }
      });
    }
  };
  return D2FetchableMixin;
});