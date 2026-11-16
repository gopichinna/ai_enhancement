/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/widgets/metadata/panels/metadata.workflow.zero.state.base.view", "i18n!d2/widgets/workflow.timeline/impl/nls/lang", "css!d2/widgets/workflow.timeline/impl/wf.retriable.error" ], function(_, MetaWorkflowZeroStateBaseView, lang) {
  "use strict";
  var WorkflowRetriableErrorView = MetaWorkflowZeroStateBaseView.extend({
    className: MetaWorkflowZeroStateBaseView.prototype.className + " d2-workflow-retriable-error",
    constructor: function WorkflowRetriableErrorView(options) {
      options = options || {};
      _.defaults(options, {
        zeroStateMessage: lang.messageRetriableFailure,
        actionsButtonLabel: lang.labelRetryActionButton,
        actionCommandSignature: "D2-RefreshList",
        actionCommandOptions: {
          context: options.context
        }
      });
      MetaWorkflowZeroStateBaseView.prototype.constructor.call(this, options);
    }
  });
  return WorkflowRetriableErrorView;
});