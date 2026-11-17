/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/utils/url'], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (_options) {
          return this;
        },

        url: function () {
          var apiBase = new Url(this.connector.connection.url).getApiBase('v1'),
            url = Url.combine(apiBase, '/auth'),
            query = Url.combineQueryString(
              this.getExpandableResourcesUrlQuery(),
              this.getAdditionalResourcesUrlQuery()
            );
          return query ? url + '?' + query : url;
        },

        parse: function (response) {
          var user = response.data || {};
          user.perspective = response.perspective;
          return user;
        }
      });
    }
  };

  return ServerAdaptorMixin;
});
