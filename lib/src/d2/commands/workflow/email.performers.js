/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/dialogs/modal.alert/modal.alert", "csui/models/command", "csui/utils/commandhelper", "nuc/utils/url", "csui/utils/contexts/factories/connector", "d2/controls/globalmessage/globalmessage", "d2/widgets/metadata/panels/task.performers/task.performer.collection", "d2/models/workflow/workflow.audits", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/constants", "dctmw/utils/utils", "d2/utils/user.utils", "d2/commands/node.progress.command", "d2/commands/workflow/email.supervisor", "i18n!d2/commands/nls/localized.strings" ], function(_, $, Backbone, ModalAlert, CommandModel, CommandHelper, Url, ConnectorFactory, GlobalMessage, TaskPerformersCollection, WorkflowAuditCollection, RestResources, RestLinkrels, constants, utils, UserUtils, NodeProgressCommand, EmailSupervisorCommand, lang) {
  "use strict";
  return EmailSupervisorCommand.extend({
    defaults: {
      signature: "D2-WorkflowEmailPerformers",
      command_key: "D2-WorkflowEmailPerformers",
      name: lang.CommandNameEmailPerformer,
      scope: "single"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status);
      return CommandModel.prototype.enabled.apply(this, arguments) && node.get("activity_type") !== constants.WorkflowActivityType.AUTOMATIC;
    },
    execute: function(status, options) {
      var self = this, deferred = $.Deferred(), node = CommandHelper.getJustOneNode(status);
      options = options || {};
      options.context = status.context;
      options.widgetName = status && status.collection && status.collection.widgetName;
      options.widgetType = status && status.collection && status.collection.widgetType;
      this._blockAction(status);
      this._getWorkflowPerformersEmailAddress(node, options).done(function(emailAddressList) {
        self._invokeMailTo(emailAddressList);
        self._unblockAction(status);
        deferred.resolve();
      }).fail(function(error) {
        self._handleError(error);
        self._unblockAction(status);
        deferred.reject();
      });
      return deferred.promise();
    },
    _updateLinksForNode: function(node) {
      var selfLinkMeta = RestLinkrels._getLinkMeta(node.get("links"), RestLinkrels.SELF), links = [ {
        rel: RestLinkrels.D2_TASK_PERFORMERS,
        href: Url.combine(selfLinkMeta.href, "workflow-performers")
      }, {
        rel: RestLinkrels.D2_WORKFLOW_TASKS,
        href: Url.combine(selfLinkMeta.href, "d2-report-tasks")
      } ];
      var nodeLinks = node.get("links");
      if (!nodeLinks) {
        nodeLinks = [];
      }
      nodeLinks = nodeLinks.concat(links);
      node.set("links", nodeLinks, {
        silent: true
      });
    },
    _getWorkflowPerformersEmailAddress: function(node, options) {
      var self = this, deferred = $.Deferred();
      self._getNodeForAction(node, options).done(function(node) {
        self._updateLinksForNode(node);
        if (node.get("assignee")) {
          self._getEmailAdderessList(node.get("assignee"), options).done(deferred.resolve).fail(deferred.reject);
        } else if (node.get("performer_names")) {
          self._getEmailAddressListForTask(node).done(deferred.resolve).fail(deferred.reject);
        } else {
          self._getEmailAddressListForWorkflow(node, options).done(deferred.resolve).fail(deferred.reject);
        }
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _getEmailAddressListForWorkflow: function(node, options) {
      var self = this, deferred = $.Deferred();
      self._getWorkflowPerformersFromAlias(node, options).done(function(workflowAliasMap, workflowUserMap) {
        self._getWorkflowPerformersFromTasks(node, options, workflowAliasMap).done(function(workflowPerformerList) {
          if (workflowPerformerList && workflowPerformerList.length > 0) {
            self._getEmailAddressForPerformers(workflowPerformerList, workflowUserMap, options).done(function(resolvedEmailAddressList) {
              if (resolvedEmailAddressList && resolvedEmailAddressList.length > 0) {
                deferred.resolve(resolvedEmailAddressList);
              } else {
                deferred.reject(lang.EmailLinkNoEmailFoundError);
              }
            }).fail(deferred.reject);
          } else {
            deferred.reject(lang.EmailPerformerErrorNoPerformer);
          }
        }).fail(deferred.reject);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _getEmailAddressListForTask: function(node, options) {
      var self = this, deferred = $.Deferred();
      self._getWorkflowPerformersFromAlias(node, options).done(function(workflowAliasMap, workflowUserMap) {
        var workflowPerformerList = self._getWorkflowPerformersFromTaskAlias(node, workflowAliasMap);
        if (workflowPerformerList && workflowPerformerList.length > 0) {
          self._getEmailAddressForPerformers(workflowPerformerList, workflowUserMap, options).done(function(resolvedEmailAddressList) {
            if (resolvedEmailAddressList && resolvedEmailAddressList.length > 0) {
              deferred.resolve(resolvedEmailAddressList);
            } else {
              deferred.reject(lang.EmailLinkNoEmailFoundError);
            }
          }).fail(deferred.reject);
        } else {
          deferred.reject(lang.EmailPerformerErrorNoPerformer);
        }
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _getEmailAddressForPerformers: function(workflowPerformerList, workflowUserMap, options) {
      var deferred = $.Deferred(), resolvedEmailAddressList = [], unresolvedUserList = [];
      _.each(workflowPerformerList, function(workflowPerformer) {
        if (workflowPerformer) {
          var userObj = workflowUserMap[workflowPerformer];
          if (userObj) {
            if (userObj["isExternal"] && userObj["id"]) {
              resolvedEmailAddressList.push(userObj["id"]);
            } else if (userObj["user_address"]) {
              resolvedEmailAddressList.push(userObj["user_address"]);
            } else if (userObj["r_is_group"] === true) {
              unresolvedUserList.push(userObj["user_name"]);
            }
          } else {
            unresolvedUserList.push(workflowPerformer);
          }
        }
      });
      if (unresolvedUserList.length > 0) {
        this._getUnresolvedUserEmailAddress(unresolvedUserList, options).done(function(resolvedUserEmailAddressList) {
          resolvedEmailAddressList = resolvedEmailAddressList.concat(resolvedUserEmailAddressList);
          deferred.resolve(resolvedEmailAddressList);
        }).fail(deferred.reject);
      } else {
        deferred.resolve(resolvedEmailAddressList);
      }
      return deferred.promise();
    },
    _getUnresolvedUserEmailAddress: function(unresolvedUserList, options) {
      var self = this, deferred = $.Deferred(), resolvedEmailAddressList = [], unresolvedGroupList = [], connector = options.context.getObject(ConnectorFactory);
      unresolvedUserList = _.uniq(unresolvedUserList);
      var batchPayload = _.map(unresolvedUserList, function(unresolvedUser) {
        return {
          id: unresolvedUser,
          request: {
            method: "GET",
            uri: Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.USERS), unresolvedUser)
          }
        };
      });
      utils.makeBatchAjaxCall({
        connector: connector,
        operations: batchPayload,
        continueOnError: false
      }).done(function(successful, failed) {
        if (failed && failed.length > 0) {
          deferred.reject();
          return;
        }
        if (successful && successful.length > 0) {
          _.each(successful, function(result) {
            if (result && result.output && result.output.properties) {
              if (result.output.properties["user_address"]) {
                resolvedEmailAddressList.push(result.output.properties["user_address"]);
              } else if (result.output.properties["r_is_group"] === true) {
                unresolvedGroupList.push(result.output.properties["user_name"]);
              }
            }
          });
        }
        if (unresolvedGroupList.length > 0) {
          self._getUnresolvedGroupUsers(unresolvedGroupList, options).done(function(groupUsersEmailAddressList) {
            resolvedEmailAddressList = resolvedEmailAddressList.concat(groupUsersEmailAddressList);
            deferred.resolve(resolvedEmailAddressList);
          }).fail(deferred.reject);
        } else {
          deferred.resolve(resolvedEmailAddressList);
        }
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _getUnresolvedGroupUsers: function(unresolvedGroupList, options) {
      var deferred = $.Deferred(), resolvedEmailAddressList = [], connector = options.context.getObject(ConnectorFactory);
      unresolvedGroupList = _.uniq(unresolvedGroupList);
      var batchPayload = _.map(unresolvedGroupList, function(unresolvedGroup) {
        var url = Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.GROUPS), unresolvedGroup, "users"), queryMap = {
          inline: true
        };
        queryMap["items-per-page"] = 1e3;
        url = Url.appendQuery(url, Url.combineQueryString(queryMap));
        return {
          id: unresolvedGroup,
          request: {
            method: "GET",
            uri: url
          }
        };
      });
      utils.makeBatchAjaxCall({
        connector: connector,
        operations: batchPayload,
        continueOnError: false
      }).done(function(successful, failed) {
        if (failed && failed.length > 0) {
          deferred.reject();
          return;
        }
        if (successful && successful.length > 0) {
          _.each(successful, function(result) {
            if (result && result.output && result.output.entries && result.output.entries.length > 0) {
              _.each(result.output.entries, function(groupUser) {
                if (groupUser && groupUser.content && groupUser.content.properties && groupUser.content.properties["user_address"]) {
                  resolvedEmailAddressList.push(groupUser.content.properties["user_address"]);
                }
              });
            }
          });
        }
        deferred.resolve(resolvedEmailAddressList);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _getWorkflowPerformersFromAlias: function(node, options) {
      var deferred = $.Deferred(), taskPerformerCollection = new TaskPerformersCollection(null, {
        node: node,
        wfWidgetName: options.widgetName
      });
      taskPerformerCollection.fetch().done(function(performerAliasList) {
        var workflowAliasMap = {}, workflowUserMap = {};
        _.each(performerAliasList, function(performerAlias) {
          var performerMap = {}, aliasId = performerAlias.get("id"), isExternal = performerAlias.get("is_external_alias"), performers = performerAlias.get("performers");
          if (performers && performers.length > 0) {
            _.each(performers, function(performer) {
              var userObj, key;
              if (isExternal === true && performer["id"]) {
                key = performer["id"];
                userObj = {
                  id: performer["id"],
                  isExternal: true
                };
              } else if (performer.properties && performer.properties["user_name"]) {
                key = performer.properties["user_name"];
                userObj = performer.properties;
              }
              if (userObj) {
                performerMap[key] = userObj;
              }
            });
            workflowAliasMap[aliasId] = performerMap;
            _.extend(workflowUserMap, performerMap);
          }
        });
        deferred.resolve(workflowAliasMap, workflowUserMap);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _getWorkflowPerformersFromTasks: function(node, options, workflowAliasMap) {
      var self = this, deferred = $.Deferred();
      var workflowAuditCollection = new WorkflowAuditCollection(null, {
        node: node,
        fetchWfEvents: false,
        widgetName: options.widgetName,
        widgetType: options.widgetType
      });
      workflowAuditCollection.fetch().done(function(wfAuditList) {
        var workflowPerformerList = [];
        _.each(wfAuditList, function(wfAudit) {
          var performersForTask = self._getWorkflowPerformersFromTaskAlias(wfAudit, workflowAliasMap);
          workflowPerformerList = workflowPerformerList.concat(performersForTask);
        });
        deferred.resolve(workflowPerformerList);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _getWorkflowPerformersFromTaskAlias: function(wfAudit, workflowAliasMap) {
      var workflowPerformerList = [], activityType = wfAudit.get("activity_type"), assignee = wfAudit.get("assignee"), taskState = wfAudit.get("task_state"), performerNames = wfAudit.get("performer_names");
      if (activityType === constants.WorkflowActivityType.MANUAL) {
        if (assignee && taskState !== constants.WorkflowTaskState.FUTURE) {
          workflowPerformerList.push(assignee);
        } else if (performerNames && performerNames.length > 0) {
          _.each(performerNames, function(performer) {
            if (performer.indexOf("%") === 0) {
              var aliasName = performer.substring(1, performer.length);
              if (workflowAliasMap && workflowAliasMap[aliasName]) {
                var aliasPerformers = _.keys(workflowAliasMap[aliasName]);
                workflowPerformerList = workflowPerformerList.concat(aliasPerformers);
              }
            } else {
              workflowPerformerList.push(performer);
            }
          });
        }
      }
      return workflowPerformerList;
    }
  });
});