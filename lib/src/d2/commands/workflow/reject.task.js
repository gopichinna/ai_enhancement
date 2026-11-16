/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/commands/workflow/forward.task", "i18n!d2/commands/nls/localized.strings" ], function(ForwardTaskCommand, lang) {
  "use strict";
  return ForwardTaskCommand.extend({
    defaults: {
      signature: "D2-RejectTask",
      command_key: "D2-RejectTask",
      name: lang.CommandNameRejectTask,
      scope: "single"
    },
    PROPERTIES: Object.freeze({
      ACTION: "REJECT",
      DEFAULT_ACTION_LABEL: lang.DefaultRejectLabel,
      ACTION_LABEL: "task_reject_label",
      NEXT_TASKS: "next_reject_activities",
      SIGNOFF_REQUIRED: "signoff_required_for_reject",
      SIGNOFF_EACH_DOCUMENT: "signoff_each_document",
      INTENTION_REQUIRED: "is_intention_required_for_reject",
      INTENTION_DICTIONARY: "D2_TASK_INTENTION_DICTIONARY_REJECT",
      MANDATORY_COMMENT: "mandatory_reject_comment",
      PROPERTY_PAGE: "D2_TASK_PROPERTY_PAGE_REJECT",
      DISPLAY_DIALOG: "always_display_dialog",
      MAX_NEXT_TASKS: "maximum_allowed_transitions",
      SOURCE: "TASK",
      INTENTION_DICTIONARY_NAME: "intention_dictionary_reject"
    }),
    getMessageOptions: function() {
      return {
        oneFilePending: lang.CompletingOneTask,
        oneFileSuccess: lang.CompleteOneTaskSuccessMessage,
        oneFileFailure: lang.CompleteOneTaskFailMessage,
        actionType: "REJECT_TASK"
      };
    }
  });
});