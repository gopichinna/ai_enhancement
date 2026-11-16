/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/jquery" ], function(module, require, _, $) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          options || (options = {});
          this.context = options.context;
          return this;
        },
        sync: function(method) {
          var deferred = $.Deferred();
          if (method === "read") {
            deferred.resolve([]);
          } else {
            deferred.reject(new Error(`Cannot save widget settings collection as a whole`));
          }
          return deferred.promise();
        }
      });
    }
  };
});