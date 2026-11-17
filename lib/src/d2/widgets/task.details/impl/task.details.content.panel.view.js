/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  LayoutView
} from "nuc/lib/marionette";

import NodeTypeIconView from "csui/controls/node-type.icon/node-type.icon.view";

import TableToolbarView from "csui/controls/tabletoolbar/tabletoolbar.view";

import SplitPanelView from "dctmw/controls/split.panel/split.panel.view";

import TaskDetailsPanelView from "d2/widgets/task.details/impl/task.details.panel.view";

import TaskAdditionalPanelsView from "d2/widgets/task.details/impl/task.additional.panels.view";

import constants from "d2/utils/constants";

import template from "hbs!d2/widgets/task.details/impl/task.details.content.panel";

import headerTitleTemplate from "hbs!d2/widgets/task.details/impl/task.details.content.header.title";

import lang from "i18n!d2/widgets/task.details/impl/nls/lang";

import "css!d2/widgets/task.details/impl/task.details.content.panel";

class TaskDetailsHeaderTitleView extends LayoutView {
  template = headerTitleTemplate;
  className() {
    return "d2-task-details-header-title";
  }
  constructor(options) {
    super(options);
    this.model = options.model;
  }
  onRender() {
    this._renderChildrenViews();
  }
  _renderChildrenViews() {
    if (this._nodeIconView) {
      this._nodeIconView.destroy();
    }
    this._nodeIconView = new NodeTypeIconView({
      el: this.$(".csui-type-icon").get(0),
      node: this.options.model,
      displayThumbnailIcon: this.model.get("container")
    });
    this._nodeIconView.render();
  }
}

class TaskDetailsContentPanelView extends TaskDetailsPanelView {
  template = template;
  templateHelpers() {
    return {
      name: this.options.model.get("name")
    };
  }
  className() {
    return TaskDetailsPanelView.prototype.className + " d2-task-details-panel-content";
  }
  regions() {
    return {
      rgnHeaderTitle: ".d2-task-details-header-title-container",
      rgnHeaderActions: ".d2-task-details-header-actions",
      rgnTaskDetailsBody: ".d2-task-details-body",
      rgnAdditionalPanels: ".d2-task-details-additional-panels",
      rgnDocumentViewer: ".d2-task-details-content-viewer",
      rgnZeroStateContainer: ".d2-task-zero-state-container"
    };
  }
  constructor(options) {
    super(options);
    this.listenTo(this, "add:mini:viewer", this._addMiniViewer.bind(this));
  }
  _renderChildrenViews() {
    this.rgnHeaderActions.show(this.toolbarView);
    this.rgnHeaderTitle.show(this.taskDetialsHeaderTitleView);
    this.splitPanel = new SplitPanelView({
      type: SplitPanelView.TYPES.THREE_WAY
    });
    this.rgnTaskDetailsBody.show(this.splitPanel);
    this.splitPanel.ui.primaryPane.css({
      "flex-basis": 0
    });
    this.splitPanel.ui.primaryPane.css("min-width", 0);
    this.splitPanel.showPanelViews(null, this.taskAdditionalPanelsView, null);
    this._adjustRightToolbar();
  }
  _adjustRightToolbar() {
    var toolbarView = this.toolbarView, otherToolbarView = toolbarView && toolbarView["otherToolbarView"], selectedNodes = toolbarView && toolbarView.selectedNodes;
    toolbarView && toolbarView.$el && toolbarView.$el.find(".csui-tabletoolbar").removeClass("tile-nav");
    selectedNodes && selectedNodes.reset([ this.options.model ]);
    otherToolbarView && otherToolbarView._adjustToFit();
  }
  _createAndRenderMetadataView() {
    if (this.toolbarView) {
      this.toolbarView.destroy();
    }
    this.toolbarView = new TableToolbarView(_.defaults({
      model: this.model.clone(),
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
    require([ "csui/widgets/metadata/metadata.panels" ], metadataPanels => {
      if (this.taskAdditionalPanelsView) {
        this.taskAdditionalPanelsView.destroy();
      }
      this.options.metadataPanels = metadataPanels.map(model => {
        let clonedModel = model.clone();
        if (clonedModel.get("name") === "properties") {
          clonedModel.set("title", lang.defaultTitleAdditionalPanelProperties);
        }
        return clonedModel;
      });
      this.taskAdditionalPanelsView = new TaskAdditionalPanelsView(this.options);
      if (this.taskDetialsHeaderTitleView) {
        this.taskDetialsHeaderTitleView.destroy();
      }
      this.taskDetialsHeaderTitleView = new TaskDetailsHeaderTitleView(this.options);
      this._renderChildrenViews();
    });
    if (this.options.manageAttachments) {
      this.options.manageAttachments = false;
    }
    if (this.lastAppliedResolution) {
      this.onResolutionChange(this.lastAppliedResolution);
    }
  }
  _addMiniViewer(selectedNode) {
    this.connector = this.options.connector || this.context && this.context.getObject("connector");
    var me = this, model = selectedNode.clone(), viewerRegion = this.getPreviewRegion(), viewerModel = viewerRegion && viewerRegion.currentView && viewerRegion.currentView.model || this.miniviewerView && this.miniviewerView.options.model;
    model.widgetDetails = selectedNode.widgetDetails;
    if (viewerModel && viewerRegion.currentView && viewerRegion.currentView._isRendered && viewerModel.get("id") !== model.get("id")) {
      viewerModel.set(model.attributes, {
        silent: true
      });
      viewerModel.fetched = true;
      viewerModel.trigger("sync");
      if (viewerRegion.currentView._isMinimized) {
        this.splitPanel.collapsePanel(this.splitPanel.ui.tertiaryPane, null, this.splitPanel.rgnTertiaryPane);
      }
    } else {
      require([ "d2/widgets/miniviewer/miniviewer.view" ], function(D2MiniViewer) {
        model.fetched = true;
        me.miniviewerView = new D2MiniViewer(_.defaults({
          el: me.getPreviewRegion(),
          model: model,
          context: me.options.context
        }));
        me.miniviewerView && me.miniviewerView.render();
        me.miniviewerView.model.trigger("sync");
        if (window.innerWidth >= constants.Resolution.MEDIUM) {
          me._toggleMiniviewer();
        } else {
          me._toggleMiniviewer(false);
        }
      });
    }
  }
  getPreviewRegion() {
    return this.splitPanel.getHostRegionForContentInPane(SplitPanelView.PANES.TERTIARY);
  }
  _toggleMiniviewer(showMiniViewer) {
    if (this.miniviewerView._userHasMinimized && showMiniViewer) {
      this.collapseMiniViewer();
    } else {
      this.expandMiniviewer();
    }
  }
  collapseMiniViewer() {
    if (this.miniviewerView && !this.miniviewerView._isMinimized) {
      this.miniviewerView.triggerMethod("before:collapse");
      if (!this.splitPanel.rgnTertiaryPane?.collapsed) {
        this.splitPanel.rgnTertiaryPane.collapsed = false;
      }
      this.splitPanel.collapsePanel(this.splitPanel.ui.tertiaryPane, null, this.splitPanel.rgnTertiaryPane);
      this.miniviewerView.triggerMethod("after:collapse");
    }
  }
  expandMiniviewer() {
    if (this.miniviewerView || this.miniviewerView._isMinimized) {
      this.miniviewerView.triggerMethod("before:expand");
      if (!this.splitPanel.rgnTertiaryPane?.collapsed) {
        this.splitPanel.rgnTertiaryPane.collapsed = true;
      }
      this.splitPanel.expandPanel(this.splitPanel.ui.tertiaryPane, null, this.splitPanel.rgnTertiaryPane);
      this.miniviewerView.triggerMethod("after:expand");
    }
  }
  onBeforeDestroy() {
    this.miniviewerView && this.miniviewerView.destroy();
    super.onBeforeDestroy && super.onBeforeDestroy();
  }
}

export default TaskDetailsContentPanelView;