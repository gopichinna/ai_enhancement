/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/backbone", "nuc/utils/url", "d2/utils/rest.linkrels" ], function(module, Backbone, Url, RestLinkrels) {
  "use strict";
  var PermissionsModel = Backbone.Model.extend({
    idAttribute: "nodeId",
    url: function() {
      var accessorQueryParam = this.options.accessorNameQueryParam, fullUrl = RestLinkrels.getLink(this.options.nodeModel.get("links"), RestLinkrels.D2_PERMISSIONS);
      if (accessorQueryParam) {
        fullUrl = Url.appendQuery(fullUrl, Url.combineQueryString({
          accessor: accessorQueryParam
        }));
      }
      return fullUrl;
    },
    constructor: function PermissionsModel(attributes, options) {
      this.options = options;
      Backbone.Model.prototype.constructor.call(this, arguments);
    },
    parse: function(response) {
      var accessorName = response && response["accessor"] || "", basicPermission = response && response["basic-permission"] || "", extendedPermissions = response && response["extend-permissions"] || "";
      this.set("accessorName", accessorName);
      this.set("basicPermission", basicPermission);
      this.set("extendedPermissions", extendedPermissions);
    },
    sync: function(method, model, options) {
      if (method === "read") {
        this.options.connector.extendAjaxOptions(options);
      }
      return Backbone.Model.prototype.sync.apply(this, arguments);
    }
  });
  return PermissionsModel;
});