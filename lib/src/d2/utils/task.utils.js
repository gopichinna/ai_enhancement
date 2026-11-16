/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "csui/utils/contexts/factories/connector", "csui/utils/commandhelper", "nuc/models/member/member.model", "d2/utils/constants", "dctmw/utils/utils", "d2/utils/user.utils", "d2/utils/server.query.utils", "d2/widgets/metadata/utils/form.converter", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "i18n!d2/utils/impl/nls/lang" ], function($, _, Url, ConnectorFactory, CommandHelper, UserModel, constants, utils, userUtils, serverQueryUtils, MetadataConverter, RestResources, RestLinkrels, lang) {
  "use strict";
  return {
    TASK_CONSTANTS: Object.freeze({
      PROCESS_VARIABLES: "process_variables"
    }),
    getTaskPriorityObject: function(priority) {
      var priorityName, priorityStyle;
      switch (priority) {
       case 1:
        priorityName = lang.priorityNameLowest;
        priorityStyle = "d2-icon-priority-lowest";
        break;

       case 2:
        priorityName = lang.priorityNameLow;
        priorityStyle = "d2-icon-priority-low";
        break;

       case 3:
        priorityName = lang.priorityNameNormal;
        priorityStyle = "d2-icon-priority-medium";
        break;

       case 4:
        priorityName = lang.priorityNameHigh;
        priorityStyle = "d2-icon-priority-high";
        break;

       case 5:
        priorityName = lang.priorityNameHighest;
        priorityStyle = "d2-icon-priority-highest";
        break;

       default:
        break;
      }
      return {
        priority: priority,
        priorityStyle: priorityStyle,
        priorityName: priorityName
      };
    },
    getStatusObject: function(status) {
      var statusName, statusStyle;
      status = status.toUpperCase();
      switch (status) {
       case "PENDING":
        statusName = lang.statusNamePending;
        statusStyle = "d2-icon-status-pending";
        break;

       case "SCHEDULED":
        statusName = lang.statusNameScheduled;
        statusStyle = "d2-icon-status-scheduled";
        break;

       case "RUNNING":
        statusName = lang.statusNameRunning;
        statusStyle = "d2-icon-status-running";
        break;

       case "FINISHED":
        statusName = lang.statusNameFinished;
        statusStyle = "d2-icon-status-finished";
        break;

       case "FUTURE":
        statusName = lang.statusNameFuture;
        statusStyle = "d2-icon-status-future";
        break;

       case "PAUSED":
        statusName = lang.statusNamePaused;
        statusStyle = "d2-icon-status-paused";
        break;

       case "HALTED":
        statusName = lang.statusNameHalted;
        statusStyle = "d2-icon-status-halted";
        break;

       case "ABORTED":
        statusName = lang.statusNameAborted;
        statusStyle = "d2-icon-status-aborted";
        break;

       case "TERMINATED":
        statusName = lang.statusNameTerminated;
        statusStyle = "d2-icon-status-terminated";
        break;

       case "FAULTED":
        statusName = lang.statusNameFaulted;
        statusStyle = "d2-icon-status-faulted";
        break;

       case "ACQUIRED":
        statusName = lang.statusNameAcquired;
        statusStyle = "d2-icon-status-acquired";
        break;

       case "DORMANT":
        statusName = lang.statusNameDormant;
        statusStyle = "d2-icon-status-dormant";
        break;

       case "PENDING AND HALTED":
       case "DPAUSED":
        statusName = lang.statusNamePendingAndPaused;
        statusStyle = "d2-icon-status-d-paused";
        break;

       case "ACQUIRED AND HALTED":
       case "APAUSED":
        statusName = lang.statusNameAcquiredAndPaused;
        statusStyle = "d2-icon-status-a-paused";
        break;

       case "PAUSED AND HALTED":
       case "PPAUSED":
        statusName = lang.statusNamePausedAndPaused;
        statusStyle = "d2-icon-status-p-paused";
        break;

       case "FUTUREABORTED":
        statusName = lang.statusNameFutureAndAborted;
        statusStyle = "d2-icon-status-aborted";
        break;

       case "PENDINGABORTED":
        statusName = lang.statusNamePendingAndAborted;
        statusStyle = "d2-icon-status-aborted";
        break;

       case "ACQUIREDABORTED":
        statusName = lang.statusNameAcquiredAndAborted;
        statusStyle = "d2-icon-status-aborted";
        break;

       case "PAUSEDABORTED":
        statusName = lang.statusNamePausedAndAborted;
        statusStyle = "d2-icon-status-aborted";
        break;

       case "RUNNINGABORTED":
        statusName = lang.statusNameRunningAndAborted;
        statusStyle = "d2-icon-status-aborted";
        break;

       case "EVENT_COMPLETED":
        statusName = lang.statusNameEventCompleted;
        statusStyle = "d2-icon-status-event_completed";
        break;

       default:
        statusName = status;
        break;
      }
      return {
        status: status,
        statusStyle: statusStyle,
        statusName: statusName
      };
    },
    acquireTask: function(task, options) {
      var deferred = $.Deferred(), data = options && options.data, url = CommandHelper.getOriginalActionLink(task, options.signature, RestLinkrels.D2_TASK_STATUS), qParams = {};
      if (!url) {
        url = RestLinkrels.getLink(task.get("links"), RestLinkrels.D2_TASK_STATUS);
        qParams = {
          action: "ACQUIRE"
        };
      }
      if (data && data.forceAcquire !== undefined) {
        qParams["force-acquire"] = data.forceAcquire;
      }
      if (data && data.forceRead !== undefined) {
        qParams["force-read"] = data.forceRead;
      }
      $.ajax(task.connector.extendAjaxOptions({
        url: Url.appendQuery(url, Url.combineQueryString(qParams)),
        type: "PUT",
        success: function(response) {
          deferred.resolve(response);
        },
        error: deferred.reject
      }));
      return deferred.promise();
    },
    checkLockState: function(task) {
      var url = RestLinkrels.getLink(task.get("links"), RestLinkrels.D2_TASK_CHECK_LOCK_STATE);
      if (!url) {
        return $.Deferred().resolve().promise();
      }
      return $.ajax(task.connector.extendAjaxOptions({
        url: url
      }));
    },
    changeReadStatus: function(task, options) {
      var url = RestLinkrels.getLink(task.get("links"), RestLinkrels.SELF), data = {
        properties: {
          is_read: options.read !== false
        }
      };
      return $.ajax(task.connector.extendAjaxOptions({
        url: url,
        type: "PATCH",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify(data)
      }));
    },
    getUserData: function(model, url, filter) {
      var dfd = $.Deferred();
      if (!url) {
        dfd.reject();
      }
      var queryMap = {
        inline: true
      };
      if (filter) {
        queryMap["filter"] = filter;
      }
      url = Url.appendQuery(url, Url.combineQueryString(queryMap));
      $.ajax(model.connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          var options = [], userData = {};
          if (response && response.entries) {
            _.each(response.entries, function(entry) {
              var id = entry["id"];
              if (entry && entry.content && entry.content.properties) {
                var userObject = userUtils.getUserObject(entry.content);
                userData[id] = userObject;
              }
              options.push({
                value: id,
                text: id
              });
            });
          }
          dfd.resolve({
            options: options,
            userData: userData,
            "has-more-records": response["has-more-records"]
          });
        },
        error: dfd.reject
      }));
      return dfd.promise();
    },
    getUserForDigitalSignature: function(model, filter) {
      var url = RestLinkrels.getLink(model.get("links"), RestLinkrels.D2_DIGITAL_SIGNATURE_SIGNEES);
      return this.getUserData(model, url, filter);
    },
    getUserForTaskDelegate: function(task, filter, options) {
      var url = CommandHelper.getOriginalActionLink(task, options.signature, RestLinkrels.D2_TASK_DELEGATE_USER);
      return this.getUserData(task, url, filter);
    },
    getGroupUsers: function(options) {
      var dfd = $.Deferred(), context = options.context, connector = context.getObject(ConnectorFactory), url = Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.GROUPS), options.groupName);
      if (!url) {
        dfd.reject();
      }
      var queryMap = {
        inline: true
      };
      url = Url.appendQuery(url, Url.combineQueryString(queryMap));
      $.ajax(connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          if (response && response.properties) {
            dfd.resolve(response.properties["users_names"]);
          }
        },
        error: dfd.reject
      }));
      return dfd.promise();
    },
    getUsersForChangeSupervisor: function(workflowNode, filter, options) {
      var url = CommandHelper.getOriginalActionLink(workflowNode, options.signature, RestLinkrels.D2_CHANGE_WORKFLOW_SUPERVISOR_USERS);
      return this.getUserData(workflowNode, url, filter);
    },
    performDelegateTask: function(task, options) {
      var dfd = $.Deferred();
      if (!options || !options.data || !options.data["task_delegate_users"]) {
        dfd.reject();
      }
      var qParams = {
        "delegate-user": options.data["task_delegate_users"]
      }, url = CommandHelper.getOriginalActionLink(task, options.signature, RestLinkrels.D2_TASK_DELEGATE, qParams);
      $.ajax(task.connector.extendAjaxOptions({
        url: url,
        type: "PUT",
        success: function(response) {
          dfd.resolve(response);
        },
        error: dfd.reject
      }));
      return dfd.promise();
    },
    performChangeSupervisor: function(workflowNode, options) {
      var dfd = $.Deferred(), data = {}, url = CommandHelper.getOriginalActionLink(workflowNode, options.signature, RestLinkrels.D2_WORKFLOWS), queryMap = {
        inline: true
      };
      url = Url.appendQuery(url, Url.combineQueryString(queryMap));
      if (!options || !options.data || !options.data["change_wf_supervisor"]) {
        dfd.reject();
      }
      data = {
        properties: {
          supervisor_name: options.data["change_wf_supervisor"]
        }
      };
      if (options.data.comment) {
        data["comment"] = options.data.comment;
      }
      $.ajax(workflowNode.connector.extendAjaxOptions({
        url: url,
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        type: "PATCH",
        data: JSON.stringify(data),
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(error) {
          dfd.reject(error);
        }
      }));
      return dfd.promise();
    },
    fetchWorkflowConfig: function(node) {
      var dfd = $.Deferred();
      $.ajax(node.connector.extendAjaxOptions({
        url: RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_WORKFLOW_CONFIG),
        success: function(response) {
          dfd.resolve(response);
        },
        error: dfd.reject
      }));
      return dfd.promise();
    },
    fetchProcessVariableConfig: function(node) {
      var url = RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_WORKFLOW_PROCESS_VARIABLE_DIALOG);
      var dfd = $.Deferred();
      if (url) {
        $.ajax(node.connector.extendAjaxOptions({
          url: url,
          success: function(response) {
            dfd.resolve(response);
          },
          error: dfd.reject
        }));
        return dfd.promise();
      }
    },
    loadWorkflowProcessVariableConfig: function(taskNode) {
      const deferred = $.Deferred(), url = RestLinkrels.getLink(taskNode.get("links"), RestLinkrels.D2_WORKFLOW_PROCESS_VARIABLE_DIALOG);
      if (url && !taskNode.get("process_variables")) {
        this.fetchProcessVariableConfig(taskNode).done(response => {
          var pageContent = response["page-content"];
          var form = MetadataConverter.convertConfig(pageContent);
          var pv = form.propertiesConfig[0].data.contentProcessVariables;
          if (Object.keys(pv).length > 0) {
            taskNode.set("process_variables", response);
          }
          deferred.resolve();
        }).fail(deferred.reject);
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    getUpdatePerformerForm: function(task, options) {
      options = options || {};
      var self = this, dfd = $.Deferred(), url = options.formUrl || RestLinkrels.getLink(task.get("links"), RestLinkrels.D2_TASK_PERFORMERS_DIALOG), qParams = {};
      if (!url) {
        dfd.reject();
      }
      if (options.action) {
        qParams.action = options.action;
      }
      $.ajax(task.connector.extendAjaxOptions({
        url: Url.appendQuery(url, Url.combineQueryString(qParams)),
        success: function(response) {
          if (response && response["user-details"]) {
            response["user-dump"] = self.getUserDump(response["user-details"]);
          }
          dfd.resolve(response);
        },
        error: dfd.reject
      }));
      return dfd.promise();
    },
    getUserDump: function(users) {
      var self = this;
      if (users && users.length > 0) {
        return _.reduce(users, function(map, item) {
          var userObject = self.getUserObject(item);
          map[userObject.id] = userObject;
          return map;
        }, {});
      }
    },
    getUserForTaskUpdatePerformer: function(task, datasourceUrl, filter) {
      return this.getUserData(task, datasourceUrl, filter);
    },
    updateTaskPerformers: function(task, options) {
      var self = this, dfd = $.Deferred(), data = this.getPerformerAliasesData(options);
      if (!data) {
        dfd.reject();
      }
      var url = CommandHelper.getOriginalActionLink(task, options.signature, RestLinkrels.D2_TASK_PERFORMERS);
      $.ajax(task.connector.extendAjaxOptions({
        url: url,
        type: "PATCH",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify(data),
        success: function(response) {
          options.taskPerformersAliasList = self.getTaskPerformerAliasList(response, task);
          dfd.resolve(response);
        },
        error: dfd.reject
      }));
      return dfd.promise();
    },
    getPerformerAliasesData: function(options) {
      if (options && options.data) {
        var performerAliases = [];
        _.each(options.data, function(value, key) {
          var performers = [];
          if (value) {
            if (_.isArray(value)) {
              _.each(value, function(item) {
                performers.push({
                  id: item
                });
              });
            } else {
              performers.push({
                id: value
              });
            }
          }
          performerAliases.push({
            performer_alias_name: key,
            performers: performers
          });
        });
        return {
          performer_aliases: performerAliases
        };
      }
    },
    getUserForWorkflowWidget: function(widgetName, filter, options) {
      var dfd = $.Deferred(), connector = options.context.getObject(ConnectorFactory), url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_WORKFLOW_OVERVIEW_WIDGET_USERS);
      if (!url) {
        dfd.reject();
      }
      var queryMap = {
        "wf-overview-widget-name": widgetName,
        inline: true
      };
      if (filter) {
        queryMap["filter"] = filter;
      }
      url = Url.appendQuery(url, Url.combineQueryString(queryMap));
      $.ajax(connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          var options = [], userData = {};
          if (response && response.entries) {
            _.each(response.entries, function(entry) {
              var id = entry["id"];
              if (entry && entry.content) {
                if (!entry.content.properties) {
                  entry.content.properties = _.pick(entry.content, "r_object_id", "user_name", "user_address", "r_is_group");
                }
                var userObject = userUtils.getUserObject(entry.content);
                userData[id] = userObject;
              }
              options.push({
                value: id,
                text: id
              });
            });
          }
          dfd.resolve({
            options: options,
            userData: userData,
            "has-more-records": response["has-more-records"]
          });
        },
        error: dfd.reject
      }));
      return dfd.promise();
    },
    getUserObject: function(userResponse) {
      return userUtils.getUserObject(userResponse);
    },
    getTaskPerformerAliasList: function(response, task) {
      var self = this, taskPerformersAliasList = [];
      if (response && response.entries) {
        taskPerformersAliasList = _.map(response.entries, function(entry) {
          var taskPerformer = {};
          if (entry && entry.content) {
            taskPerformer = _.extend({
              id: entry.id,
              type: constants.Types.TASK_PERFORMER,
              type_name: entry.content["performer_alias_input_type"],
              performer_name: entry.content["performer_alias_name"],
              performer_label: entry.content["performer_alias_label"],
              performer_type: entry.content["performer_alias_input_type_label"],
              d2_performer_value: self.getTaskPerformersString(entry.content.performers)
            }, entry.content);
          }
          var dialogUrl = taskPerformer.links && RestLinkrels.getLink(taskPerformer.links, RestLinkrels.D2_TASK_PERFORMERS_DIALOG), updatePerformersAction = task && task.actions && task.actions.findWhere({
            signature: "D2-WorkflowUpdatePerformers"
          });
          if (dialogUrl && updatePerformersAction) {
            taskPerformer.actions = [ {
              signature: updatePerformersAction.get("signature"),
              commandData: updatePerformersAction.get("commandData"),
              actionProperties: updatePerformersAction.get("actionProperties"),
              csuiNonPromotedAction: true,
              links: []
            } ];
          }
          return taskPerformer;
        });
      }
      return taskPerformersAliasList;
    },
    getTaskPerformersString: function(performers) {
      var performerList = [];
      _.each(performers, function(item) {
        var performerInfo = item.id;
        if (item.properties && item.properties["user_address"]) {
          performerInfo = _.str.sformat(lang.userInfo, performerInfo, item.properties["user_address"]);
        }
        performerList.push(performerInfo);
      });
      return performerList.join(", ");
    },
    resolveUserDetails: function(node, userAttibutes) {
      var deffered = $.Deferred(), userData = {}, participants = [];
      _.forEach(userAttibutes, function(participant) {
        participants.push(node.get(participant));
      });
      participants = _.uniq(_.compact(participants));
      var promises = _.map(participants, function(participant) {
        var userModel = new UserModel({
          id: participant
        }), dfd = $.Deferred();
        userModel.fetch().always(function() {
          var id = userModel.get("id");
          userData[id] = _.extend({
            id: id,
            links: userModel.get("links")
          }, userModel.get("properties"));
          dfd.resolve();
        }.bind(this));
        return dfd.promise();
      });
      $.whenAll.apply($, promises).done(function() {
        node.set("userData", userData, {
          silent: true
        });
        deffered.resolve();
      });
      return deffered.promise();
    }
  };
});