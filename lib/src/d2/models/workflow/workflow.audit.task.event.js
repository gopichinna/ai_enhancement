/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/models/workflow/task", "d2/utils/constants", "i18n!d2/widgets/workflow.timeline/impl/nls/lang" ], function(_, TaskModel, constants, timelineLang) {
  "use strict";
  var WorkflowAuditTaskEvent = TaskModel.extend({
    defaults: {
      type: constants.Types.TASK_EVENT
    },
    constructor: function WorkflowAuditTaskEvent(attr, options) {
      this.inheritNodeProperties = options.inheritNodeProperties;
      this.parentTreeNode = options.parentTreeNode;
      TaskModel.prototype.constructor.call(this, attr, options);
    },
    parse: function(response) {
      var properties = response.properties;
      properties["assignee"] = properties["user_name"] || timelineLang.performerSystem;
      properties["task_state"] = constants.WorkflowTaskState.EVENT_COMPLETED;
      if (this.inheritNodeProperties === false) {
        properties["name"] = properties["event_name"] || properties["event_id"];
      }
      return properties;
    }
  });
  return WorkflowAuditTaskEvent;
});