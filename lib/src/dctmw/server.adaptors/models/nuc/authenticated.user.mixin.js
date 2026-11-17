/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "dctmw/utils/rest.resources" ], function($, _, RestResources) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        sync: function(method, model, options) {
          if (method === "read") {
            var deferred = $.Deferred(), user = RestResources.getCurrentUser();
            options.parse = false;
            this.trigger("request", this, {}, options);
            setTimeout(function() {
              options.success.call(options.context, user.attributes, "success", {});
              deferred.resolve();
            });
            return deferred.promise();
          }
          throw new Error("Only read is supported");
        }
      });
    }
  };
});