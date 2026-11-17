/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/dialogs/launch.workflow/impl/launch.workflow.attachments/launch.workflow.attachments.view.mixin", "d2/widgets/task.details/impl/task.working.files/task.working.files.view", "i18n!d2/dialogs/launch.workflow/impl/nls/lang" ], function(_, LaunchWorkflowAttachmentsViewMixin, TaskDetailsWorkingFilesView, lang) {
  "use strict";
  var LaunchWorkflowWorkingFilesView = TaskDetailsWorkingFilesView.extend({
    constructor: function LaunchWorkflowWorkingFilesView() {
      this.addButtonTooltip = lang.addWorkingFilesTooltip;
      this.addRelatedButtonTooltip = lang.addRelatedFilesAsWorkingTooltip;
      this.showAtLeastOneDocument = true;
      TaskDetailsWorkingFilesView.prototype.constructor.apply(this, arguments);
    }
  });
  LaunchWorkflowAttachmentsViewMixin.mixin(LaunchWorkflowWorkingFilesView.prototype);
  return LaunchWorkflowWorkingFilesView;
});