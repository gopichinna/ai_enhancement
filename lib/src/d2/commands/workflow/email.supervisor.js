/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/dialogs/modal.alert/modal.alert", "csui/models/command", "csui/utils/commandhelper", "nuc/utils/url", "csui/utils/contexts/factories/connector", "d2/controls/globalmessage/globalmessage", "d2/models/workflow/workflow", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/utils/user.utils", "d2/commands/node.progress.command", "i18n!d2/commands/nls/localized.strings" ], function(_, $, Backbone, ModalAlert, CommandModel, CommandHelper, Url, ConnectorFactory, GlobalMessage, WorkflowModel, constants, widgetConstants, RestResources, RestLinkrels, utils, UserUtils, NodeProgressCommand, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-WorkflowEmailSupervisor",
      command_key: "D2-WorkflowEmailSupervisor",
      name: lang.CommandNameEmailSupervisor,
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
      options.workflowModel = status.originatingView && status.originatingView.workflowModel;
      options.widgetName = status && status.collection && status.collection.widgetName;
      options.widgetType = status && status.collection && status.collection.widgetType;
      this._blockAction(status);
      this._getWorkflowSupervisorEmailAddress(node, options).done(function(emailAddressList) {
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
    _getWorkflowSupervisorEmailAddress: function(node, options) {
      var self = this, deferred = $.Deferred();
      self._getNodeForAction(node, options).done(function(node) {
        self._getWorkflowSupervisorName(node, options).done(function(supervisorName) {
          if (supervisorName) {
            self._getEmailAdderessList(supervisorName, options).done(function(emailAddressList) {
              deferred.resolve(emailAddressList);
            }).fail(deferred.reject);
          } else {
            deferred.reject(lang.EmailSupervisorNoSupervisorNameError);
          }
        }).fail(deferred.reject);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _getWorkflowSupervisorName: function(node, options) {
      var deferred = $.Deferred();
      if (node.get("type") === constants.Types.TASK) {
        if (options.workflowModel && options.workflowModel.get("type") === constants.Types.WORKFLOW) {
          deferred.resolve(options.workflowModel.get("supervisor_name"));
        } else {
          var newNode = node.clone();
          newNode.fetch().done(function() {
            deferred.resolve(newNode.get("supervisor_name"));
          }).fail(deferred.reject);
        }
      } else {
        deferred.resolve(node.get("supervisor_name"));
      }
      return deferred.promise();
    },
    _getEmailAdderessList: function(userName, options) {
      var deferred = $.Deferred();
      UserUtils.getUserDetails(userName, options.context).done(function(userObject) {
        if (userObject["user_address"]) {
          deferred.resolve([ userObject["user_address"] ]);
        } else if (userObject["r_is_group"] === true) {
          UserUtils.getUsersInGroup([ userName ], options.context, true).done(function(userObjects) {
            var emailAddressList = [];
            if (userObjects && userObjects.length > 0) {
              emailAddressList = _.pluck(userObjects, "user_address");
            }
            if (emailAddressList && emailAddressList.length > 0) {
              deferred.resolve(emailAddressList);
            } else {
              deferred.reject(lang.EmailLinkNoEmailFoundError);
            }
          }).fail(deferred.reject);
        }
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _getNodeForAction: function(node, options) {
      var deferred = $.Deferred(), connector = options.context.getObject(ConnectorFactory);
      if (node.get("rObjectType") === "d2c_workflow_tracker" || node.get("r_object_type") === "d2c_workflow_tracker") {
        var defaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), workflow = new WorkflowModel({
          id: node.get("id")
        }, {
          connector: connector,
          widgetType: widgetConstants.D2.WORKFLOWS,
          widgetName: defaultWidgets[widgetConstants.DEFAULT.ALL_WORKFLOWS]
        });
        workflow.fetch().done(function() {
          deferred.resolve(workflow);
        }).fail(deferred.reject);
      } else {
        deferred.resolve(node);
      }
      return deferred.promise();
    },
    _openNewHref: function(newHref) {
      if (newHref.length > 2046) {
        GlobalMessage.showMessage("error", lang.EmailLinkCommandFailedWithTooMuchEmailMessage);
      } else {
        utils.launchUrlInIframe(newHref);
      }
    },
    _invokeMailTo: function(emailAddressList) {
      emailAddressList = _.uniq(emailAddressList);
      var currentUser = RestResources.getCurrentUser(), currentEmailAddress = currentUser.get("business_email");
      if (currentEmailAddress) {
        var index = emailAddressList.indexOf(currentEmailAddress);
        if (emailAddressList.length === 1 && index === 0) {
          GlobalMessage.showMessage("error", lang.EmailLinkSameUserError);
          return;
        }
        if (index > -1) {
          emailAddressList.splice(index, 1);
        }
      }
      var emailAddress = emailAddressList.join(";"), newHref = "mailto:?to=" + encodeURIComponent(emailAddress) + "&subject=";
      this._openNewHref(newHref);
    },
    _handleError: function(error) {
      var msg;
      if (_.isString(error)) {
        msg = error;
      } else {
        error = utils.parseAjaxError(error);
        msg = error && error.message;
      }
      if (!msg) {
        msg = lang.EmailLinkGenericError;
      }
      GlobalMessage.showMessage("error", msg);
    },
    _blockAction: function(status) {
      status.originatingView && status.originatingView.blockActions && status.originatingView.blockActions();
    },
    _unblockAction: function(status) {
      status.originatingView && status.originatingView.unblockActions && status.originatingView.unblockActions();
    }
  });
});