/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/models/commands" ], function(_, CommandCollection) {
  "use strict";
  var commands = new CommandCollection();
  _.extend(commands, {
    signatures: [ "Restore", "Purge" ]
  });
  return commands;
});