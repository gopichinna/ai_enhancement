/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/progressblocker/blocker", "csui/controls/toolbar/toolitems.factory", "csui/utils/commands", "d2/controls/workflow.state/workflow.state.view", "d2/widgets/task.details/impl/task.details.panel.view", "d2/widgets/workflowstable/workflow.toolbaritems", "d2/widgets/workflowstable/workflow.toolbaritems.masks", "d2/widgets/workflow.details/impl/workflow.metadata.view", "d2/widgets/workflow.details/impl/workflow.details.zero.state.view", "css!d2/widgets/workflow.details/impl/workflow.details.panel" ], function(_, BlockingView, ToolItemsFactory, commands, WorkflowStateView, TaskDetailsPanelView, workflowToolItems, WorkflowToolItemsMasks, WorkflowMetadataView, WorkflowZeroStateView) {
  "use strict";
  return TaskDetailsPanelView.extend({
    className: function() {
      return "d2-workflow-details-panel " + TaskDetailsPanelView.prototype.className;
    },
    constructor: function WorkflowDetailsPanelView(options) {
      options = options || {};
      TaskDetailsPanelView.prototype.constructor.call(this, options);
    },
    _setupDefaultOptions: function() {
      _.defaults(this.options, {
        commands: commands,
        toolbarItems: _.extend({}, workflowToolItems),
        toolbarItemsMasks: new WorkflowToolItemsMasks(this.options),
        originatingView: this,
        blockingParentView: this
      });
      _.extend(this.options.toolbarItems, {
        dropdownMenuListInProperties: new ToolItemsFactory({})
      });
    },
    _renderChildrenViews: function() {
      TaskDetailsPanelView.prototype._renderChildrenViews.apply(this, arguments);
      this.metadataView && this.metadataView.metadataTabView && this.metadataView.metadataTabView.tabLinks && this.metadataView.metadataTabView.tabLinks.$el.find("> .binf-btn").removeAttr("disabled");
      if (this.metadataView && this.metadataView.metadataHeaderView && this.metadataView.metadataHeaderView.metadataItemNameView) {
        if (!this.metadataHeaderWorkflowStateView) {
          this.metadataHeaderWorkflowStateView = new WorkflowStateView({
            model: this.model
          });
        }
        this._attachStateToNameView();
        this.metadataView.listenTo(this.metadataView.metadataHeaderView.metadataItemNameView, "render", _.bind(function() {
          this._attachStateToNameView();
        }, this));
        this.metadataView.on("dom:refresh", function() {
          this.metadataHeaderWorkflowStateView.triggerMethod("dom:refresh");
        }.bind(this));
      }
    },
    _attachStateToNameView: function() {
      this.metadataHeaderWorkflowStateView.render();
      this.metadataView.metadataHeaderView.metadataItemNameView.$el.find(".cs-metadata-item-name").append(this.metadataHeaderWorkflowStateView.el);
    },
    _createMetadataView: function(options) {
      return new WorkflowMetadataView(options);
    },
    onShowZeroStateView: function(model) {
      this.$el.addClass("zero-state");
      var zeroStateView = new WorkflowZeroStateView(_.defaults({
        model: model
      }, this.options));
      this.rgnZeroStateContainer.show(zeroStateView);
    },
    onBeforeDestroy: function() {
      this.metadataHeaderWorkflowStateView && this.metadataHeaderWorkflowStateView.destroy();
      TaskDetailsPanelView.prototype.onBeforeDestroy && TaskDetailsPanelView.prototype.onBeforeDestroy.apply(this, arguments);
    }
  });
});