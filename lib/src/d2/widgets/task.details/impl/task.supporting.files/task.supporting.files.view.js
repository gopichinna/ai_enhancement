/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/commands", "d2/models/workflow/task.supporting.files", "d2/utils/constants", "d2/widgets/taskstable/task.toolbaritems", "d2/widgets/taskstable/task.toolbaritems.masks", "d2/widgets/task.details/impl/task.files.list/task.attachments.view", "d2/widgets/task.details/impl/task.supporting.files/task.supporting.files.table.view", "i18n!d2/widgets/task.details/impl/nls/lang" ], function(_, $, commands, TaskSupportingFileCollection, constants, toolbarItems, toolbarItemsMasks, TaskAttachmentsView, SupportingFilesTableView, lang) {
  "use strict";
  var TaskSupportingFilesView = TaskAttachmentsView.extend({
    setToolbarAndCollection: function(options) {
      this.toolbarItems = options.toolbarItems || {
        inlineActionbar: toolbarItems["supportingFileListInlineActionbar"]
      };
      this.toolbarItemsMasks = options.toolbarItemsMasks || {
        toolbars: {
          inlineActionbar: new toolbarItemsMasks().toolbars.supportingFileListInlineActionbar
        }
      };
      this.collection = options.collection || new TaskSupportingFileCollection(undefined, {
        node: this.node,
        autoreset: true,
        fetchRelationsCount: true,
        delayRestCommands: true,
        promoteSomeRestCommands: true,
        commands: commands.getSignatures(this.toolbarItems),
        toolbarItems: this.toolbarItems.inlineActionbar
      });
      this.collection.setLimit(0, 15, false);
      this.listenTo(this.node, "change:wf_supporting_documents_count", _.bind(this._refreshTab, this));
    },
    updateCountAttribute: function(count) {
      this.node.set("wf_supporting_documents_count", count);
    },
    getAttachmentsCount: function() {
      return this.node.get("wf_supporting_documents_count");
    },
    _updateHeaderTitle: function(length) {
      if (this.additionalPanelsView) {
        if (length) {
          this.additionalPanelsView.trigger("update:tab:header", this.model, _.str.sformat(lang.titleAdditionalPanelSupportingFiles, length));
        } else {
          this.additionalPanelsView.trigger("update:tab:header", this.model, lang.defaultTitleAdditionalPanelSupportingFiles);
        }
      }
    },
    getExpandedView: function() {
      return SupportingFilesTableView;
    }
  }, {
    enabled: function(options) {
      options = options || {};
      return options.node && (options.node.get("type") === constants.Types.TASK || options.node.get("type") === constants.Types.WORKFLOW) && !options.node.get("wf_sv_disable_supporting_files");
    }
  });
  return TaskSupportingFilesView;
});