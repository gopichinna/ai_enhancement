/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/models/command", "i18n!d2/commands/nls/localized.strings", "d2/commands/workflow/open.task" ], function(_, CommandModel, lang, CommandOpenTask) {
  "use strict";
  return CommandOpenTask.extend({
    defaults: {
      signature: "D2-OpenTaskFiles",
      command_key: "D2-OpenTaskFiles",
      name: lang.CommandNameOpenTaskFiles,
      scope: "single"
    },
    enabled: function(status, options) {
      var isEnabled = CommandOpenTask.prototype.enabled.call(this, status, options);
      return isEnabled && CommandModel.prototype.enabled.call(this, status, options);
    },
    getTask: function(status) {
      return status && status.task;
    },
    getAdditionalContextParameters: function(task, status) {
      return {
        showDocumentsView: true,
        selectedNodeId: status.selectedNodeId,
        selectedFileTab: status.selectedFileTab,
        selectedMetaTab: status.selectedMetaTab
      };
    }
  });
});