/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/backbone'], function (_, Backbone) {
  'use strict';

  // Defines the authentication interface.
  function Authenticator(options) {
    this.connection = (options && options.connection) || {};
  }

  _.extend(Authenticator.prototype, Backbone.Events, {
    authenticate: function (options, succeeded, failed) {
      // Normalize input parameters, which are all optional.
      if (typeof options === 'function') {
        failed = succeeded;
        succeeded = options;
        options = undefined;
      }
      options || (options = {});

      this.syncStorage(options.session);
      if (this.doAuthenticate(options, succeeded, failed)) {
        return this;
      }

      if (this.isAuthenticated()) {
        if (succeeded) {
          succeeded(this.connection);
        }
      } else {
        var error = new Error('Missing authentication parameters.');
        if (failed) {
          failed(error, this.connection);
        } else {
          throw error;
        }
      }
      return this;
    },

    setUserId: function (userId) {
      this.userId = userId;
    },

    getUserId: function () {
      return this.userId;
    },

    doAuthenticate: function (_options) {},

    unauthenticate: function (_options) {
      return this;
    },

    isAuthenticated: function () {
      return false;
    },

    syncStorage: function (_session) {
      return this;
    },

    setAuthenticationHeaders: function (_headers) {},

    updateAuthenticatedSession: function (_session) {}
  });

  Authenticator.extend = Backbone.View.extend;

  return Authenticator;
});
