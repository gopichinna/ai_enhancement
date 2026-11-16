/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/utils/url" ], function(_, $, Backbone, Url) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      var originalSync = prototype.sync;
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          return this;
        },
        url: function() {
          var url = this.connector.getConnectionUrl().getApiBase("v2"), queryString = "", templateId = this.options.templateId;
          const cacheId = this.options?.collection?.cacheId;
          if (!!cacheId) {
            queryString = Url.combine(queryString, `session/${cacheId}`);
          } else {
            if (templateId) {
              queryString = Url.combine(queryString, "/template/" + templateId);
            } else {
              queryString = Url.combine(queryString, "/template");
            }
          }
          queryString = Url.combine(queryString, "/settings/display");
          return Url.combine(url, "search" + queryString);
        },
        sync: function(method, model, options) {
          return originalSync.apply(this, arguments);
        }
      });
    }
  };
  return ServerAdaptorMixin;
});