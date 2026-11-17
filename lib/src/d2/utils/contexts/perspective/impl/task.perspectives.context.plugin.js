/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/models/nodes", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/contexts/perspective/perspective.context.plugin", "d2/controls/mixins/view.state/task.view.state.mixin", "d2/commands/workflow/acquire.task", "d2/commands/workflow/read.task", "d2/utils/constants", "d2/utils/contexts/context.controller", "d2/utils/contexts/factories/task", "d2/utils/contexts/factories/next.task", "d2/utils/contexts/perspective/task.perspectives", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "d2/utils/widget.constants", "i18n!d2/utils/contexts/perspective/impl/nls/lang" ], function(module, _, $, Backbone, NodeCollection, ApplicationScopeModelFactory, PerspectiveContextPlugin, TaskViewStateMixin, AcquireTaskCommand, ReadTaskCommand, constants, D2ContextController, TaskModelFactory, NextTaskModelFactory, taskPerspectives, RestResources, serverQueryUtil, widgetConstants, lang) {
  "use strict";
  var APP_SCOPE_TASK_DETAILS = "taskdetails", APP_SCOPE_TASK_DOCUMENTS = "taskdocuments", supportedApplicationScopes = [ APP_SCOPE_TASK_DETAILS, APP_SCOPE_TASK_DOCUMENTS ];
  var TaskPerspectivesContextPlugin = PerspectiveContextPlugin.extend({
    constructor: function TaskPerspectivesContextPlugin() {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.nextTask = this.context.getModel(NextTaskModelFactory, {
        permanent: true,
        detached: true
      });
      this.viewStateModel = this.context.viewStateModel;
      this.cmdAcquireTask = new AcquireTaskCommand();
      this.cmdReadTask = new ReadTaskCommand();
      this.listenTo(this.nextTask, "change:task_info", this._fetchTaskPerspective);
    },
    isFetchable: function(factory) {
      return factory.property !== this.task;
    },
    isWithinServiceableScope: function() {
      var appScopeId = this.applicationScope.get("id");
      return _.includes(supportedApplicationScopes, appScopeId);
    },
    onClear: function() {
      if (!this.isWithinServiceableScope()) {
        this.task = this._getTaskFromFactory();
        this.nextTask.clear({
          silent: true
        });
      } else {
        this.task = this._getTaskFromFactory.apply(this, this.rejectedPerspective ? undefined : [ this.nextTask.get("task_info").model, true ]);
      }
    },
    onRefresh: function() {
      if (this.isWithinServiceableScope()) {
        if (this.rejectedPerspective) {
          this.task.clear();
          return;
        }
        this._syncTaskToSharedContextModel();
      }
    },
    _getTaskFromFactory: function(sourceTask, forceCopy) {
      var factory = this.context.getFactory(TaskModelFactory, {
        task: sourceTask
      });
      if (!!sourceTask && forceCopy === true && factory.property !== sourceTask) {
        factory.property = sourceTask;
      }
      return factory.property;
    },
    _syncTaskToSharedContextModel: function() {
      this.task = this._getTaskFromFactory();
      var taskInfo = this.nextTask.get("task_info");
      if (taskInfo.model === this.task) {
        return;
      }
      this.task.clear({
        silent: true
      });
      this.task.set(taskInfo.model.attributes);
      this.task.trigger("sync");
    },
    _fetchTaskPerspective: function() {
      var taskInfo = this.nextTask.get("task_info"), task, showTaskDocuments = taskInfo.showDocumentsView === true;
      if (taskInfo.model) {
        if (this.task && this.task === taskInfo.model && this.isWithinServiceableScope()) {
          return;
        }
        task = taskInfo.model;
      } else {
        task = this.context.getModel(TaskModelFactory, {
          attributes: {
            id: taskInfo.id
          },
          temporary: true
        });
      }
      this.rejectedPerspective = false;
      this.context.triggerMethod("request:perspective", this.context);
      this.applicationScope.set("id", showTaskDocuments ? APP_SCOPE_TASK_DOCUMENTS : APP_SCOPE_TASK_DETAILS);
      task.ensureFetched({
        converForbiddenItemToDummyModel: !showTaskDocuments,
        context: this.context
      }).done(function() {
        this._tryAutoAcquireOrMarkAsRead(task).always(function() {
          var newTaskInfo;
          this.task = task;
          if (taskInfo.model) {
            taskInfo.model = task;
          } else {
            newTaskInfo = {
              id: task.get("id"),
              model: task
            };
            if (newTaskInfo.id !== taskInfo.id) {
              newTaskInfo.replaceLastUrl = true;
            }
          }
          var userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), taskListWidgetName = taskInfo.tasksWidgetName || this.viewStateModel.getDefaultViewState(TaskViewStateMixin.PROPERTY_CONSTANTS.WIDGET_NAME_TASK_LIST), taskListWidgetConfig = !!taskListWidgetName && serverQueryUtil.getWidgetConfig(widgetConstants.D2.TASKS, taskListWidgetName), taskAttachmentsWidgetName = this.viewStateModel.getDefaultViewState(TaskViewStateMixin.PROPERTY_CONSTANTS.WIDGET_NAME_TASK_ATTACHMENTS), taskAttachmentsWidgetConfig = !!taskAttachmentsWidgetName && serverQueryUtil.getWidgetConfig(widgetConstants.D2.TASK_ATTACHMENTS, taskAttachmentsWidgetName);
          if (!showTaskDocuments && !taskListWidgetConfig) {
            taskListWidgetName = userDefaultWidgets[widgetConstants.DEFAULT.TASKS];
            taskListWidgetConfig = !!taskListWidgetName && serverQueryUtil.getWidgetConfig(widgetConstants.D2.TASKS, taskListWidgetName);
            if (!taskListWidgetConfig) {
              this._doRejectPerspective(task, new Error(lang.ErrorMissingTasksWidgetConfig));
              return;
            }
          }
          if (!showTaskDocuments && !taskAttachmentsWidgetConfig) {
            taskAttachmentsWidgetName = userDefaultWidgets[widgetConstants.DEFAULT.TASK_ATTACHMENTS];
            taskAttachmentsWidgetConfig = !!taskAttachmentsWidgetName && serverQueryUtil.getWidgetConfig(widgetConstants.D2.TASK_ATTACHMENTS, taskAttachmentsWidgetName);
            if (!taskAttachmentsWidgetConfig) {
              this._doRejectPerspective(task, new Error(lang.ErrorMissingTaskAttachmentsWidgetConfig));
              return;
            }
          }
          this.viewStateModel.setDefaultViewState(TaskViewStateMixin.PROPERTY_CONSTANTS.WIDGET_NAME_TASK_LIST, taskListWidgetName, {
            silent: true
          });
          this.viewStateModel.setDefaultViewState(TaskViewStateMixin.PROPERTY_CONSTANTS.WIDGET_NAME_TASK_ATTACHMENTS, taskAttachmentsWidgetName, {
            silent: true
          });
          this._setOtherDefaultViewStateParams(taskInfo);
          if (newTaskInfo) {
            this.nextTask.set("task_info", _.extend({}, taskInfo, newTaskInfo));
          }
          this._verifyTaskModelAndDecidePerspective(task, {
            showTaskDocumentsView: showTaskDocuments
          });
        }.bind(this));
      }.bind(this)).fail(function(error) {
        this._doRejectPerspective(task, error);
      }.bind(this));
    },
    _tryAutoAcquireOrMarkAsRead: function(task) {
      var dfd = $.Deferred(), taskState = task.get("task_state"), deleteFlag = task.get("delete_flag"), isManualAcquisition = task.get("is_manual_acquisition_required"), isRead = task.get("is_read");
      if (deleteFlag !== true) {
        if (taskState === "dormant" && isManualAcquisition === false) {
          this.cmdAcquireTask.execute({
            context: this.context,
            nodes: new NodeCollection([ task ]),
            data: {
              forceAcquire: false,
              forceRead: true
            }
          }, {
            suppressProgress: true,
            hideSuccessMessage: true,
            hideFailureMessage: false
          }).always(dfd.resolve);
        } else if (taskState === "acquired" && isRead === false) {
          this.cmdReadTask.execute({
            context: this.context,
            nodes: new NodeCollection([ task ])
          }).always(dfd.resolve);
        } else {
          dfd.resolve();
        }
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    _verifyTaskModelAndDecidePerspective: function(task, addlPerspectiveMatcherProperties) {
      if (task.get("type") === constants.Types.TASK) {
        this._changePerspective(task, addlPerspectiveMatcherProperties);
      } else {
        this._doRejectPerspective(task, new Error(lang.ErrorNotATask));
      }
    },
    _doRejectPerspective: function(task, error) {
      this.rejectedPerspective = true;
      this.context.rejectPerspective(task, error);
    },
    _changePerspective: function(sourceModel, addlPerspectiveMatcherProperties) {
      var perspectiveModule, perspective = taskPerspectives.findByNode(addlPerspectiveMatcherProperties ? new Backbone.Model(_.defaults(addlPerspectiveMatcherProperties, sourceModel.attributes)) : sourceModel);
      if (_.isEmpty(sourceModel.get("perspective")) || perspective.get("important")) {
        perspectiveModule = perspective.get("module");
      }
      if (perspectiveModule) {
        return this.context.overridePerspective(sourceModel, perspectiveModule);
      }
      this.context.applyPerspective(sourceModel);
    },
    _setOtherDefaultViewStateParams: function(taskInfo) {
      if (taskInfo) {
        var viewStateModel = this.context.viewStateModel, state = viewStateModel.get(viewStateModel.CONSTANTS.STATE) || {}, defaultState = viewStateModel.get(viewStateModel.CONSTANTS.DEFAULT_STATE) || {};
        if (!_.isUndefined(taskInfo.orderBy)) {
          state[TaskViewStateMixin.PROPERTY_CONSTANTS.COLLECTION_STATE_ORDER_BY] = taskInfo.orderBy;
        }
        if (_.isObject(taskInfo.filter)) {
          state[TaskViewStateMixin.PROPERTY_CONSTANTS.COLLECTION_STATE_FILTER] = JSON.stringify(taskInfo.filter);
        }
        if (_.isNumber(taskInfo.top) && !_.isNaN(taskInfo.top)) {
          defaultState[TaskViewStateMixin.PROPERTY_CONSTANTS.COLLECTION_STATE_TOP] = taskInfo.top;
        }
        if (_.isNumber(taskInfo.skip) && !_.isNaN(taskInfo.skip)) {
          defaultState[TaskViewStateMixin.PROPERTY_CONSTANTS.COLLECTION_STATE_SKIP] = taskInfo.skip;
        }
        if (_.isBoolean(taskInfo.manageAttachments)) {
          defaultState[TaskViewStateMixin.PROPERTY_CONSTANTS.TASK_MANAGE_ATTACHMENTS] = taskInfo.manageAttachments;
        }
        if (taskInfo.selectedFileTab) {
          state[TaskViewStateMixin.PROPERTY_CONSTANTS.TASK_DOCUMENTS_TYPE] = taskInfo.selectedFileTab;
        }
        if (taskInfo.selectedMetaTab) {
          state[TaskViewStateMixin.PROPERTY_CONSTANTS.TASK_METADATA_DROPDOWN] = taskInfo.selectedMetaTab;
        }
        if (taskInfo.selectedNodeId) {
          defaultState[TaskViewStateMixin.PROPERTY_CONSTANTS.TASK_DOCUMENTS_SELECTED_NODE] = taskInfo.selectedNodeId;
        }
        if (taskInfo.facetFilters) {
          defaultState[TaskViewStateMixin.PROPERTY_CONSTANTS.COLLECTION_STATE_FACETFILTERS] = taskInfo.facetFilters;
        }
        if (taskInfo.hasMoreRecords) {
          defaultState[TaskViewStateMixin.PROPERTY_CONSTANTS.COLLECTION_HAS_MORE_RECORDS] = taskInfo.hasMoreRecords;
        }
        if (taskInfo.hadMoreRecords) {
          defaultState[TaskViewStateMixin.PROPERTY_CONSTANTS.COLLECTION_HAD_MORE_RECORDS] = taskInfo.hadMoreRecords;
        }
        viewStateModel.set(viewStateModel.CONSTANTS.STATE, state, {
          silent: true
        });
        viewStateModel.set(viewStateModel.CONSTANTS.DEFAULT_STATE, defaultState, {
          silent: true
        });
      }
    }
  });
  return TaskPerspectivesContextPlugin;
});