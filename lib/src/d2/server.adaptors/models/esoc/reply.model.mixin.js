/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/underscore", "nuc/utils/url", "d2/utils/rest.linkrels", "d2/utils/constants" ], function($, Backbone, _, Url, RestLinkrels, Constants) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        sync: function(method, model, options) {
          var parentCommentModel = options.parentCommentModel;
          switch (method) {
           case "create":
            _.extend(options, {
              contentType: Constants.MediaTypes.DCTM_JSON,
              data: JSON.stringify({
                "content-value": options.jsonFormData.status
              }),
              url: RestLinkrels.getLink(parentCommentModel.get("links"), RestLinkrels.REPLIES)
            });
            break;

           case "delete":
            _.extend(options, {
              url: RestLinkrels.getLink(this.get("links"), RestLinkrels.DELETE)
            });
            break;
          }
          return Backbone.Collection.prototype.sync.apply(this, arguments);
        }
      });
    }
  };
});