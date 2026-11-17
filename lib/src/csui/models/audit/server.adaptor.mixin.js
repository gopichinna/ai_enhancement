/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/url" ], function(_, Url) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          return this;
        },
        url: function() {
          var apiUrl = new Url(this.connector.connection.url).getApiBase(2);
          var query = Url.combineQueryString(this.getBrowsableUrlQuery(), {
            expand: "audit{id, user_id, agent_id, target_user_id}"
          });
          return Url.combine(apiUrl, "nodes", this.options.node.get("id"), "audit?" + query);
        },
        parse: function(response, options) {
          this.parseBrowsedState(response, options);
          this.columns && this.columns.resetColumnsV2(response, this.options);
          this.auditEvents.add(response.results.data.audit_event_types);
          return response.results.data.audit;
        },
        isFetchable: function() {
          return !!this.options;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});