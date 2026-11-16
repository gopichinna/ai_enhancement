/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/dialogs/launch.workflow/impl/launch.workflow.attachments/launch.workflow.attachments.view.mixin", "d2/widgets/task.details/impl/task.supporting.files/task.supporting.files.view", "i18n!d2/dialogs/launch.workflow/impl/nls/lang" ], function(_, LaunchWorkflowAttachmentsViewMixin, TaskDetailsSupportingFilesView, lang) {
  "use strict";
  var LaunchWorkflowSupportingFilesView = TaskDetailsSupportingFilesView.extend({
    constructor: function LaunchWorkflowSupportingFilesView() {
      this.addButtonTooltip = lang.addSupportingFilesTooltip;
      this.addRelatedButtonTooltip = lang.addRelatedFilesAsSupportingTooltip;
      this.ignoreSubTypeFilters = true;
      TaskDetailsSupportingFilesView.prototype.constructor.apply(this, arguments);
    }
  });
  LaunchWorkflowAttachmentsViewMixin.mixin(LaunchWorkflowSupportingFilesView.prototype);
  return LaunchWorkflowSupportingFilesView;
});