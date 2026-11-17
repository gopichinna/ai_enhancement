/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/commands/workflow/read.task", "i18n!d2/commands/nls/localized.strings" ], function(CommandReadTask, lang) {
  "use strict";
  return CommandReadTask.extend({
    defaults: {
      signature: "D2-UnreadTask",
      command_key: "D2-UnreadTask",
      name: lang.CommandNameUnreadTask,
      scope: "single"
    },
    doAction: function(task, options) {
      options.read = false;
      return CommandReadTask.prototype.doAction.call(this, task, options);
    },
    getMessageOptions: function() {
      return {
        oneFileFailure: lang.UnreadOneTaskFailMessage
      };
    }
  });
});