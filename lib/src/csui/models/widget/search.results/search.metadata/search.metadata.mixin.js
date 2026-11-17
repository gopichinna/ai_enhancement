/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone" ], function(_, $, Backbone) {
  "use strict";
  var SearchMetadataMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeSearchMetadataResponse: function(options) {
          return this;
        },
        parseSearchMetadataResponse: function(resp, options) {
          return resp;
        }
      });
    }
  };
  return SearchMetadataMixin;
});