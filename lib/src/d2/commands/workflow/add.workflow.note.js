/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/commands/workflow/add.task.note", "csui/utils/commandhelper", "d2/utils/rest.linkrels" ], function(AddTaskNoteCommand, CommandHelper, RestLinkrels) {
  "use strict";
  return AddTaskNoteCommand.extend({
    defaults: {
      signature: "D2-AddWorkflowNote",
      command_key: "D2-AddWorkflowNote",
      name: "",
      scope: "single"
    },
    _getUrl: function(node) {
      return CommandHelper.getOriginalActionLink(node, this.get("signature"), RestLinkrels.D2_NOTES);
    }
  });
});