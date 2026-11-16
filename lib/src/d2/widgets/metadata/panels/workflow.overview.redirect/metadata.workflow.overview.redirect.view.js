/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/widgets/metadata/panels/metadata.workflow.zero.state.base.view", "i18n!d2/widgets/metadata/panels/workflow.overview.redirect/impl/nls/lang", "css!d2/widgets/metadata/panels/workflow.overview.redirect/impl/metadata.workflow.overview.redirect" ], function(_, MetaWorkflowZeroStateBaseView, lang) {
  "use strict";
  var MetadataWorkflowOverviewRedirectView = MetaWorkflowZeroStateBaseView.extend({
    className: MetaWorkflowZeroStateBaseView.prototype.className + " d2-metadata-workflow-overview-redirect",
    constructor: function MetadataWorkflowOverviewRedirectView(options) {
      options = options || {};
      _.defaults(options, {
        zeroStateMessage: lang.GoToOverviewMessage,
        actionsButtonLabel: lang.GoToOverviewLabel,
        actionCommandSignature: "D2-OpenWorkflow",
        actionCommandOptions: {
          context: options.context
        }
      });
      MetaWorkflowZeroStateBaseView.prototype.constructor.call(this, options);
    }
  }, {
    enabled: function(options) {
      return options.node.get("rObjectType") === "d2c_workflow_tracker" || options.node.get("r_object_type") === "d2c_workflow_tracker";
    }
  });
  return MetadataWorkflowOverviewRedirectView;
});