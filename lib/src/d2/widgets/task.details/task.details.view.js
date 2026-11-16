/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/progressblocker/blocker", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "nuc/models/nodes", "csui/utils/commands", "csui/utils/contexts/factories/application.scope.factory", "d2/controls/mixins/view.state/task.view.state.mixin", "dctmw/controls/split.panel/split.panel.view", "d2/controls/task.list/task.list.view", "d2/models/workflow/tasks", "d2/utils/contexts/factories/tasks.factory", "d2/utils/contexts/factories/task", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "d2/utils/widget.constants", "d2/widgets/taskstable/task.toolbaritems", "d2/widgets/taskstable/task.toolbaritems.masks", "d2/widgets/task.details/impl/task.details.panel.view", "hbs!d2/widgets/task.details/impl/task.details", "css!d2/widgets/task.details/impl/task.details" ], function(_, $, Backbone, Marionette, BlockingView, LayoutViewEventsPropagationMixin, NodeCollection, commands, ApplicationScopeModelFactory, TaskViewStateMixin, SplitPanelView, TaskListView, TaskCollection, TaskCollectionFactory, TaskModelFactory, RestResources, serverQueryUtil, widgetConstants, taskToolItems, TaskToolItemsMasks, TaskDetailsPanelView, template) {
  "use strict";
  var TaskDetailsView = Marionette.LayoutView.extend({
    className: "d2-task-details-widget",
    template: template,
    regions: {
      rgnPanelContainer: "> .d2-task-details-container",
      rgnListPanel: "> .left-panel",
      rgnDetailsPanel: "> .right-panel"
    },
    constructor: function TaskDetailsView(options) {
      options = options || {};
      this.context = options.context;
      this.connector = options.connector || this.context && this.context.getObject("connector");
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      this.prepareViewStateApi(options);
      this.addInitialURLParamSupport();
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.context && this.listenToOnce(this.context, "sync", this._onContextNodeSync);
      this.listenTo(this.model, "sync", this._onContextNodeSync).listenTo(this.model, "d2:task:acquired", this._onTaskAcquired).listenTo(this.model, "d2:task:completed", this._markTaskCompleted).listenTo(this.model, "d2:task:aborted", this._markTaskAborted).listenTo(this.model, "d2:task:paused", this._markTaskPaused).listenTo(this.model, "d2:task:delegated", this._markTaskDelegated).listenTo(this.collection, "request", this.blockActions).listenTo(this.collection, "sync error", this.unblockActions);
      this._setupDefaultOptions();
      this._setupTaskListView();
      this._setupTaskDetailsView();
    },
    initialize: function(options) {
      options = options || {};
      if (!options.collection) {
        var taskListWidgetName = this.getViewStateTaskListWidgetName() || options.taskListWidgetName;
        if (!taskListWidgetName) {
          throw new Error("Either a taskListWidgetName or a TaskCollection is required");
        }
        options.collection = this.context.getCollection(TaskCollectionFactory, {
          options: _.extend({
            widgetName: taskListWidgetName,
            commands: commands
          }, this._getCollectionStateOptions())
        });
      } else if (!(options.collection instanceof TaskCollection)) {
        throw new Error("collection is not a TaskCollection");
      }
      this.collection = options.collection;
      options.taskListWidget = serverQueryUtil.getWidgetConfig(widgetConstants.D2.TASKS, this.collection.options.widgetName);
      if (options.container) {
        this.container = options.container;
      } else if (options.data.containerId) {
        this.container = this.context.getModel(TaskModelFactory, {
          task: {
            attributes: {
              id: this.options.data.containerId
            }
          }
        });
      }
      if (!options.manageAttachments) {
        options.manageAttachments = this.getViewStateTaskManageAttachments();
      }
      this.setViewStateTaskManageAttachments(false);
      if (!this.model) {
        this.model = this.context.getModel(TaskModelFactory, {
          attributes: options.data.id && {
            id: options.data.id
          },
          temporary: true
        });
        options.model = this.model;
      }
      if (!this.container) {
        this.container = options.model.clone();
      }
      options.container = this.container;
    },
    addInitialURLParamSupport: function() {
      this.addUrlParametersSupport(TaskViewStateMixin.PROPERTY_CONSTANTS.DETAILS_PERSPECTIVE_INIT_URL_PARAMS);
    },
    _getCollectionStateOptions: function() {
      var options = {
        orderBy: this.getViewStateCollectionOrderBy(),
        filter: this.getViewStateCollectionFilter(),
        skip: this.getViewStateCollectionSkipCount(),
        top: this.getViewStateCollectionTopCount(),
        facetFilters: this.getViewStateCollectionFacetFilter(),
        hasMoreRecords: this.getViewStateCollectionHasMoreRecords(),
        hadMoreRecords: this.getViewStateCollectionHadMoreRecords(),
        expanded: true,
        overrideSortingOrderFromColumnPref: true
      };
      if (_.isEmpty(options.orderBy)) {
        options.orderBy = "date_sent desc";
        this.setViewStateCollectionOrderBy(options.orderBy, false);
      }
      if (!_.isObject(options.filter) && _.isEmpty(options.filter)) {
        options.filter = {};
        this.setViewStateCollectionFilter(options.filter, false);
      }
      if (!_.isNumber(options.skip) || _.isNaN(options.skip) || options.skip < 0) {
        options.skip = 0;
        this.setViewStateCollectionSkipCount(options.skip, true, false);
      }
      if (!_.isNumber(options.top) || _.isNaN(options.top) || options.top <= 0) {
        options.top = 30;
        this.setViewStateCollectionTopCount(options.top, true, false);
      }
      return options;
    },
    _onContextNodeSync: function() {
      var targetModelInCollection = this.collection.findWhere({
        id: this.model.get("id")
      });
      if (targetModelInCollection) {
        var name = targetModelInCollection.get("name");
        targetModelInCollection.clear({
          silent: true
        });
        targetModelInCollection.set(_.extend({}, this.model.attributes, {
          name: name
        }));
        if (this.model.get("delete_flag") === true || this.model.get("task_state") === "paused") {
          var state = this.model.get("task_state"), dequeueing_user = this.model.get("dequeued_by");
          if (state !== "dormant" || dequeueing_user !== RestResources.getCurrentUser().get("name")) {
            this.collection.remove(targetModelInCollection);
          } else {
            this.taskListView && this.taskListView.refreshInbox(true);
          }
        }
      }
    },
    _onTaskAcquired: function(oldId, taskAttrs) {
      var targetModelInCollection = this.collection.findWhere({
        id: oldId
      });
      targetModelInCollection.set(taskAttrs);
      this._onListClickItem(targetModelInCollection);
    },
    _markTaskCompleted: function(options) {
      options = options || {};
      options.mergeTaskProperties = {
        task_state: "finished"
      };
      this._handleNavigationAfterTaskCompletion(options);
    },
    _markTaskAborted: function(options) {
      options = options || {};
      options.mergeTaskProperties = {
        task_state: "paused",
        delete_flag: true
      };
      options.removeTasksForSameWorkflow = true;
      this._handleNavigationAfterTaskCompletion(options);
    },
    _markTaskPaused: function(options) {
      options = options || {};
      options.mergeTaskProperties = {
        task_state: "paused",
        delete_flag: false
      };
      options.removeTasksForSameWorkflow = true;
      this._handleNavigationAfterTaskCompletion(options);
    },
    _markTaskDelegated: function(options) {
      options = options || {};
      options.mergeTaskProperties = {
        task_state: "acquired",
        delete_flag: true
      };
      this._handleNavigationAfterTaskCompletion(options);
    },
    _handleNavigationAfterTaskCompletion: function(options) {
      options = options || {};
      var currentTaskIndex = this.collection.findIndex({
        id: options.id
      }), currentTask = currentTaskIndex !== -1 && this.collection.at(currentTaskIndex), otherSimilarTasks = currentTask && options.removeTasksForSameWorkflow === true && _.filter(this.collection.allModels, function(m) {
        return m !== currentTask && m.get("workflow_id") === currentTask.get("workflow_id");
      }), nextTaskAbsoluteIndex = -1, taskNavigationPreference = RestResources.getCurrentUser().get("preferences")["sv_task_navigation_on_completion"], shouldPickNextTask = options.externallyCompleted !== true && taskNavigationPreference === "NEXT";
      if (currentTask) {
        if (otherSimilarTasks && otherSimilarTasks.length) {
          this.collection.remove(otherSimilarTasks);
          this.collection.lastFilteredAndSortedModels = _.without.apply(_, [ this.collection.lastFilteredAndSortedModels ].concat(otherSimilarTasks));
        }
        var currentTaskAbsoluteIndex;
        if (shouldPickNextTask) {
          var currentPage = this.collection.skipCount / this.collection.topCount;
          currentTaskAbsoluteIndex = currentTaskIndex + this.collection.skipCount;
          if (currentTaskIndex < this.collection.length - 1) {
            nextTaskAbsoluteIndex = currentTaskAbsoluteIndex;
          } else {
            if (currentTaskIndex === 0) {
              if (currentPage > 1) {
                nextTaskAbsoluteIndex = (currentPage - 1) * this.collection.topCount;
              } else {
                nextTaskAbsoluteIndex = -1;
              }
            } else {
              if (currentTaskAbsoluteIndex < this.collection.lastFilteredAndSortedModels.length - 1) {
                nextTaskAbsoluteIndex = currentTaskAbsoluteIndex;
              } else {
                nextTaskAbsoluteIndex = this.collection.skipCount;
              }
            }
          }
          shouldPickNextTask = shouldPickNextTask && nextTaskAbsoluteIndex !== -1;
        }
        currentTask.set(options.mergeTaskProperties, {
          silent: true
        });
        if (currentTask.get("id") === this.model.get("id")) {
          this.model.set(options.mergeTaskProperties, {
            silent: true
          });
        }
        this.ignoreNextListDeselectionEvent = shouldPickNextTask;
        if (this.collection.lastFilteredAndSortedModels.length === 1 && options.externallyCompleted !== true) {
          this.collection.remove(currentTask, {
            silent: true
          });
          this._onClickBack();
        } else {
          this.collection.remove(currentTask);
          if (this.collection.lastFilteredAndSortedModels[currentTaskAbsoluteIndex].get("id") === currentTask.get("id")) {
            this.collection.lastFilteredAndSortedModels.splice(currentTaskAbsoluteIndex, 1);
          }
          shouldPickNextTask && this._onListClickItem(this.collection.lastFilteredAndSortedModels[nextTaskAbsoluteIndex]);
        }
      }
    },
    _setupDefaultOptions: function() {
      this.options.commands = commands;
      this.options.toolbarItems = _.extend({}, taskToolItems);
      this.options.toolbarItemsMasks = new TaskToolItemsMasks(this.options);
      this.options.originatingView = this;
      this.options.blockingParentView = this;
    },
    _setupTaskListView: function() {
      if (!this.taskListView) {
        this.taskListView = new TaskListView(_.defaults({
          collection: this.collection,
          showBackButton: true,
          tooltipBackButton: this.getBackTitleOfLastRouter(),
          labelListName: this.options.taskListWidget && this.options.taskListWidget["label_value"]
        }, this.options));
        this.listenTo(this.taskListView, "click:back", this._onClickBack).listenTo(this.taskListView, "click:item", this._onListClickItem).listenTo(this.taskListView, "clear:selection", this._onListClearSelection);
      }
    },
    _setupTaskDetailsView: function() {
      if (!this.taskDetailsView) {
        this.taskDetailsView = new TaskDetailsPanelView(_.defaults({}, this.options));
        this.listenTo(this.taskDetailsView, "goto:task:list", this._onClickBack);
      }
    },
    onRender: function() {
      if (!this.splitPanel) {
        this.splitPanel = new SplitPanelView({});
        this.rgnPanelContainer.show(this.splitPanel);
      }
      this.splitPanel.showPanelViews(this.taskListView, this.taskDetailsView);
    },
    _onClickBack: function(e) {
      this._onBeforeNavigateBack(e);
      if (!e || !e.isDefaultPrevented()) {
        var cmdGoBack = commands.get("D2-Back");
        cmdGoBack && cmdGoBack.execute({
          context: this.context,
          restoreLastFragment: false
        });
      }
    },
    _onBeforeNavigateBack: function(e) {
      this.trigger("task:navigation:back", e);
    },
    _getListItemOpenCommandSignature: function() {
      return "D2-OpenTask";
    },
    _onListClickItem: function(model) {
      var cmdOpenTask = commands.get(this._getListItemOpenCommandSignature());
      cmdOpenTask && cmdOpenTask.execute({
        context: this.context,
        nodes: new NodeCollection([ model ])
      }, {
        replaceLastUrl: true
      });
    },
    _onListClearSelection: function(model) {
      if (this.ignoreNextListDeselectionEvent === true) {
        this.ignoreNextListDeselectionEvent = false;
        return;
      }
      this.taskDetailsView && this.taskDetailsView.triggerMethod("show:zero:state:view", model || this.model);
    }
  });
  _.extend(TaskDetailsView.prototype, LayoutViewEventsPropagationMixin);
  TaskViewStateMixin.mixin(TaskDetailsView.prototype);
  return TaskDetailsView;
});