/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/utils/url" ], function(Url) {
  "use strict";
  let ServerAdaptorMixin = {
    mixin: function(prototype) {
      return Object.assign(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        url: function() {
          let query;
          let url = Url.combine(this.connector.getConnectionUrl().getApiBase("v2"), "nodes", this.options.node.get("id"));
          query = Url.combineQueryString({
            fields: [ "dynamicpermissions" ],
            expand: [ "dynamicpermissions{role_id}" ]
          }, query);
          if (query) {
            url += "?" + query;
          }
          return url;
        },
        parse: function(response) {
          if (response.results?.data?.dynamicpermissions) {
            let dynamicPermissionCollection = [];
            if (Array.isArray(response.results.data.dynamicpermissions)) {
              for (let data of response.results.data.dynamicpermissions) {
                let mergedObject = Object.assign(data, data.role_id_expand);
                delete mergedObject.role_id_expand;
                mergedObject.dynamicpermissions = mergedObject.permissions;
                dynamicPermissionCollection.push(mergedObject);
              }
            }
            return dynamicPermissionCollection;
          }
        }
      });
    }
  };
  return ServerAdaptorMixin;
});