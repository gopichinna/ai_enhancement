/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/utils/url" ], function($, _, Url) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          return this;
        },
        url: function() {
          return Url.combine(this.node.urlBase(), "categories");
        },
        parse: function(response, options) {
          return this.sortInitially(response.data);
        },
        sortInitially: function(data) {
          return _.isArray(data) ? _.sortBy(data, function(ele) {
            return ele.name.toLowerCase();
          }) : data;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});