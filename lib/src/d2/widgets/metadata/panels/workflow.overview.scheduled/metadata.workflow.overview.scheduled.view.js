/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/models/workflow/workflow", "d2/utils/constants", "d2/widgets/metadata/panels/metadata.workflow.zero.state.base.view", "i18n!d2/widgets/metadata/panels/workflow.overview.scheduled/impl/nls/lang", "css!d2/widgets/metadata/panels/workflow.overview.scheduled/impl/metadata.workflow.overview.scheduled" ], function(_, WorkflowModel, constants, MetaWorkflowZeroStateBaseView, lang) {
  "use strict";
  var MetadataWorkflowOverviewScheduledView = MetaWorkflowZeroStateBaseView.extend({
    className: MetaWorkflowZeroStateBaseView.prototype.className + " d2-metadata-workflow-overview-scheduled",
    constructor: function MetadataWorkflowOverviewScheduledView(options) {
      options = options || {};
      _.defaults(options, {
        zeroStateMessage: lang.zeroStateMessage,
        actionsButtonLabel: lang.zeroStateActionButtonLabel,
        actionCommandSignature: "D2-WorkflowStart",
        actionCommandOptions: {
          context: options.context
        }
      });
      MetaWorkflowZeroStateBaseView.prototype.constructor.call(this, options);
    }
  }, {
    enabled: function(options) {
      options = options || {};
      return options.node instanceof WorkflowModel && options.node.get("d2_workflow_state") === constants.WorkflowState.SCHEDULED;
    }
  });
  return MetadataWorkflowOverviewScheduledView;
});