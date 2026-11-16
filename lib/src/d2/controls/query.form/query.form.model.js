/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "d2/utils/rest.linkrels", "d2/utils/constants" ], function(_, $, Backbone, Url, ConnectableMixin, FetchableMixin, RestLinkrels, constants) {
  "use strict";
  var QueryFormModel = Backbone.Model.extend({
    constructor: function QueryFormModel(options) {
      options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, options);
      this.makeConnectable(options).makeFetchable(options);
    },
    getUrl: function() {
      return RestLinkrels.getLink(this.get("links"), RestLinkrels.D2_QUERYFORM_DIALOG);
    },
    sync: function(method, model, options) {
      this.trigger("request", model, {}, options);
      var promise = $.Deferred();
      var me = this;
      $.ajax(this.get("connector").extendAjaxOptions({
        url: me.getUrl(),
        type: "GET",
        headers: {
          Accept: constants.MediaTypes.DCTM_JSON,
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        success: function(response) {
          options.success.call(options.context, response, "success", {});
          promise.resolve();
        },
        error: function(request, textStatus, error) {
          options.error.call(request, textStatus, error);
          promise.reject(error);
        }
      }));
      return promise.promise();
    }
  });
  ConnectableMixin.mixin(QueryFormModel.prototype);
  FetchableMixin.mixin(QueryFormModel.prototype);
  return QueryFormModel;
});