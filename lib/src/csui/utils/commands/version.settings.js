/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/command" ], function(CommandModel) {
  "use strict";
  var VersionSettingsCommand = CommandModel.extend({
    defaults: {
      signature: "VersionsControl",
      command_key: [ "versionscontrol" ],
      scope: "single",
      name: "VersionsSettings"
    }
  });
  return VersionSettingsCommand;
});