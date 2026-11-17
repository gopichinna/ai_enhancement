/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/pages/start/perspective.router", "i18n!csui/pages/start/nls/lang", "i18n!csui/pages/start/impl/nls/lang", "i18n!d2/pages/start/impl/nls/lang", "d2/controls/mixins/view.state/task.view.state.mixin", "d2/utils/contexts/factories/next.task" ], function(module, $, _, Backbone, PerspectiveRouter, publicLang, publicLang2, lang, TaskViewStateMixin, NextTaskModelFactory) {
  "use strict";
  var TaskPerspectivesRouter = PerspectiveRouter.extend({
    routes: {
      "tasks/:task_id(?*query_string)": "openTaskDetails",
      "tasks/:task_id/docs(?*query_string)": "openTaskDocuments"
    },
    name: "TaskPerspectivesRouter",
    constructor: function TaskPerspectivesRouter() {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);
      this.isViewStateModelOwner = false;
      this.nextTask = this.context.getModel(NextTaskModelFactory);
      this.listenTo(this.nextTask, "change:task_info", this._updateUrl);
    },
    isViewStateModelSupported: function() {
      return true;
    },
    openTaskDetails: function(id, query_string) {
      this._openTaskDetailsOrDocuments(id, query_string);
    },
    openTaskDocuments: function(id, query_string) {
      this._openTaskDetailsOrDocuments(id, query_string, true);
    },
    _openTaskDetailsOrDocuments: function(id, query_string, showDocumentsView) {
      var taskInfo = this.nextTask.get("task_info");
      var setId = !taskInfo || (id && id !== taskInfo.id || showDocumentsView !== taskInfo.showDocumentsView);
      this.initViewStateFromUrlParams(query_string, setId);
      this.activate(false);
      if (setId) {
        this.nextTask.set("task_info", {
          id: id,
          showDocumentsView: showDocumentsView
        });
      }
    },
    onOtherRoute: function() {
      if (this.isViewStateModelOwner) {
        var viewStateModel = this.context.viewStateModel;
        viewStateModel && viewStateModel.unset(viewStateModel.CONSTANTS.URL_PARAMS);
        this.isViewStateModelOwner = false;
      }
      this.nextTask.clear({
        silent: true
      });
    },
    onViewStateChanged: function() {
      var taskInfo = this.nextTask.get("task_info"), viewStateModel = this.context.viewStateModel;
      if (taskInfo && taskInfo.id && _.any([ viewStateModel.CONSTANTS.URL_PARAMS, viewStateModel.CONSTANTS.STATE ], function(k) {
        return viewStateModel.hasChanged(k);
      })) {
        this._updateUrl();
      }
    },
    _updateUrl: function() {
      var switchedToThisRouterFromAnother = false;
      if (this !== this.getActiveRouter()) {
        switchedToThisRouterFromAnother = true;
        this.activate(false);
      }
      var viewStateModel = this.context.viewStateModel, state = viewStateModel.get(viewStateModel.CONSTANTS.STATE) || {}, defaultState = viewStateModel.get(viewStateModel.CONSTANTS.DEFAULT_STATE) || {}, taskInfo = this.nextTask.get("task_info"), id = taskInfo.id, uri = "tasks/" + encodeURIComponent(id);
      if (taskInfo.showDocumentsView === true) {
        uri += "/docs";
        if (!switchedToThisRouterFromAnother) {
          _.extend(defaultState, _.pick(state, _.difference(_.keys(state), TaskViewStateMixin.PROPERTY_CONSTANTS.DOCUMENTS_PERSPECTIVE_INIT_URL_PARAMS)));
          viewStateModel.set(viewStateModel.CONSTANTS.DEFAULT_STATE, defaultState, {
            silent: true
          });
          this.addUrlParameters(TaskViewStateMixin.PROPERTY_CONSTANTS.DOCUMENTS_PERSPECTIVE_INIT_URL_PARAMS);
        }
      } else if (!switchedToThisRouterFromAnother) {
        _.extend(defaultState, _.pick(state, _.difference(_.keys(state), TaskViewStateMixin.PROPERTY_CONSTANTS.DETAILS_PERSPECTIVE_INIT_URL_PARAMS)));
        viewStateModel.set(viewStateModel.CONSTANTS.DEFAULT_STATE, defaultState, {
          silent: true
        });
        this.addUrlParameters(TaskViewStateMixin.PROPERTY_CONSTANTS.DETAILS_PERSPECTIVE_INIT_URL_PARAMS);
      }
      this._updatePageTitle(taskInfo.model);
      this.navigate(uri, {
        replace: !!taskInfo.replaceLastUrl
      });
      this.isViewStateModelOwner = true;
      if (switchedToThisRouterFromAnother) {
        this._initializeViewState();
      }
    },
    _updatePageTitle: function(node) {
      if (node) {
        document.title = !node.has("name") ? _.str.sformat(publicLang2.NodeLoadingTitle, node.get("id")) : _.str.sformat(lang.taskPerspectivesPageTitle, node.get("name"), publicLang.ProductName);
      }
    },
    addUrlParameters: function(urlParameters, replace) {
      var urlParams = this.getUrlParametersList() || [];
      if (replace) {
        urlParams = [];
      }
      this.urlParams = _.unique(urlParams.concat(urlParameters));
      var viewStateModel = this.context.viewStateModel;
      viewStateModel.set(viewStateModel.CONSTANTS.URL_PARAMS, this.urlParams);
      return true;
    },
    getBackToTitle: function() {
      var taskInfo = this.nextTask.get("task_info");
      return taskInfo && taskInfo.showDocumentsView === true ? lang.taskDocumentsPerspectiveBackTitle : lang.taskDetailsPerspectiveBackTitle;
    },
    restore: function(routerInfo) {
      var viewStateModel = this.context.viewStateModel, fragment = routerInfo.fragment;
      if (viewStateModel) {
        this.restoring = true;
        viewStateModel.set(viewStateModel.CONSTANTS.URL_PARAMS, routerInfo.urlParam);
        fragment && Backbone.Router.prototype.navigate.call(this, fragment, {
          trigger: true
        });
      } else {
        window.history.back();
      }
    }
  });
  return TaskPerspectivesRouter;
});