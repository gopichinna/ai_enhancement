/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/widgets/task.details/impl/task.working.files/task.working.files.view", "d2/widgets/task.documents/impl/documents.list/file.list.view.mixin" ], function(_, TaskDetailsWorkingFilesView, FileListViewMixin) {
  "use strict";
  var WorkingFilesListView = TaskDetailsWorkingFilesView.extend({
    ownClassName: "d2-task-working-files-listview",
    constructor: function WorkingFilesListView(options) {
      options = options || {};
      TaskDetailsWorkingFilesView.prototype.constructor.call(this, options);
      this.applyFileListMixin(options);
    },
    _onCollectionReset: function() {
      this.node.unset("wf_working_documents_count", {
        silent: true
      });
      this.node.set("wf_working_documents_count", this.collection.length);
    },
    _refreshTab: function() {
      this._updateHeaderTitle(this.node.get("wf_working_documents_count"));
    },
    _highlightNewAttachments: function() {},
    _handleResolutionChange: function() {}
  });
  FileListViewMixin.mixin(WorkingFilesListView.prototype);
  return WorkingFilesListView;
});