/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone" ], function(_, Backbone) {
  "use strict";
  function LocationBaseFactory(options) {
    this.options = options || {};
  }
  _.extend(LocationBaseFactory.prototype, {
    updateLocationModel: function() {},
    getLocationParameters: function() {
      return {
        container: null,
        collection: null,
        locationName: ""
      };
    }
  });
  LocationBaseFactory.extend = Backbone.View.extend;
  return LocationBaseFactory;
});