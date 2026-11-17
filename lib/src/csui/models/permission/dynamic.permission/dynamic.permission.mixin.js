/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/url" ], function(Url) {
  "use strict";
  let ServerAdaptorMixin = {
    mixin: function(prototype) {
      return Object.assign(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        url: function() {
          let nodeId = this.nodeId;
          let roleId = this.get("role_id");
          let url = this.options.connector.getConnectionUrl().getApiBase("v2");
          url = Url.combine(url, "nodes", nodeId, "permissions", "dynamic");
          const addingNewRole = this.isNew && this.isNew();
          if (!addingNewRole) {
            url = Url.combine(url, roleId);
          }
          return url;
        },
        parse: function(response) {
          return response;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});