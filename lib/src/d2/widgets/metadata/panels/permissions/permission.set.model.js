/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "d2/utils/rest.linkrels", "i18n!d2/widgets/metadata/panels/permissions/impl/nls/lang" ], function(module, _, Backbone, Url, RestLinkrels, lang) {
  "use strict";
  var PermissionSetModel = Backbone.Model.extend({
    idAttribute: "aclName",
    url: function() {
      var accessorQueryParam = this.options.accessorQueryParam, fullUrl = RestLinkrels.getLink(this.options.nodeModel.get("links"), RestLinkrels.D2_PERMISSION_SET);
      if (accessorQueryParam) {
        fullUrl = Url.appendQuery(fullUrl, Url.combineQueryString({
          "accessor-id": accessorQueryParam
        }));
      }
      return fullUrl;
    },
    constructor: function PermissionSetModel(attributes, options) {
      this.options = options;
      Backbone.Model.prototype.constructor.call(this, arguments);
    },
    parse: function(response) {
      var aclName = response && response["acl_name"] || "", aclConfigName = response && response["acl_config_name"] || "", aclCombinedName = aclConfigName ? aclConfigName === aclName ? aclConfigName : _.str.sformat(lang.securityTemplateFormatter, aclConfigName, aclName) : aclName;
      this.set("aclName", aclName);
      this.set("aclCombinedName", aclCombinedName);
      this.set("response", response);
    },
    sync: function(method, model, options) {
      if (method === "read") {
        this.options.connector.extendAjaxOptions(options);
      }
      return Backbone.Model.prototype.sync.apply(this, arguments);
    }
  });
  return PermissionSetModel;
});