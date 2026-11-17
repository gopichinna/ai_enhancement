/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "dctmw/utils/authenticators/basic.ct.authenticator", "dctmw/utils/authenticators/ct.otds.token.authenticator", "dctmw/utils/authenticators/ct.otds.ticket.authenticator", "dctmw/utils/authenticators/embed.ct.otds.token.authenticator" ], function(module, _, BasicCtAuthenticator, CtOtdsTokenAuthenticator, CtOtdsTicketAuthenticator, EmbedCtOtdsTokenAuthenticator) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    embedMode: false
  });
  return [ {
    authenticator: BasicCtAuthenticator,
    sequence: 499,
    decides: function(connection) {
      return !connection.authMode || connection.authMode === "basic-ct";
    }
  }, {
    authenticator: CtOtdsTokenAuthenticator,
    sequence: 499,
    decides: function(connection) {
      return connection.authMode === "ct-otds_token" && config.embedMode === false;
    }
  }, {
    authenticator: CtOtdsTicketAuthenticator,
    sequence: 499,
    decides: function(connection) {
      return connection.authMode === "ct-otds_ticket-otds_token";
    }
  }, {
    authenticator: EmbedCtOtdsTokenAuthenticator,
    sequence: 499,
    decides: function(connection) {
      return connection.authMode === "ct-otds_token" && config.embedMode === true;
    }
  } ];
});