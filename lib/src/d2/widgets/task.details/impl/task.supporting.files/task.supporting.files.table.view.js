/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/widgets/task.details/impl/task.files.list/task.files.list.table/task.attachments.table.view", "d2/widgets/taskstable/task.toolbaritems", "d2/widgets/taskstable/task.toolbaritems.masks", "d2/models/workflow/task.supporting.files", "i18n!d2/widgets/task.details/impl/nls/lang" ], function(_, TaskAttachmentsTableView, toolbarItems, toolbarItemsMasks, TaskSupportingFilesCollection, lang) {
  "use strict";
  var TaskSupportingFilesTableView = TaskAttachmentsTableView.extend({
    constructor: function TaskSupportingFilesTableView(options) {
      options = options || {};
      options.collectionClass = TaskSupportingFilesCollection;
      options.toolbarItems = options.toolbarItems || {
        rightToolbar: toolbarItems.attachmentsFileTableRightbar,
        inlineActionbar: toolbarItems.supportingFileTableInlineActionbar,
        tableHeaderToolbar: toolbarItems.supportingFileTableHeaderToolbar
      };
      var toolbarMasks = new toolbarItemsMasks();
      options.toolbarItemsMasks = options.toolbarItemsMasks || {
        toolbars: {
          rightToolbar: toolbarMasks.toolbars.attachmentsFileTableRightbar,
          inlineActionbar: toolbarMasks.toolbars.supportingFileTableInlineActionbar,
          tableHeaderToolbar: toolbarMasks.toolbars.supportingFileTableHeaderToolbar
        }
      };
      TaskAttachmentsTableView.prototype.constructor.apply(this, arguments);
    },
    getTitle: function() {
      return lang.defaultTitleAdditionalPanelSupportingFiles;
    }
  });
  return TaskSupportingFilesTableView;
});