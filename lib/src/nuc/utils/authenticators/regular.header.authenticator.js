/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'module',
  'nuc/lib/underscore',
  'nuc/utils/authenticators/authenticator',
  'nuc/utils/namedsessionstorage'
], function (module, _, Authenticator, NamedSessionStorage) {
  'use strict';

  var config = _.extend(
    {
      rememberAuthenticationHeaders: true
    },
    module.config()
  );

  var storage = new NamedSessionStorage(module.id);

  var RegularHeaderAuthenticator = Authenticator.extend({
    constructor: function RegularHeaderAuthenticator(options) {
      Authenticator.prototype.constructor.call(this, options);
    },

    doAuthenticate: function (options, _succeeded, _failed) {
      var headers = options.headers || this.connection.authenticationHeaders;
      if (headers) {
        this.connection.authenticationHeaders = headers;
        if (config.rememberAuthenticationHeaders) {
          storage.remove(this.connection.url);
        }
      }
    },

    unauthenticate: function (_options) {
      this.connection.authenticationHeaders = undefined;
      if (config.rememberAuthenticationHeaders) {
        storage.remove(this.connection.url);
      }
      return this;
    },

    isAuthenticated: function () {
      return !!this.connection.authenticationHeaders;
    },

    syncStorage: function () {
      if (!this.connection.authenticationHeaders && config.rememberAuthenticationHeaders) {
        this.connection.authenticationHeaders = storage.get(this.connection.url);
      }
      return this;
    },

    setAuthenticationHeaders: function (headers) {
      _.extend(headers, this.connection.authenticationHeaders);
    }
  });

  return RegularHeaderAuthenticator;
});
