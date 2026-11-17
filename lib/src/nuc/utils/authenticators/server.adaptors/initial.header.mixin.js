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

        prepareRequest: function (options) {
          // Allow calling the login() method directly with partial
          // request settings overriding the authenticator defaults.
          var headers = (options && options.headers) || this.connection.authenticationHeaders;
          return {
            url: Url.combine(this.connection.url, 'auth'),
            headers: headers
          };
        }
      });
    }
  };

  return ServerAdaptorMixin;
});
