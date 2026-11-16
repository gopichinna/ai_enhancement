/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore" ], function(_) {
  "use strict";
  return {
    mixin: function(prototype) {
      var superParse = prototype.parse;
      return _.extend(prototype, {
        parse: function(response, options) {
          if (this.options && this.options.excludeTypes && this.options.excludeTypes.length) {
            response.entries = _.filter(response.entries, function(entry) {
              return !_.contains(this.options.excludeTypes, entry.content.properties.rObjectType || entry.content.properties.r_object_type);
            }.bind(this));
          }
          return superParse.call(this, response, options);
        }
      });
    }
  };
});