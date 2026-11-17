/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "csui/models/command", "i18n!d2/commands/nls/localized.strings" ], function($, CommandModel, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-DctmLifeCycleStateAction",
      command_key: "D2-DctmLifeCycleStateAction",
      name: lang.CommandDctmLifecycleStateActions,
      scope: "multiple"
    },
    enabled: function() {
      return false;
    },
    execute: function() {
      return $.Deferred().resolve(true).promise();
    }
  });
});