/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'require',
  'nuc/utils/authenticators/request.authenticator',
  'nuc/utils/authenticators/server.adaptors/credentials.mixin'
], function (require, RequestAuthenticator, ServerAdaptorMixin) {
  'use strict';

  // Authenticates the requests using the Base Authentication standard;
  // by sending encoded credentials in every request.
  var CredentialsAuthenticator = RequestAuthenticator.extend({
    constructor: function CredentialsAuthenticator(options) {
      RequestAuthenticator.prototype.constructor.call(this, options);
      this.credentials = options && options.credentials;
      this.makeServerAdaptor(options);
    },

    doAuthenticate: function (options, succeeded, failed) {
      var credentials = options.credentials || this.credentials || this.connection.credentials,
        self = this;
      if (credentials) {
        this.connection.credentials = credentials;
        this.login({}, succeeded, function (error, connection) {
          self._reportError(error);
          self.unauthenticate({ reason: 'failed' });
          if (failed) {
            failed(error, connection);
          }
        });
        return true;
      }
    },

    _reportError: function (error) {
      require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
        ModalAlert.showError(error.toString());
      });
    }
  });

  ServerAdaptorMixin.mixin(CredentialsAuthenticator.prototype);

  return CredentialsAuthenticator;
});
