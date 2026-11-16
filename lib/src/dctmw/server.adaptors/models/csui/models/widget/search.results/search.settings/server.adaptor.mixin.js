/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery" ], function(_, $) {
  "use strict";
  const ServerAdaptorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        sync: function(method, model, options = {}) {
          const dfd = $.Deferred();
          this.trigger("request", this, {}, options);
          setTimeout(function() {
            const response = {};
            options.success.call(options.context, {}, "success", response);
            dfd.resolve(response);
          }, 1);
          return dfd.promise();
        }
      });
    }
  };
  return ServerAdaptorMixin;
});