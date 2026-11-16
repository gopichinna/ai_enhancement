/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "d2/utils/rest.linkrels", "d2/utils/constants", "dctmw/utils/rest.resources", "nuc/utils/url", "dctmw/utils/utils", "d2/utils/widget.constants" ], function(_, $, Backbone, RestLinkrels, constants, RestResources, Url, utils, widgetConstants) {
  "use strict";
  var RelationTypesModel = Backbone.Model.extend({
    constructor: function RelationTypesModel(options) {
      options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, options);
    },
    getUrl: function() {
      var w = RestResources.getCurrentUser().get("defaultWidgets"), urlParams = {
        "widget-name": w[widgetConstants.DEFAULT.RELATIONS] || "",
        inline: true
      }, links = RestResources.getCurrentRepository().get("links"), url = Url.combine(RestLinkrels.getLink(links, RestLinkrels.D2_CONFIGURATIONS), "d2-relation-types-config");
      return Url.appendQuery(url, Url.combineQueryString(urlParams));
    },
    sync: function(method, model, options) {
      this.trigger("request", model, {}, options);
      var promise = $.Deferred();
      var me = this;
      $.ajax(this.get("connector").extendAjaxOptions({
        url: me.getUrl(),
        type: "GET",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_D2_V1_JSON
        },
        success: function(response) {
          options.success.call(options.context, response, "success", {});
          promise.resolve(response);
        },
        error: function(request, textStatus, error) {
          options.error.call(request, textStatus, error);
          promise.reject(error);
        }
      }));
      return promise.promise();
    }
  });
  return RelationTypesModel;
});