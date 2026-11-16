/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/utils/base", "csui/controls/progressblocker/blocker", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/utils/commands", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/models/workflow/workflow", "d2/models/workflow/workflow.audits", "d2/utils/constants", "d2/widgets/workflowstable/workflow.toolbaritems", "d2/widgets/workflow.timeline/impl/wf.retriable.error.view", "d2/widgets/workflow.timeline/impl/wf.timeline.filter.view", "d2/widgets/workflow.timeline/impl/wf.timeline.item.task.view", "d2/widgets/workflow.timeline/impl/wf.timeline.item.wfevent.view", "d2/widgets/workflow.timeline/impl/wf.timeline.loading.view", "hbs!d2/widgets/workflow.timeline/impl/workflow.timeline", "css!d2/widgets/workflow.timeline/impl/workflow.timeline" ], function(_, $, Marionette, base, BlockingView, PerfectScrollingBehavior, commands, WTabableRegionBehavior, WorkflowModel, WorkflowAuditCollection, constants, workflowToolitems, WFRetriableErrorView, WFTimelineFilterView, WFTimelineItemTaskView, WFTimlineItemWFEventView, WFTimelineLoadingView, template) {
  "use strict";
  var WorkflowTimelineView = Marionette.CompositeView.extend({
    className: "d2-workflow-timeline",
    template: template,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".timeline-graph",
        suppressScrollX: true
      },
      TabableRegionBehavior: {
        behaviorClass: WTabableRegionBehavior
      }
    },
    ui: {
      timelineFilter: ".timeline-filter",
      timelineGraph: ".timeline-graph",
      timelineErrorContainer: ".timeline-error-container"
    },
    childViewContainer: ".timeline-nodes",
    childEvents: {
      "set:selection": "onChildSetSelection",
      "clear:selection": "onChildClearSelection"
    },
    emptyView: WFTimelineLoadingView,
    collectionEvents: {
      "reset update": "onCollectionUpdate"
    },
    constructor: function WorkflowTimelineView(options) {
      options = options || {};
      var collection = options.collection;
      if (!collection) {
        var model = options.model || options.node;
        if (model instanceof WorkflowModel) {
          options.collection = new WorkflowAuditCollection(undefined, {
            node: model,
            delayRestCommands: true,
            promoteSomeRestCommands: false,
            commands: commands.getSignatures({
              timelineInlineActionBar: workflowToolitems.timelineInlineActionBar
            }),
            toolbarItems: workflowToolitems.timelineInlineActionBar
          });
          options.model = model;
        } else {
          throw new Error("At least a workflow model is required.");
        }
      } else if (!(collection instanceof WorkflowAuditCollection)) {
        throw new Error("collection should be of type WorkflowAuditCollection");
      }
      WorkflowTimelineView.__super__.constructor.call(this, options);
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.listenTo(this.collection, "request", this.onCollectionRequestStart).listenTo(this.collection, "sync", this.onCollectionRequestComplete).listenTo(this.collection, "error", this.onCollectionRequestError);
    },
    templateHelpers: function() {
      return {
        wfState: this.collection.node && this.collection.node.get("d2_workflow_state") || "unknown"
      };
    },
    getChildView: function(model) {
      if (model.get("type") === constants.Types.WORKFLOW_EVENT) {
        return WFTimlineItemWFEventView;
      }
      return WFTimelineItemTaskView;
    },
    childViewOptions: function() {
      return {
        context: this.options.context,
        workflowModel: this.collection.node,
        timelineView: this,
        blockingParentView: this
      };
    },
    onRender: function() {
      if (base.isIE11()) {
        this.$el.addClass("fix-msie");
      }
      if (!this.timelineFilterView) {
        this.timelineFilterView = new WFTimelineFilterView({
          targetCollection: this.collection
        });
        this.listenTo(this.timelineFilterView, "selection:changed", this.onFilterSelectionChanged);
        new Marionette.Region({
          el: this.ui.timelineFilter
        }).show(this.timelineFilterView);
      }
      if (!this.collection.fetched) {
        this.collection.fetch().always(function() {
          this.collection.fetched = true;
        }.bind(this));
      }
    },
    onCollectionRequestStart: function() {
      this.$el.removeClass("loading-error");
      this.ui.timelineGraph.addClass("loading");
    },
    onCollectionRequestComplete: function() {
      this.ui.timelineGraph.removeClass("loading");
    },
    onCollectionRequestError: function() {
      this.$el.addClass("loading-error");
      this.createAndRenderErrorStateView();
      this.onCollectionRequestComplete();
    },
    createAndRenderErrorStateView: function() {
      if (!this.errorStateView) {
        this.errorStateView = new WFRetriableErrorView({
          actionCommandOptions: {
            context: this.options.context,
            collection: this.collection,
            suppressFailMessage: true
          }
        });
        new Marionette.Region({
          el: this.ui.timelineErrorContainer
        }).show(this.errorStateView);
      }
    },
    onCollectionUpdate: function() {
      this.updateChildBorders();
    },
    onRenderCollection: function() {
      if (this.oldSelectedView) {
        var selectedModelInCollection = this.collection.findWhere({
          id: this.oldSelectedView.model.get("id")
        });
        selectedModelInCollection = selectedModelInCollection || this.collection.findWhere({
          workitem_id: this.oldSelectedView.model.get("workitem_id")
        });
        var selectableView = selectedModelInCollection && this.children.findByModel(selectedModelInCollection);
        this.oldSelectedView.destroy();
        selectableView && selectableView.setSelection();
      }
      this.updateChildBorders();
    },
    updateChildBorders: function() {
      this.$(this.childViewContainer + " > *").removeClass("first-child last-child");
      if (this.collection.length) {
        this.$(this.childViewContainer).removeClass("binf-hidden");
        var firstChild = this.children.findByModel(this.collection.first()), lastChild = this.children.findByModel(this.collection.last());
        firstChild && firstChild.$el.addClass("first-child");
        lastChild && lastChild.$el.addClass("last-child");
      } else {
        this.$(this.childViewContainer).addClass("binf-hidden");
      }
    },
    onFilterSelectionChanged: function(name, groupName, oldName, oldGroupName) {
      this.ui.timelineGraph.removeClass("filter-" + (oldName || "") + " " + "filter-group-" + (oldGroupName || "")).addClass("filter-" + (name || "") + " " + "filter-group-" + (groupName || "tasks"));
    },
    onChildSetSelection: function(childView, srcView) {
      if (this.selectedView) {
        this.ignoreNextClearSelectionEvent = true;
        this.selectedView.clearSelection();
      }
      this.selectedView = srcView;
      this.selectedView.on("destroy", this.onChildClearSelection.bind(this, this.selectedView, this.selectedView));
      this.oldSelectedView = this.selectedView;
      this.raiseSelectionContextChangeEvent(this.selectedView.model);
    },
    onChildClearSelection: function(childView, srcView) {
      if (this.selectedView === srcView) {
        delete this.selectedView;
        if (this.ignoreNextClearSelectionEvent !== true) {
          this.raiseSelectionContextChangeEvent(this.options.model);
        }
        this.ignoreNextClearSelectionEvent = false;
      }
    },
    raiseSelectionContextChangeEvent: function(model) {
      this.trigger("change:selection:context", model);
    },
    onBeforeDestroy: function() {
      this.timelineFilterView && this.timelineFilterView.destroy();
      this.errorStateView && this.errorStateView.destroy();
    }
  });
  return WorkflowTimelineView;
});