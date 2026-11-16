/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery" ], function(_, $) {
  "use strict";
  return {
    mixin: function(prototype) {
      _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        sync: function(method, model, options) {
          var succssFn = options.success;
          if (_.isFunction(succssFn)) {
            setTimeout(function() {
              succssFn({});
            }, 0);
          }
          return $.Deferred().resolve().promise();
        }
      });
    }
  };
});