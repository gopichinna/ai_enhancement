/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/widgets/task.details/impl/task.supporting.files/task.supporting.files.view", "d2/widgets/task.documents/impl/documents.list/file.list.view.mixin" ], function(_, TaskDetailsSupportingFilesView, FileListViewMixin) {
  "use strict";
  var SupportingFilesListView = TaskDetailsSupportingFilesView.extend({
    ownClassName: "d2-task-supporting-files-listview",
    constructor: function SupportingFilesListView(options) {
      options = options || {};
      this.options = options;
      TaskDetailsSupportingFilesView.prototype.constructor.call(this, options);
      this.applyFileListMixin(options);
    },
    onRender: function() {
      this.options.additionalPanelsView.trigger("panel:view:initiated");
      TaskDetailsSupportingFilesView.prototype.onRender.apply(this, arguments);
    },
    _highlightNewAttachments: function(models) {
      this.resetCollectionOnDeactivate = true;
      var newCount = 0, priorityModels = [];
      _.each(models, function(model) {
        priorityModels.push(model.get("i_chronicle_id") || model.get("id"));
        model.set("highlight", true);
        newCount++;
      });
      this.collection.priorityModelIds = priorityModels.concat(_.isArray(this.collection.priorityModelIds) ? this.collection.priorityModelIds : []);
      if (!this.collection.keepOnlyPriorityModels) {
        this.collection.priorityModelsHighlighted = true;
      }
      newCount && (this.collection._lastFilterAndSortCriteria = {});
      this._onCollectionReset();
    },
    _removeAttachments: function() {
      TaskDetailsSupportingFilesView.prototype._removeAttachments.apply(this, arguments);
      this._onCollectionReset();
    },
    _onCollectionReset: function() {
      this.node.unset("wf_supporting_documents_count", {
        silent: true
      });
      this.node.set("wf_supporting_documents_count", this.collection.length);
    },
    _refreshTab: function() {
      this._updateHeaderTitle(this.node.get("wf_supporting_documents_count"));
    },
    _adjustSelectionAfterAttachmentsRemove: function() {},
    _handleResolutionChange: function() {}
  });
  FileListViewMixin.mixin(SupportingFilesListView.prototype);
  return SupportingFilesListView;
});