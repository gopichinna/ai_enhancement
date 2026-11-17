/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/models/workflow/workflow", "d2/utils/constants", "d2/widgets/workflow.timeline/workflow.timeline.view", "css!d2/widgets/metadata/panels/workflow.timeline/impl/metadata.workflow.timeline" ], function(WorkflowModel, constants, WFTimelineView) {
  "use strict";
  var MetadataWorkflowTimelineView = WFTimelineView.extend({
    className: WFTimelineView.prototype.className + " metadata-workflow-timeline",
    constructor: function MetadataWorkflowTimelineView() {
      MetadataWorkflowTimelineView.__super__.constructor.apply(this, arguments);
    }
  }, {
    enabled: function(options) {
      options = options || {};
      return options.node instanceof WorkflowModel && options.node.get("d2_workflow_state") !== constants.WorkflowState.SCHEDULED;
    }
  });
  return MetadataWorkflowTimelineView;
});