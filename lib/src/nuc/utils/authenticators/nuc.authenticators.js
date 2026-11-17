/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'require',
  'module',
  'nuc/lib/underscore',
  'nuc/utils/authenticators/ticket.authenticator',
  'nuc/utils/authenticators/basic.authenticator',
  'nuc/utils/authenticators/credentials.authenticator',
  'nuc/utils/authenticators/regular.header.authenticator',
  'nuc/utils/authenticators/initial.header.authenticator'
], function (
  require,
  module,
  _,
  TicketAuthenticator,
  BasicAuthenticator,
  CredentialsAuthenticator,
  RegularHeaderAuthenticator,
  InitialHeaderAuthenticator
) {
  'use strict';

  const config = _.extend(
    {
      // Even if there are no credentials, use Basic Authenticaton and hope
      // for satisfying the authentication challenge later.
      forceBasicAuthenticator: false,
      // If credentials are provided, use Basic Authenticstion for all calls
      // instead of making just an initial call with them to get a ticket.
      preferBasicAuthenticator: false,
      // If custom headers are provided, use them for all calls
      // instead of making just an initial call with them to get a ticket.
      preferRegularHeaderAuthenticator: false
    },
    require.moduleConfig('nuc/utils/interactiveauthenticator'),
    module.config()
  );

  return [
    {
      authenticator: BasicAuthenticator,
      sequence: 50,
      decides: function (connection) {
        return config.forceBasicAuthenticator || (connection.credentials && config.preferBasicAuthenticator);
      }
    },
    {
      authenticator: RegularHeaderAuthenticator,
      sequence: 50,
      and: {
        has: 'authenticationHeaders',
        decides: function () {
          return config.preferRegularHeaderAuthentication;
        }
      }
    },
    {
      authenticator: CredentialsAuthenticator,
      has: 'credentials'
    },
    {
      authenticator: InitialHeaderAuthenticator,
      has: 'authenticationHeaders'
    },
    {
      sequence: 1000,
      authenticator: TicketAuthenticator
    }
  ];
});
