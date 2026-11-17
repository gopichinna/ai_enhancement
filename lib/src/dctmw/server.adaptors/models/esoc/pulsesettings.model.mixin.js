/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery" ], function(_, $) {
  "use strict";
  return {
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
            var response = {
              links: {
                data: {
                  self: {
                    body: "",
                    content_type: "",
                    href: "",
                    method: "GET",
                    name: ""
                  }
                }
              },
              results: {
                chatSettings: {
                  chatEnabled: false,
                  presenceEnabled: true
                }
              }
            };
            options.success.call(options.context, {}, "success", response);
            deferred.resolve(response);
          }.bind(this), 1);
          return deferred.promise();
        }
      });
    }
  };
});