/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/commandhelper", "nuc/utils/url", "csui/dialogs/modal.alert/modal.alert", "d2/commands/node.progress.command", "d2/models/workflow/task", "d2/models/workflow/workflow.audits", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/utils/task.utils", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, Backbone, CommandHelper, Url, Alert, NodeProgressCommand, TaskModel, WorkflowAuditCollection, RestLinkrels, constants, taskUtils, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-WorkflowUpdatePerformers",
      command_key: "D2-WorkflowUpdatePerformers",
      name: lang.CommandNameUpdatePerformer,
      scope: "single"
    },
    getMessageOptions: function(options) {
      return {
        oneFilePending: _.str.sformat(lang.UpdatePerformerPendingMessage, options.task.get("name")),
        oneFileSuccess: _.str.sformat(lang.UpdatePerformerSuccessMessage, options.task.get("name")),
        oneFileFailure: _.str.sformat(lang.UpdatePerformerFailMessage, options.task.get("name"))
      };
    },
    preProcess: function(status, options) {
      var dfd = $.Deferred(), model = CommandHelper.getJustOneNode(status);
      if (model.get("type") === constants.Types.TASK_PERFORMER) {
        options.task = model.collection.node;
        if (model.has("links")) {
          options.formUrl = RestLinkrels.getLink(model.get("links"), RestLinkrels.D2_TASK_PERFORMERS_DIALOG);
        }
      } else {
        options.task = model;
        options.formUrl = CommandHelper.getOriginalActionLink(options.task, this.get("signature"), RestLinkrels.D2_TASK_PERFORMERS_DIALOG);
      }
      options.context = status.context;
      options.originatingView = status.originatingView;
      this.showUpdatePerformerDialog(status, options).done(function() {
        dfd.resolve();
      }).fail(dfd.reject);
      return dfd.promise();
    },
    doAction: function(task, options) {
      options.signature = this.get("signature");
      return taskUtils.updateTaskPerformers(options.task, options);
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
        if (result.get("type") === constants.Types.TASK_PERFORMER) {
          if (options && options.taskPerformersAliasList) {
            var updatedAlias = _.findWhere(options.taskPerformersAliasList, {
              id: result.get("id")
            });
            updatedAlias && result.set(updatedAlias);
          }
        } else if (result.get("type") === constants.Types.WORKFLOW) {
          result.trigger("d2:workflow:update:performers", result);
        } else {
          result.trigger("d2:task:update:performers", options.taskPerformersAliasList);
        }
      });
    },
    showUpdatePerformerDialog: function(status, options) {
      var self = this, dfd = $.Deferred();
      self._blockOriginatingView(status);
      taskUtils.getUpdatePerformerForm(options.task, options).done(function(formReponse) {
        self._unblockOriginatingView(status);
        options.formResponse = formReponse;
        self._showUpdatePerformerWizard(status, options).done(function() {
          dfd.resolve();
        }).fail(function(err) {
          dfd.reject(err);
        });
      }).fail(function(err) {
        self._unblockOriginatingView(status);
        dfd.reject(err);
      });
      return dfd.promise();
    },
    _showUpdatePerformerWizard: function(status, options) {
      var self = this, dfd = $.Deferred();
      require([ "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/task.update.performers/task.update.performer.view" ], function(StepperWizard, TaskUpdatePerformerView) {
        var wizard = new StepperWizard({
          steps: [ {
            id: "updatePerformer",
            title: lang.CommandNameUpdatePerformer,
            nextStepId: function() {
              return "finish";
            },
            viewClass: TaskUpdatePerformerView,
            viewOptions: options,
            buttons: [ {
              id: "next",
              className: "update-performer-btn",
              label: lang.UpdatePerformerLabelUpdate,
              disabled: function() {
                return this.nextButtonDisabled;
              },
              clickHandler: function() {
                this.onFormFieldValidate({
                  refreshState: true,
                  validateOnlyRequiredFields: false
                }).done(_.bind(function() {
                  var formValues = this.getFormValueMap();
                  if (formValues) {
                    options["data"] = formValues;
                    this.options.wizard.nextStep();
                  }
                }, this));
              }
            } ],
            onCancel: function() {
              return self.showConfirmationMessage(lang.UpdatePerformerCancelTitle, lang.UpdatePerformerCancelMessage, lang.UpdatePerformersCancelStopButtonLabel);
            }
          } ],
          data: {
            commandKey: self.get("command_key"),
            context: status.context
          },
          className: "d2-task-update-performers"
        });
        wizard.show().on("wizard:closed", function(isCancel) {
          if (isCancel) {
            dfd.reject();
          } else {
            dfd.resolve();
          }
        });
      });
      return dfd.promise();
    },
    showConfirmationMessage: function(title, message, yesButtonLabel) {
      var dfd = $.Deferred(), buttonOptions = {
        showYes: true,
        labelYes: yesButtonLabel,
        showNo: false,
        showCancel: true
      };
      Alert.confirmQuestion(function(result) {
        if (result) {
          dfd.resolve();
        } else {
          dfd.reject();
        }
      }, message, title, {
        buttons: buttonOptions
      });
      return dfd.promise();
    },
    _blockOriginatingView: function(status) {
      status && status.originatingView && status.originatingView.blockActions && status.originatingView.blockActions();
    },
    _unblockOriginatingView: function(status) {
      status && status.originatingView && status.originatingView.unblockActions && status.originatingView.unblockActions();
    }
  });
});