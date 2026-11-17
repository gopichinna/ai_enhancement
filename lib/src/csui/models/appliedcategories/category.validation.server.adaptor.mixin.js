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
          var url = this.connector.getConnectionUrl().getApiBase("v1");
          url = Url.combine(url, "validation/nodes/categories/enforcement");
          return url;
        },
        parse: function(response, options) {
          return response;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});