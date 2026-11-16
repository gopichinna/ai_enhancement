/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone" ], function(_, Backbone) {
  "use strict";
  var oldOnModelEvent = Backbone.Collection.prototype._onModelEvent;
  Backbone.Collection.prototype._onModelEvent = function(event, model, collection, options) {
    if (options && options.d2SuppressModelEvents && _.contains(options.d2SuppressModelEvents, event)) {
      return;
    }
    oldOnModelEvent.apply(this, arguments);
  };
});