/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/utils/url" ], function(_, $, Url) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          return this;
        },
        url: function() {
          var perspectiveId = this.get("perspective_id"), url = new Url(this.connector.connection.url).getApiBase("v2");
          if (!!perspectiveId) {
            url = Url.combine(url, "perspectives", perspectiveId, "personalization");
          } else {
            throw new Error("Unsupported perspective_id value");
          }
          return url;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});