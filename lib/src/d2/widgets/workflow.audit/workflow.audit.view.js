/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "d2/controls/mixins/view.state/workflow.view.state.mixin", "hbs!d2/widgets/workflow.audit/impl/workflow.audit", "css!d2/widgets/workflow.audit/impl/workflow.audit" ], function(Marionette, WorkflowViewStateMixin, template) {
  "use strict";
  var WorkflowAuditView = Marionette.ItemView.extend({
    className: "d2-workflow-audit-widget",
    template: template,
    templateHelpers: function() {
      return {
        ImplementationPending: "Under construction..."
      };
    },
    constructor: function WorkflowAuditView(options) {
      this.context = options.context;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.addInitialURLParamSupport();
    },
    addInitialURLParamSupport: function() {
      this.addUrlParametersSupport(WorkflowViewStateMixin.PROPERTY_CONSTANTS.AUDIT_PERSPECTIVE_INIT_URL_PARAMS);
    }
  });
  WorkflowViewStateMixin.mixin(WorkflowAuditView.prototype);
  return WorkflowAuditView;
});