/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/models/commands", "csui-ext!d2/utils/commands/vdoc.default.actions" ], function(_, CommandCollection, extraCommands) {
  "use strict";
  var commands = new CommandCollection([]);
  if (extraCommands) {
    commands.add(_.chain(extraCommands).flatten(true).map(function(Command) {
      return new Command();
    }).value());
  }
  return commands;
});