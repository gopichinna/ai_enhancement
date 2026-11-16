/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/contexts/factories/connector", "csui/utils/url" ], function(_, ConnectorFactory, Url) {
  "use strict";
  var SearchQueryMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        searchQueryAction: function(id) {
          var context = this.context || this.options.context;
          var connector = context.getObject(ConnectorFactory);
          var postData = {
            ids: id,
            actions: [ "updatesearchbroker" ]
          };
          var data = {
            method: "POST",
            url: Url.combine(connector.getConnectionUrl().getApiBase("v2"), "/nodes/actions"),
            data: postData
          };
          return connector.makeAjaxCall(data);
        }
      });
    }
  };
  return SearchQueryMixin;
});