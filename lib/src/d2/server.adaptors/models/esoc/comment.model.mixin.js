/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/underscore", "nuc/utils/url", "d2/utils/rest.linkrels", "d2/utils/constants" ], function($, Backbone, _, Url, RestLinkrels, constants) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        sync: function(method, model, options) {
          switch (method) {
           case "create":
            _.extend(options, {
              contentType: constants.MediaTypes.DCTM_JSON,
              data: JSON.stringify({
                "content-value": options.jsonFormData.status
              }),
              url: RestLinkrels.getLink(options.currentNodeModel.get("links"), RestLinkrels.COMMENTS)
            });
            break;

           case "delete":
            _.extend(options, {
              url: Url.appendQuery(RestLinkrels.getLink(model.get("links"), RestLinkrels.DELETE), Url.combineQueryString({
                "parent-id": model?.collection?.currentNodeModel.get("id")
              }))
            });
            break;
          }
          return Backbone.Collection.prototype.sync.apply(this, arguments);
        }
      });
    }
  };
});