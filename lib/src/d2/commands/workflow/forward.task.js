/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "csui/utils/commandhelper", "csui/dialogs/modal.alert/modal.alert", "d2/commands/node.progress.command", "d2/models/workflow/workflow.audits", "d2/utils/constants", "d2/utils/rest.linkrels", "d2/utils/task.utils", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, Backbone, Url, CommandHelper, ModalAlert, NodeProgressCommand, WorkflowAuditCollection, constants, RestLinkrels, taskUtils, utils, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-ForwardTask",
      command_key: "D2-ForwardTask",
      name: lang.CommandNameForwardTask,
      scope: "single"
    },
    PROPERTIES: Object.freeze({
      ACTION: "FORWARD",
      ACTION_LABEL: "task_accept_label",
      DEFAULT_ACTION_LABEL: lang.DefaultForwardLabel,
      NEXT_TASKS: "next_forward_activities",
      SIGNOFF_REQUIRED: "signoff_required_for_forward",
      SIGNOFF_EACH_DOCUMENT: "signoff_each_document",
      INTENTION_REQUIRED: "is_intention_required_for_forward",
      INTENTION_DICTIONARY: "D2_TASK_INTENTION_DICTIONARY_FORWARD",
      MANDATORY_COMMENT: "mandatory_forward_comment",
      PROPERTY_PAGE: "D2_TASK_PROPERTY_PAGE_FORWARD",
      DISPLAY_DIALOG: "always_display_dialog",
      MAX_NEXT_TASKS: "maximum_allowed_transitions",
      SOURCE: "TASK",
      INTENTION_DICTIONARY_NAME: "intention_dictionary_forward",
      DIGITAL_SIGN_REQUIRED: "digital_sign_required",
      DRAFT_STATUS: "DRAFT"
    }),
    preProcess: function(status, options) {
      status.deleteBlockAction = true;
      options.suppressProgress = true;
      this._blockActions(status.originatingView);
      return $.Deferred().resolve().promise();
    },
    _getWidgetConfig: function(options) {
      var widgetConfig = {}, collection = options.originatingView && options.originatingView.collection || options.collection;
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
      }
      return widgetConfig;
    },
    _executeAction: function(node, options) {
      var url = CommandHelper.getOriginalActionLink(node, this.get("signature"), RestLinkrels.D2_TASK_STATUS);
      options.payload = options.payload || {};
      if (!_.has(options.payload, this.PROPERTIES.NEXT_TASKS) && node.get(this.PROPERTIES.MAX_NEXT_TASKS)) {
        options.payload[this.PROPERTIES.NEXT_TASKS] = _.pluck(node.get(this.PROPERTIES.NEXT_TASKS), "activity_id");
      }
      return $.ajax(node.connector.extendAjaxOptions({
        url: url,
        type: "PUT",
        contentType: constants.MediaTypes.DCTM_JSON,
        data: JSON.stringify(options.payload)
      }));
    },
    _checkLifeCycleConsistency: function(node, options) {
      if (this._getLifeCycleCheckLink(node) && (!options.beforeDialogCheck || options.beforeDialogCheck && !this._nextTasksEditable(node))) {
        var deferred = $.Deferred(), url = this._getLifeCycleCheckLink(node), nextSelectedTasks = options.nextTasks || _.pluck(node.get(this.PROPERTIES.NEXT_TASKS), "activity_id"), qParams = {
          action: this.PROPERTIES.ACTION
        };
        nextSelectedTasks && nextSelectedTasks.length && _.extend(qParams, {
          "next-activity-ids": nextSelectedTasks
        });
        url = Url.appendQuery(url, Url.combineQueryString(qParams));
        $.ajax(node.connector.extendAjaxOptions({
          url: url,
          type: "GET",
          contentType: constants.MediaTypes.DCTM_JSON,
          success: function(response) {
            if (response.status === "ERROR") {
              deferred.reject(response.message);
            } else {
              deferred.resolve();
            }
          },
          error: deferred.reject
        }));
        return deferred.promise();
      }
      return $.Deferred().resolve().promise();
    },
    _fetchDigitalSignatureConfig: function(node) {
      var url = RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_TASK_DIGITAL_SIGNATURE_CONFIG);
      if (!node.get(this.PROPERTIES.DIGITAL_SIGN_REQUIRED)) {
        return $.Deferred().resolve().promise();
      }
      return $.ajax(node.connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          node.digitalSignatureModel = new Backbone.Model(response.properties);
          node.digitalSignatureModel.connector = node.connector;
          node.digitalSignatureModel.set("links", response.links);
        }
      }));
    },
    _checkTaskConfig: function(node, options) {
      return taskUtils.checkLockState(node).then(function() {
        return this._checkLifeCycleConsistency(node, _.extend({
          beforeDialogCheck: true
        }, options));
      }.bind(this));
    },
    _validateTaskState: function(node, options) {
      var deferred = $.Deferred();
      if (node.get("delete_flag")) {
        options.hideSuccessMessage = true;
        node.externallyCompleted = true;
        return deferred.reject("complete").promise();
      } else if (node.get("task_state") === "dormant") {
        taskUtils.acquireTask(node, _.extend({
          signature: "D2-AcquireTask"
        }, options)).done(function(response) {
          if (response && response.properties && response.properties.r_object_id) {
            var oldId = node.get("id");
            node.set("id", response.properties.r_object_id);
            CommandHelper.refreshNode(node, this._getWidgetConfig(options)).done(function() {
              if (!utils.isMobile()) {
                node.trigger("d2:task:acquired", oldId, {
                  id: node.get("id"),
                  name: node.get("name")
                });
              }
              deferred.resolve();
            }.bind(this)).fail(deferred.reject);
          } else {
            deferred.reject("New task id not present in response.");
          }
        }.bind(this)).fail(deferred.reject);
      } else {
        return deferred.resolve().promise();
      }
      return deferred.promise();
    },
    doAction: function(node, options) {
      var me = this, opts = utils.isMobile() ? {
        force: true,
        cache: false
      } : {}, nodeClone = node.clone();
      return nodeClone.fetch(opts).then(function() {
        node.set(this.attributes, {
          silent: true
        });
        return me._validateTaskState(node, options).then(() => taskUtils.loadWorkflowProcessVariableConfig(node));
      }.bind(nodeClone)).then(function() {
        return me._checkTaskConfig(node, options);
      }).then(function() {
        return me._fetchDigitalSignatureConfig(node, options);
      }).then(function() {
        return me._fetchDigitalSignatureStatus(node);
      }).then(function() {
        if (me._wizardRequired(node, options)) {
          if (me._evaluateTaskPerformersCondition(node)) {
            return taskUtils.getUpdatePerformerForm(node, {
              action: me.PROPERTIES.ACTION
            }).then(function(performersForm) {
              options.performersForm = performersForm;
              return me._openWizard(node, options);
            });
          } else {
            return me._openWizard(node, options);
          }
        } else {
          return me._executeAction(node, options);
        }
      }).then(function() {
        me._unblockActions(options.originatingView);
      }).catch(function(xhr, message, statusText) {
        me._unblockActions(options.originatingView);
        if (xhr === "complete") {
          return $.Deferred().resolve().promise();
        } else {
          return $.Deferred().reject(xhr, message, statusText).promise();
        }
      });
    },
    handleResults: function(results, options) {
      var collection = options.collection || options.originatingView && options.originatingView.collection;
      if (collection instanceof WorkflowAuditCollection) {
        var successful = _.find(results, function(result) {
          return result instanceof Backbone.Model;
        });
        if (successful) {
          return collection.fetch({
            reload: true,
            reset: true
          });
        } else {
          return $.Deferred.resolve();
        }
      }
      _.each(results, function(result) {
        if (result instanceof Backbone.Model) {
          result.trigger("d2:task:completed", {
            id: result.get("id"),
            externallyCompleted: result.externallyCompleted === true
          });
          if (collection) {
            var task = collection.findWhere({
              id: result.get("id")
            });
            task && collection.remove(task);
          }
        }
      });
    },
    _wizardRequired: function(node) {
      if (this._evaluateManageDialogCondition(node) || node.get(taskUtils.TASK_CONSTANTS.PROCESS_VARIABLES) || this._getPropertyPageLink(node) || node.get(this.PROPERTIES.SIGNOFF_REQUIRED) || this.checkDigitalSignAllowed(node)) {
        return true;
      }
      return false;
    },
    _evaluateManageDialogCondition: function(node) {
      if (node.get(this.PROPERTIES.DISPLAY_DIALOG) || this._nextTasksEditable(node) || node.get(this.PROPERTIES.MANDATORY_COMMENT) || this._evaluateTaskPerformersCondition(node)) {
        return true;
      }
      return false;
    },
    _evaluateTaskPerformersCondition: function(node) {
      return !!(node.get("participants_modifiable") && node.get("participants_modifiable").length);
    },
    _getPropertyPageLink: function(node) {
      return RestLinkrels.getLink(node.get("links"), RestLinkrels[this.PROPERTIES.PROPERTY_PAGE]);
    },
    _getLifeCycleCheckLink: function(node) {
      return RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_TASK_LIFECYCLE_CHECKER);
    },
    _nextTasksEditable: function(node) {
      return !!(node.get(this.PROPERTIES.MAX_NEXT_TASKS) && node.get(this.PROPERTIES.NEXT_TASKS).length !== 1);
    },
    _openWizard: function(node, options) {
      var deferred = $.Deferred(), me = this;
      require([ "d2/dialogs/task.complete/task.complete.dialog" ], function(TaskCompleteDialog) {
        var dialog = new TaskCompleteDialog(_.extend({
          command: me,
          node: node
        }, options));
        dialog.show().done(function(data) {
          data.digitalSignatureOptions.originatingView = options.originatingView;
          me._performDigitalSign(data.node, data.digitalSignatureOptions).done(function() {
            me._blockActions(options.originatingView);
            me._executeAction(data.node, _.extend({
              payload: data.masterPayload
            }, data.options)).always(function() {}.bind(this)).done(function() {
              me._unblockActions(options.originatingView);
              deferred.resolve();
            }).fail(deferred.reject);
          }).fail(deferred.reject);
        }).fail(function(err) {
          if (err === "cancel") {
            options.hideFailureMessage = true;
            deferred.reject(" ");
          } else {
            deferred.reject.apply(deferred, arguments);
          }
        });
      }, deferred.reject);
      return deferred.promise();
    },
    _performDigitalSign: function(node, digitalSignOptions) {
      var deferred = $.Deferred();
      if (!this.checkDigitalSignAllowed(node)) {
        deferred.resolve();
      } else {
        require([ "nuc/models/nodes", !utils.isMobile() ? "d2/commands/digital.signature" : "d2mob/commands/mobile/mobile.digital.signature" ], function(NodeCollection, DigitalSignatureLoginCommand) {
          var status = {
            nodes: new NodeCollection([ node ])
          };
          var command = new DigitalSignatureLoginCommand();
          if (command.enabled(status, digitalSignOptions)) {
            command.execute(status, digitalSignOptions).done(function(data) {
              deferred.resolve(data);
            }).fail(function(error) {
              console.log(error);
              console.log("error has occured");
              deferred.reject();
            });
          } else {
            deferred.reject();
          }
        }, deferred.reject);
      }
      return deferred.promise();
    },
    _blockActions: function(view) {
      CommandHelper.blockD2ViewActions(view);
    },
    _unblockActions: function(view) {
      CommandHelper.unblockD2ViewActions(view);
    },
    getMessageOptions: function() {
      return {
        oneFilePending: lang.CompletingOneTask,
        oneFileSuccess: lang.CompleteOneTaskSuccessMessage,
        oneFileFailure: lang.CompleteOneTaskFailMessage,
        actionType: "FORWARD_TASK"
      };
    },
    checkDigitalSignAllowed: function(node) {
      if (node.get(this.PROPERTIES.DIGITAL_SIGN_REQUIRED)) {
        if (node.digitalSignatureModel && node.digitalSignatureModel.get("signStatus") && node.digitalSignatureModel.get("signStatus").get("signature_status") && node.digitalSignatureModel.get("signStatus").get("signature_status") !== "DRAFT") {
          return false;
        } else {
          return true;
        }
      }
      return false;
    },
    _fetchDigitalSignatureStatus: function(node) {
      var deferred = $.Deferred(), self = this;
      if (node.digitalSignatureModel) {
        require([ !utils.isMobile() ? "d2/commands/digital.signature" : "d2mob/commands/mobile/mobile.digital.signature" ], function(DigitalSignatureLoginCommand) {
          var command = new DigitalSignatureLoginCommand();
          command.checkDigitalSignatureStatus(node).done(function() {
            if (node.get("digital_sign_required")) {
              if (node.digitalSignatureModel && node.digitalSignatureModel.get("signStatus") && node.digitalSignatureModel.get("signStatus").get("signature_status") && node.digitalSignatureModel.get("signStatus").get("signature_status") !== "DRAFT") {
                ModalAlert.showInformation(function(data) {
                  if (data) {
                    deferred.resolve();
                  } else {
                    deferred.reject();
                  }
                }, lang.DigitalSignatureStatusMessageErrorMessage, lang.DigitalSignatureStatusErrorTitle, {
                  buttons: {
                    showYes: self.PROPERTIES.ACTION === "FORWARD",
                    showNo: false,
                    showCancel: true,
                    labelYes: lang.DigitalSignatureStatusMessageDialogLabelYes
                  }
                });
              } else {
                deferred.resolve();
              }
            }
          }).fail(deferred.reject);
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    }
  });
});