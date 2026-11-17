/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/url", "esoc/widgets/common/util" ], function(_, Url, CommonUtil) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          return this;
        },
        url: function(options) {
          var restUrl = Url.combine(CommonUtil.getV2Url(this.connector.getConnectionUrl()), CommonUtil.REST_URLS.pulseSettingsUrl);
          if (this.options.chat) {
            restUrl = CommonUtil.updateQueryStringValues(restUrl, CommonUtil.globalConstants.FIELDS, CommonUtil.globalConstants.CHAT_SEETINGS);
          }
          return restUrl;
        },
        parse: function(response) {
          this.options.fetched = false;
          return response.results;
        },
        isFetchable: function() {
          return this.options.fetched;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});