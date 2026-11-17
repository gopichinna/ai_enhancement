/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/url" ], function(_, Url) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      var originalSync = prototype.sync;
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          return this;
        },
        url: function() {
          var url = this.connector.getConnectionUrl().getApiBase("v2"), query = Url.combineQueryString(this.getBrowsableParams(), this.getAdditionalResourcesUrlQuery(), this.getResourceFieldsUrlQuery(), this.getExpandableResourcesUrlQuery(), this.getStateEnablingUrlQuery(), this.getRequestedCommandsUrlQuery());
          if (this.mode) {
            const mode = {
              mode: this.mode
            };
            query = Url.combineQueryString(query, mode);
          }
          url = Url.combine(url, "/volumes/recyclebin/nodes");
          return query ? `${url}?${query}` : url;
        },
        parse: function(response, options) {
          const recycleBinReferenceId = this.recycleBinReferenceId;
          if (Array.isArray(response.results)) {
            response.results.forEach(function(item) {
              item.data.properties.deleted_user_name = item.data.properties?.deleted_user_id_expand?.name;
              item.data.properties.created_by_user_name = item.data.properties?.create_user_id_expand?.name;
              item.data.properties.reference_id = recycleBinReferenceId;
            });
          }
          this.parseBrowsedState(response, options);
          return this.parseBrowsedItems(response, options);
        }
      });
    }
  };
  return ServerAdaptorMixin;
});