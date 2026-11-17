/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery" ], function(_, $) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        sync: function(method, model, options) {
          var deferred = $.Deferred();
          options = _.defaults({
            parse: false
          }, options);
          this.trigger("request", this, {}, options);
          setTimeout(function() {
            options.success.call(options.context, {}, "success", {});
            deferred.resolve();
          }.bind(this));
          return deferred.promise();
        }
      });
    }
  };
  return ServerAdaptorMixin;
});