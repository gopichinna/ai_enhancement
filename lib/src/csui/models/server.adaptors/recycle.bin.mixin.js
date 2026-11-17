/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/url" ], function(_, Url) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        url: function() {
          const recyclebinVolumeID = 405;
          return Url.combine(this.options.connector.getConnectionUrl().getApiBase("v2"), `volumes/${recyclebinVolumeID}?actions=BrowseRecycleBin`);
        },
        parse: function(response) {
          const results = response.results;
          const parsedResponse = {
            isEnabled: !!results.actions.data.BrowseRecycleBin,
            referenceId: results.data.properties.id,
            modes_available: results.data.properties.modes_available,
            show_purge_date_column: results.data.properties.show_purge_date_column
          };
          return parsedResponse;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});