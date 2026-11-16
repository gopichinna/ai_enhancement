/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/url", "csui/models/browsable/v1.request.mixin", "csui/models/browsable/v2.response.mixin" ], function(_, Url, BrowsableV1RequestMixin, BrowsableV2ResponseMixin) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      BrowsableV2ResponseMixin.mixin(prototype);
      BrowsableV1RequestMixin.mixin(prototype);
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          this.makeBrowsableV1Request(options).makeBrowsableV2Response(options);
          return this;
        },
        url: function() {
          var url = this.connector.getConnectionUrl().getApiBase("v2");
          url = Url.combine(url, "/members/accessed");
          var query;
          query = Url.combineQueryString(this.getBrowsableUrlQuery(), this.getResourceFieldsUrlQuery(), this.getExpandableResourcesUrlQuery(), this.getStateEnablingUrlQuery(), this.getAdditionalResourcesUrlQuery(), this.getRequestedCommandsUrlQuery(), this.options.recentlyAccessedSubtypes ? this.options.recentlyAccessedSubtypes.map(e => "where_type=" + e).join("&") : "");
          return Url.appendQuery(url, query);
        },
        parse: function(response, options) {
          this.parseBrowsedState(response, options);
          return this.parseBrowsedItems(response, options);
        }
      });
    }
  };
  return ServerAdaptorMixin;
});