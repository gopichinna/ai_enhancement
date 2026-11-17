/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "d2/dialogs/launch.workflow/impl/launch.workflow.attachments/launch.workflow.working.files.view", "d2/dialogs/launch.workflow/impl/launch.workflow.attachments/launch.workflow.supporting.files.view", "d2/widgets/task.details/impl/task.additional.panels.view" ], function(_, Backbone, LaunchWorkflowWorkingFilesView, LaunchWorkflowSupportingFilesListView, TaskAdditionalPanelsView) {
  "use strict";
  var TAB_NAMES = Object.freeze({
    WORKING_FILES: "working",
    SUPPORTING_FILES: "supporting"
  }), TAB_NAME_TO_TAB_ATTRIBUTE_MAP = {};
  TAB_NAME_TO_TAB_ATTRIBUTE_MAP[TAB_NAMES.WORKING_FILES] = {
    contentView: LaunchWorkflowWorkingFilesView
  };
  TAB_NAME_TO_TAB_ATTRIBUTE_MAP[TAB_NAMES.SUPPORTING_FILES] = {
    contentView: LaunchWorkflowSupportingFilesListView
  };
  return TaskAdditionalPanelsView.extend({
    className: function() {
      let parentClassName = TaskAdditionalPanelsView.prototype.className || "";
      if (_.isFunction(parentClassName)) {
        parentClassName = parentClassName.apply(this, arguments);
      }
      return "d2-launch-workflow-attachments-panel " + parentClassName;
    },
    contentViewOptions: function(tabLink) {
      var options = TaskAdditionalPanelsView.prototype.contentViewOptions.apply(this, arguments), tabName = tabLink.get("name");
      if (tabName === "working") {
        options.collection = this.options.workingFileCollection;
      } else if (tabName === "supporting") {
        options.collection = this.options.supportingFileCollection;
      }
      return options;
    },
    constructor: function LaunchWorkflowAttachmentsPanelView(options) {
      options.toolbarItems = {};
      options.toolbarItemsMasks = {
        toolbars: {}
      };
      delete this.behaviors.TabableRegionBehavior;
      TaskAdditionalPanelsView.prototype.constructor.apply(this, arguments);
    },
    _buildTabs: function() {
      var superTabs = TaskAdditionalPanelsView.prototype._buildTabs.apply(this, arguments);
      return _.chain(superTabs).filter(function(tab) {
        return _.contains(_.keys(TAB_NAME_TO_TAB_ATTRIBUTE_MAP), tab.name);
      }).map(function(tab) {
        return _.extend({}, tab, TAB_NAME_TO_TAB_ATTRIBUTE_MAP[tab.name]);
      }).value();
    }
  });
});