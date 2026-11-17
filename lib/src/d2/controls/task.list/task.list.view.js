/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/progressblocker/blocker", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/utils/commands", "d2/utils/constants", "d2/controls/button.toolbar/button.toolbar.view", "dctmw/controls/list/list.view", "d2/models/workflow/tasks", "d2/models/workflow/workflows", "i18n!d2/controls/task.list/impl/nls/lang", "hbs!d2/controls/task.list/impl/task.list", "css!d2/controls/task.list/impl/task.list" ], function(_, $, Backbone, Marionette, BlockingView, LayoutViewEventsPropagationMixin, commands, constants, ButtonToolbarView, D2ListView, TaskCollection, WorkflowCollection, lang, template) {
  "use strict";
  var CustomListView = D2ListView.extend({
    constructor: function CustomListView(options) {
      options = options || {};
      D2ListView.prototype.constructor.call(this, options);
      this.attributesUsedForEqualityComparison.push("workflow_id");
    },
    _onChildRender: function(childView) {
      D2ListView.prototype._onChildRender.apply(this, arguments);
      if (!childView.model.get("is_read")) {
        childView.$(".list-item-title").addClass("unread");
      } else {
        childView.$(".list-item-title").removeClass("unread");
      }
    },
    _initialEvents: function() {
      D2ListView.prototype._initialEvents.apply(this, arguments);
      if (this.collection) {
        this.stopListening(this.collection, "reset").listenTo(this.collection, "reset", this._adjustPageAndRender);
      }
    },
    _adjustPageAndRender: function() {
      if (this.selectedModel) {
        var selIndex = this._findIndexOfModelIn(this.collection.models, this.selectedModel), selModel, top, page, skip, relativeSelIndex;
        if (selIndex === -1) {
          selIndex = this._findIndexOfModelIn(this.collection.lastFilteredAndSortedModels, this.selectedModel);
          if (selIndex !== -1) {
            selModel = this.collection.lastFilteredAndSortedModels[selIndex];
            top = this.collection.topCount;
            page = Math.floor(selIndex / top);
            skip = page * top;
            relativeSelIndex = skip - selIndex;
            if (selModel.get("id") !== this.selectedModel.get("id")) {
              this.postRenderAutoSelectIndex = relativeSelIndex;
            } else {
              this.postRenderAutoSelectIndex = -1;
            }
            this.collection.setSkip(skip);
            return;
          } else {
            this.postRenderAutoSelectIndex = -1;
            if (this.collection.length === 0 && this.collection.lastFilteredAndSortedModels.length !== 0) {
              top = this.collection.topCount;
              page = Math.floor((this.collection.lastFilteredAndSortedModels.length - 1) / top);
              skip = page * top;
              this.collection.setSkip(skip);
              return;
            }
          }
        } else {
          selModel = this.collection.models[selIndex];
          if (selModel.get("id") !== this.selectedModel.get("id")) {
            this.postRenderAutoSelectIndex = selIndex;
          } else {
            this.postRenderAutoSelectIndex = -1;
          }
        }
      }
      Marionette.CollectionView.prototype.render.apply(this, arguments);
    }
  });
  var TaskListView = Marionette.LayoutView.extend({
    className: "d2-task-simple-list no-footer",
    template: template,
    regions: {
      rgnHeader: ".d2-task-simple-list-header",
      rgnListContainer: ".d2-task-simple-list-container"
    },
    ui: {
      pageInfo: ".d2-task-simple-list-footer > .page-info"
    },
    constructor: function TaskListView(options) {
      options = options || {};
      if (!(options.collection instanceof TaskCollection) && !(options.collection instanceof WorkflowCollection)) {
        throw new Error("An instance of either TaskCollection or WorkflowCollection is required");
      }
      this.collection = options.collection;
      this.showBackButton = _.isBoolean(options.showBackButton) ? options.showBackButton : false;
      this.cmdRefreshList = commands.get("D2-RefreshList");
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.listenTo(this.collection, "sync update", this._updatePageInfo);
      this._setupHeaderView();
      this._setupListView();
    },
    onResolutionChange: function(resolutionData) {
      if (resolutionData.showSideBar === false) {
        return true;
      } else {
        return false;
      }
    },
    _setupHeaderView: function() {
      var buttonsConfig = {
        left: [ {
          id: "listLabel",
          className: "d2-task-simple-list-header-label",
          label: this.options.labelListName || lang.defaultLabelTaskList,
          showLabel: true
        } ],
        right: [ {
          id: "refreshCollection",
          iconName: "d2_action_refresh",
          tooltip: this.options.tooltipRefreshButton || lang.defaultTooltipRefreshButton,
          clickHandler: this.refreshInbox.bind(this, false)
        } ]
      };
      if (this.showBackButton) {
        buttonsConfig.left.splice(0, 0, {
          id: "navigateBack",
          className: "icon icon-task-go-back",
          iconName: "csui_action_back32",
          tooltip: this.options.tooltipBackButton && this.options.tooltipBackButton !== "back" ? this.options.tooltipBackButton : lang.defaultTooltipBackButton,
          clickHandler: this._onClickGoBack.bind(this)
        });
      }
      this.toolbarView = new ButtonToolbarView(buttonsConfig);
    },
    _setupListView: function() {
      if (!this.listView) {
        this.listView = new CustomListView(_.defaults({
          selectedModel: this.options.model
        }, _.omit(this.options, "model")));
        this.listenTo(this.listView, "click:item", this._onListViewClickItem).listenTo(this.listView, "clear:selection", this._onListViewClearSelection);
      }
    },
    onRender: function() {
      this._renderChildrenViews();
    },
    _renderChildrenViews: function() {
      this.toolbarView && this.rgnHeader.show(this.toolbarView);
      this.listView && this.rgnListContainer.show(this.listView);
    },
    _updatePageInfo: function() {
      if (this.collection.length) {
        this.$el.removeClass("no-footer");
      } else {
        this.$el.addClass("no-footer");
      }
      this.ui.pageInfo.text(this.collection.allModels.length && this.collection.filteredCount ? _.str.sformat(lang.pageInfoFormat, 1 + this.collection.skipCount, this.collection.skipCount + this.collection.length, this.collection.filteredCount) : "");
    },
    refreshInbox: function(skipSelectionRefresh) {
      this.blockActions();
      var promise = skipSelectionRefresh !== true && this.options.model ? this.options.model.fetch() : $.Deferred().resolve().promise();
      promise.always(function() {
        this.cmdRefreshList.execute({
          collection: this.collection
        }).always(this.unblockActions.bind(this));
      }.bind(this));
    },
    _onClickGoBack: function(e) {
      this.trigger("click:back", e);
    },
    _onListViewClickItem: function(item) {
      this.trigger("click:item", item.model);
    },
    _onListViewClearSelection: function() {
      this.trigger("clear:selection", this.options.model);
    },
    getWidgetTypeId: function() {
      return this.collection instanceof WorkflowCollection ? constants.WidgetId.WORKFLOWS : constants.WidgetId.TASKS;
    }
  });
  _.extend(TaskListView.prototype, LayoutViewEventsPropagationMixin);
  return TaskListView;
});