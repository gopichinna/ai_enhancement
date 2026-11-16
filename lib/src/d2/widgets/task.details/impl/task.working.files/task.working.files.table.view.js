/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/widgets/task.details/impl/task.files.list/task.files.list.table/task.attachments.table.view", "d2/widgets/taskstable/task.toolbaritems", "d2/widgets/taskstable/task.toolbaritems.masks", "d2/models/workflow/task.working.files", "i18n!d2/widgets/task.details/impl/nls/lang" ], function(_, $, TaskAttachmentsTableView, toolbarItems, toolbarItemsMasks, TaskWorkingFilesCollection, lang) {
  "use strict";
  var TaskWorkingFilesTableView = TaskAttachmentsTableView.extend({
    constructor: function TaskWorkingFilesTableView(options) {
      options = options || {};
      options.collectionClass = TaskWorkingFilesCollection;
      options.toolbarItems = options.toolbarItems || {
        rightToolbar: toolbarItems.attachmentsFileTableRightbar,
        inlineActionbar: toolbarItems.workingFileTableInlineActionbar,
        tableHeaderToolbar: toolbarItems.workingFileTableHeaderToolbar
      };
      var toolbarMasks = new toolbarItemsMasks();
      options.toolbarItemsMasks = options.toolbarItemsMasks || {
        toolbars: {
          rightToolbar: toolbarMasks.toolbars.attachmentsFileTableRightbar,
          inlineActionbar: toolbarMasks.toolbars.workingFileTableInlineActionbar,
          tableHeaderToolbar: toolbarMasks.toolbars.workingFileTableHeaderToolbar
        }
      };
      TaskAttachmentsTableView.prototype.constructor.apply(this, arguments);
    },
    getExtraIconConfig: function() {
      return {
        iconType: "taskWorkingFiles"
      };
    },
    getTitle: function() {
      return lang.defaultTitleAdditionalPanelWorkingFiles;
    }
  });
  return TaskWorkingFilesTableView;
});