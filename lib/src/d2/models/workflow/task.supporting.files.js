/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/utils/url", "d2/models/workflow/task.files", "d2/models/workflow/task.file", "d2/utils/rest.linkrels" ], function(_, Url, TaskFileCollection, TaskFile, RestLinkrels) {
  "use strict";
  var TaskSupportingFileModel = TaskFile.extend({
    parse: function() {
      var node = TaskFile.prototype.parse.apply(this, arguments);
      if (this.collection && this.collection.node && this.collection.node.actions && this.collection.node.actions.findWhere({
        signature: "D2-WorkflowManageAttachment"
      })) {
        _.isArray(node.actions) && node.actions.push({
          signature: "D2-WorkflowRemoveAttachment"
        });
      }
      return node;
    }
  });
  var TaskSupportingFileCollection = TaskFileCollection.extend({
    model: TaskSupportingFileModel,
    _getAttachmentFetchLink: function() {
      return RestLinkrels.getLink(this.node.get("links"), RestLinkrels.D2_TASK_SUPPORTING_DOCUMENTS);
    }
  });
  return TaskSupportingFileCollection;
});