/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/progressblocker/blocker", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/toolbar/toolitems.factory", "nuc/models/nodes", "csui/utils/commandhelper", "csui/utils/commands", "d2/utils/task.utils", "d2/controls/button.toolbar/button.toolbar.view", "d2/widgets/taskstable/task.toolbaritems", "d2/widgets/taskstable/task.toolbaritems.masks", "d2/widgets/task.details/impl/task.metadata.view", "d2/widgets/task.details/impl/task.details.zero.state.view", "d2/utils/rest.linkrels", "i18n!d2/widgets/task.details/impl/nls/lang", "hbs!d2/widgets/task.details/impl/task.details.panel", "css!d2/widgets/task.details/impl/task.details.panel" ], function(_, $, Backbone, Marionette, BlockingView, LayoutViewEventsPropagationMixin, ToolItemsFactory, NodeCollection, CommandHelper, commands, TaskUtils, ButtonToolbarView, taskToolItems, TaskToolItemsMasks, TaskMetadataView, TaskZeroStateView, RestLinkrels, lang, template) {
  "use strict";
  var metaNodeToViewModelProxyEvents = [ "d2:task:aborted", "d2:task:paused", "d2:task:acquired", "d2:task:completed", "d2:task:delegated", "d2:workflow:supervisor:changed", "d2:workflow:aborted", "d2:workflow:update:performers" ];
  var TaskDetailsPanelView = Marionette.LayoutView.extend({
    className: "d2-task-details-panel",
    template: template,
    regions: {
      rgnMetadata: ".d2-task-metadata-container",
      rgnZeroStateContainer: ".d2-task-zero-state-container"
    },
    constructor: function TaskDetailsPanelView(options) {
      options = options || {};
      this.context = options.context;
      this.connector = options.connector || this.context && this.context.getObject("connector");
      this.renderingForTheFirstTime = true;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.context && this.listenToOnce(this.context, "sync", this._onContextNodeSync);
      this.listenTo(this.model, "sync", this._onContextNodeSync);
      this._setupDefaultOptions();
    },
    onResolutionChange: function(resolutionData) {
      this.lastAppliedResolution = resolutionData;
      if (this.lastAppliedResolution && this.metadataView) {
        this.metadataView.triggerMethod("resolution:change", resolutionData);
      }
      return false;
    },
    _onContextNodeSync: function() {
      if (this.model.get("task_state") === "unavailable") {
        this.renderingForTheFirstTime = false;
        return;
      }
      var node = this.model.clone();
      if (!node.get("userData")) {
        TaskUtils.resolveUserDetails(node, [ "sent_by", "supervisor_name" ]).done(function() {
          this._setNodeChangeEvents(node);
        }.bind(this));
      } else {
        this._setNodeChangeEvents(node);
      }
      TaskUtils.loadWorkflowProcessVariableConfig(node);
    },
    _setNodeChangeEvents: function(node) {
      this._createAndRenderMetadataView(node);
      node.on("change", function() {
        this.model.set(node.attributes, {
          silent: true
        });
        var nodeAttributesToIgnore = [ "wf_supporting_documents_count", "wf_notes_count", "wf_working_documents_count", "delegated_to", "task_state", "_new_task_id", "id" ], modifiedAttributes = _.keys(this.model.changedAttributes());
        if (_.isEmpty(_.intersection(modifiedAttributes, nodeAttributesToIgnore)) && _.some(modifiedAttributes, function(attr) {
          return node.hasChanged(attr);
        })) {
          this.model.trigger("sync");
        }
      }.bind(this));
      _.each(metaNodeToViewModelProxyEvents, function(eventName) {
        node.on(eventName, function() {
          this.model.trigger.apply(this.model, arguments);
        }.bind(this, eventName));
      }.bind(this));
    },
    _setupDefaultOptions: function() {
      _.defaults(this.options, {
        commands: commands,
        toolbarItems: _.extend({}, taskToolItems),
        toolbarItemsMasks: new TaskToolItemsMasks(this.options),
        originatingView: this,
        blockingParentView: this
      });
      _.extend(this.options.toolbarItems, {
        dropdownMenuListInProperties: new ToolItemsFactory({})
      });
    },
    onRender: function() {
      if (!this.context) {
        this._renderChildrenViews();
      }
    },
    onMetadataClose: function() {
      this.trigger("goto:task:list");
    },
    _renderChildrenViews: function() {
      this.metadataView && this.rgnMetadata.show(this.metadataView);
      if (!this.renderingForTheFirstTime) {
        this.hideZeroStateView();
      } else {
        this.renderingForTheFirstTime = false;
      }
    },
    _createAndRenderMetadataView: function(node) {
      if (this.metadataView) {
        this.metadataView.destroy();
      }
      this.metadataView = this._createMetadataView(_.defaults({
        model: node,
        originatingView: this,
        container: this.container,
        toolbarItems: _.extend({}, this.options.toolbarItems, {
          leftToolbar: this.options.toolbarItems.detailViewActionBar,
          otherToolbar: this.options.toolbarItems.detailViewHeaderDropdown
        }),
        toolbarItemsMasks: {
          toolbars: _.extend(this.options.toolbarItemsMasks.toolbars, {
            leftToolbar: this.options.toolbarItemsMasks.toolbars.detailViewActionBar,
            otherToolbar: this.options.toolbarItemsMasks.toolbars.detailViewHeaderDropdown
          })
        }
      }, this.options));
      if (this.options.manageAttachments) {
        this.options.manageAttachments = false;
      }
      BlockingView.delegate(this.metadataView, this);
      this._renderChildrenViews();
      if (this.lastAppliedResolution) {
        this.onResolutionChange(this.lastAppliedResolution);
      }
    },
    _createMetadataView: function(options) {
      return new TaskMetadataView(options);
    },
    onShowZeroStateView: function(model) {
      this.$el.addClass("zero-state");
      var zeroStateView = new TaskZeroStateView(_.defaults({
        model: model
      }, this.options));
      zeroStateView.on("goto:task:list", this._onZeroStateGoToTasklist.bind(this));
      this.rgnZeroStateContainer.show(zeroStateView);
    },
    hideZeroStateView: function() {
      this.rgnZeroStateContainer.empty();
      this.$el.removeClass("zero-state");
    },
    _onZeroStateGoToTasklist: function(e) {
      this.trigger("goto:task:list", e);
    }
  });
  _.extend(TaskDetailsPanelView.prototype, LayoutViewEventsPropagationMixin);
  return TaskDetailsPanelView;
});