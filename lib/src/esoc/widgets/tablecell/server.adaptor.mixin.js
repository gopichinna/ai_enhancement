/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/utils/url", "esoc/widgets/common/util" ], function(_, Backbone, Url, CommonUtil) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          return this;
        },
        url: function() {
          var csId = this.attributes.csId, currentNodeModel = this.attributes.currentNodeModel, connector = this.connector, parentObject = currentNodeModel.get("parent_id"), parentId = !!parentObject && parentObject instanceof Object ? parentObject.id : parentObject, nodesUrl = CommonUtil.updateQueryStringValues(Url.combine(CommonUtil.getV2Url(connector.getConnectionUrl()), "nodes", parentId, "nodes"), "where_name", currentNodeModel.get("name")), ajaxParams = {
            url: nodesUrl,
            type: "GET",
            currentNodeModel: currentNodeModel,
            connector: connector,
            requestType: "getCommentCount"
          };
          CommonUtil.updateAjaxCall(ajaxParams);
          return Url.combine(currentNodeModel.connector.connection.url, CommonUtil.REST_URLS.csGetROI) + "CSID=" + csId;
        },
        sync: function(method, model, options) {
          options.cache = false;
          return Backbone.Model.prototype.sync.apply(this, arguments);
        }
      });
    }
  };
  return ServerAdaptorMixin;
});