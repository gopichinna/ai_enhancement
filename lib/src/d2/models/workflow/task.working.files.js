/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/utils/url", "d2/models/workflow/task.files", "d2/utils/rest.linkrels" ], function(Url, TaskFileCollection, RestLinkrels) {
  "use strict";
  var TaskWorkingFileCollection = TaskFileCollection.extend({
    _getAttachmentFetchLink: function() {
      return RestLinkrels.getLink(this.node.get("links"), RestLinkrels.D2_TASK_WORKING_DOCUMENTS);
    }
  });
  return TaskWorkingFileCollection;
});