/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/connector", "csui/utils/commandhelper", "csui/controls/form/pub.sub", "nuc/utils/url", "d2/commands/node.progress.command", "d2/models/workflow/workflow.audits", "d2/models/workflow/workflow", "d2/models/workflow/workflow.audit.task", "d2/models/workflow/workflow.audit.task.event", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/constants", "dctmw/utils/utils", "d2/utils/task.utils", "d2/models/workflow/task", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, Backbone, ConnectorFactory, CommandHelper, PubSub, Url, NodeProgressCommand, WorkflowAuditCollection, WorkflowModel, WorkflowAuditTask, WorkflowAuditTaskEvent, RestLinkrels, RestResources, constants, utils, taskUtils, TaskModel, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-DelegateTask",
      command_key: "D2-DelegateTask",
      name: lang.CommandNameDelegateTask,
      scope: "single"
    },
    preProcess: function(status, options) {
      var dfd = $.Deferred(), task = CommandHelper.getJustOneNode(status);
      options || (options = {});
      options.model = task;
      options.suppressProgress = true;
      return dfd.resolve().promise();
    },
    doAction: function(task, options) {
      var me = this, opts = utils.isMobile() ? {
        force: true,
        cache: false
      } : {}, checkLockCallFail, nodeClone = task.clone();
      options.signature = this.get("signature");
      return nodeClone.fetch(opts).then(function() {
        checkLockCallFail = true;
        task.set(this.attributes, {
          silent: true
        });
        return taskUtils.checkLockState(task);
      }.bind(nodeClone)).then(function() {
        checkLockCallFail = false;
        return me._showTaskDelegateDialog(task, options);
      }).then(function() {
        if (task.get("delegate_notes_enabled") === false || task.get("delegate_notes_required") === false && options.data["task_delegate_users_note"] === "") {
          return $.Deferred().resolve().promise();
        }
        var saveOptions = {
          taskModel: task,
          content: options.data["task_delegate_users_note"]
        };
        return me.saveNote(saveOptions);
      }).then(function() {
        return taskUtils.performDelegateTask(task, options);
      }).catch(function(xhr, message, statusText) {
        if (checkLockCallFail) {
          return $.Deferred().reject(lang.DelegateTaskWithLockedFilesMessage).promise();
        } else {
          return $.Deferred().reject(xhr, message, statusText).promise();
        }
      });
    },
    handleResults: function(results, options) {
      var widgetConfig = {}, collection = options.collection || options.originatingView && options.originatingView.collection;
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
      }
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
      var promises = _.compact(_.map(results, function(result) {
        if (result instanceof Backbone.Model) {
          var deferred = $.Deferred(), id = result.get("id"), done = function() {
            result.trigger("d2:task:delegated", {
              id: id
            });
            if (collection) {
              var task = collection.findWhere({
                id: id
              });
              task && collection.remove(task);
            }
            deferred.resolve(result);
          };
          if (options.suppressRefresh !== true) {
            CommandHelper.refreshNode(result, widgetConfig).done(done).fail(deferred.reject);
          } else {
            done();
          }
          return deferred.promise();
        }
      }));
      return $.whenAll.apply($, promises);
    },
    getMessageOptions: function(options) {
      return {
        oneFilePending: _.str.sformat(lang.DelegateTaskPendingMessage, options.model.get("name")),
        oneFileSuccess: _.str.sformat(lang.DelegateTaskSuccessMessage, options.model.get("name"), options.data["task_delegate_users"]),
        oneFileFailure: _.str.sformat(lang.DelegateTaskFailMessage, options.model.get("name"))
      };
    },
    _showTaskDelegateDialog: function(task, options) {
      var self = this, dfd = $.Deferred();
      require([ "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/dialogs/task.delegate/task.delegate.view" ], function(ModelAlert, TaskDelegateView) {
        var formContent = self._getTaskDelegateForm(task), taskDelegateView = new TaskDelegateView({
          context: options.context,
          task: task,
          formContent: formContent,
          signature: self.get("signature")
        });
        function getDelegateButton() {
          var $modelContent = taskDelegateView.$el.closest(".binf-modal-content");
          return $modelContent.find(".binf-modal-footer .csui-yes");
        }
        function enableDelegateButtton() {
          var $delegateButton = getDelegateButton();
          $delegateButton.removeAttr("disabled");
        }
        function disableDelegateButtton() {
          var $delegateButton = getDelegateButton();
          $delegateButton.attr("disabled", "disabled");
        }
        function onFieldValueUpdate() {
          var taskDelegateUser = taskDelegateView.getValues()["task_delegate_users"], taskDelegateNote = taskDelegateView.getValues()["task_delegate_users_note"];
          options["data"] = {
            task_delegate_users: taskDelegateUser,
            task_delegate_users_note: taskDelegateNote
          };
          var validateNote = true;
          if (task.get("delegate_notes_required")) {
            validateNote = taskDelegateNote !== "";
          }
          if (taskDelegateUser && validateNote) {
            enableDelegateButtton();
          } else {
            disableDelegateButtton();
          }
        }
        self.listenToOnce(taskDelegateView, "render:form", disableDelegateButtton);
        self.listenToOnce(PubSub, "dctm:custom:modal:alert:show", disableDelegateButtton);
        self.listenTo(taskDelegateView, "d2:change:formValidation", onFieldValueUpdate);
        ModelAlert.confirmQuestion(function(result) {
          if (result) {
            dfd.resolve();
          } else {
            options.hideFailureMessage = true;
            dfd.reject(new Error());
          }
        }, "", lang.DelegateTaskLabelDelegate, {
          buttons: {
            showYes: true,
            labelYes: lang.DelegateTaskLabelDelegate,
            showNo: false,
            showCancel: true
          },
          contentView: taskDelegateView,
          modalClass: "d2-task-delegate-model"
        });
      });
      return dfd.promise();
    },
    _getTaskDelegateForm: function(task) {
      var delegateForm = {
        dialog: {
          content: {
            order: 1,
            combo: {
              id: "task_delegate_users",
              label: lang.DelegateTaskLabelUsers,
              field_content_type: "USER_OR_GROUP",
              assistance_type: "custom",
              asynchronous: true,
              condition_required: true,
              order: 1,
              autoselect_single: true
            }
          }
        }
      };
      if (task.get("delegate_notes_enabled") === true) {
        delegateForm["dialog"]["content"]["memo"] = {
          id: "task_delegate_users_note",
          label: lang.DelegateTaskLabelNote,
          order: 2
        };
        if (task.get("delegate_notes_required") === true) {
          delegateForm["dialog"]["content"]["memo"]["condition_required"] = true;
        }
      }
      return delegateForm;
    },
    saveNote: function(options) {
      var deferred = $.Deferred();
      var url = this._getUrl(options.taskModel), payload = {
        properties: {
          note_text: $.trim(options.content)
        }
      }, qParams = {};
      if (options.taskModel instanceof WorkflowModel || options.taskModel instanceof WorkflowAuditTask || options.taskModel instanceof WorkflowAuditTaskEvent) {
        qParams["wf-overview-widget-name"] = options.taskModel.connector.context.viewStateModel.getDefaultViewState("widget_name");
      }
      url = Url.appendQuery(url, Url.combineQueryString(qParams));
      $.ajax(options.taskModel.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        contentType: constants.MediaTypes.DCTM_JSON,
        dataType: "json",
        data: JSON.stringify(payload),
        success: function() {
          if (options.collection) {
            options.collection.unshift({
              note_by: RestResources.getCurrentUser().get("name"),
              note_date: new Date(),
              note_text: $.trim(options.content)
            });
            (options.taskModel instanceof WorkflowAuditTask || options.taskModel instanceof WorkflowAuditTaskEvent) && options.taskModel.trigger("d2:note:added");
          } else {
            options.taskModel.trigger("d2:note:added");
          }
          deferred.resolve();
        },
        error: function(xhr, message, statusText) {
          CommandHelper.showErrorPanel(options.taskModel, _.str.sformat(lang.AddTaskNoteFailMessage, options.taskModel.get("name")), utils.parseAjaxErrorAsString(xhr, statusText, message));
          deferred.reject();
        }
      }));
      return deferred.promise();
    },
    _getUrl: function(node) {
      return RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_NOTES);
    }
  });
});