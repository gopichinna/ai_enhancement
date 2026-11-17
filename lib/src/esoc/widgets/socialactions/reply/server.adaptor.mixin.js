/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/backbone", "csui/lib/underscore", "csui/utils/url", "esoc/widgets/socialactions/util" ], function($, Backbone, _, Url, Util) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          return this;
        },
        sync: function(method, model, options) {
          switch (method) {
           case "create":
            _.extend(options, {
              contentType: false,
              dataType: "text",
              crossDomain: true,
              processData: false,
              url: this.connector.connection.url + Util.commonUtil.REST_URLS.csPostCommentRESTUrl
            });
            break;

           case "delete":
            _.extend(options, {
              url: this.connector.connection.url + this.attributes.actions.deleteAction.href + "?id=" + this.id
            });
            break;
          }
          return Backbone.Collection.prototype.sync.apply(this, arguments);
        }
      });
    }
  };
  return ServerAdaptorMixin;
});