/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "d2/utils/task.utils", "i18n!d2/controls/workflow.state/impl/nls/lang", "hbs!d2/controls/workflow.state/impl/workflow.state", "css!d2/controls/workflow.state/impl/workflow.state" ], function(_, Marionette, TabableRegionBehavior, taskUtils, lang, template) {
  "use strict";
  var WorkflowStateView = Marionette.ItemView.extend({
    attributes: {
      tabindex: 0
    },
    className: "d2-workflow-state-view",
    template: template,
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },
    templateHelpers: function() {
      var workflowState = taskUtils.getStatusObject(this.model.get(this.statePropertyName));
      return {
        workflow_state_name: workflowState.statusName,
        workflow_state_icon: workflowState.statusStyle,
        stateAriaLabel: _.str.sformat(lang.workflowStateAriaLabel, workflowState.statusName)
      };
    },
    constructor: function WorkflowStateView(options) {
      options = options || {};
      this.model = options.model;
      this.statePropertyName = options.statePropertyName || "d2_workflow_state";
      Marionette.ItemView.prototype.constructor.call(this);
    },
    currentlyFocusedElement: function() {
      return this.$el;
    }
  });
  return WorkflowStateView;
});