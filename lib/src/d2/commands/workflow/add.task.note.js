/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/globalmessage/globalmessage", "csui/dialogs/modal.alert/modal.alert", "csui/models/command", "csui/utils/commandhelper", "nuc/utils/url", "d2/models/workflow/workflow", "d2/models/workflow/workflow.audit.task", "d2/models/workflow/workflow.audit.task.event", "d2/utils/constants", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, GlobalMessage, ModalAlert, CommandModel, CommandHelper, Url, WorkflowModel, WorkflowAuditTask, WorkflowAuditTaskEvent, constants, RestLinkrels, RestResources, utils, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-AddTaskNote",
      command_key: "D2-AddTaskNote",
      name: "",
      scope: "single"
    },
    execute: function(status, options) {
      if (utils.isMobile()) {
        require([ "d2mob/dialogs/mobile.task.add.note/mobile.task.add.note.view" ], function(MobileTaskAddNoteView) {
          var hash = window.location.hash;
          status.context.addNoteEnabled = true;
          if (hash.includes("?")) {
            window.location.href += "&mobile_add_note=true";
          } else {
            window.location.href += "?mobile_add_note=true";
          }
          var mobileTaskAddNoteView = new MobileTaskAddNoteView(status);
          mobileTaskAddNoteView.render();
        });
      } else {
        return this.openWizard(status, options);
      }
    },
    openWizard: function(status) {
      var me = this, deferred = $.Deferred(), taskModel = CommandHelper.getJustOneNode(status), noteCollection = status.noteCollection;
      require([ "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/task.add.note/task.add.note.view" ], function(StepperWizard, TaskAddNoteView) {
        var stepOptions = {
          steps: [ {
            id: "add_note",
            viewClass: TaskAddNoteView,
            viewOptions: {
              collection: noteCollection,
              taskModel: taskModel
            },
            title: lang.AddTaskNoteTitle,
            buttons: [ {
              id: "next",
              disabled: true,
              label: lang.AddTaskNoteLabelSave,
              clickHandler: function() {
                me.saveNote(this);
              }
            } ],
            onCancel: me.onCancel
          } ],
          className: "d2-task-add-note-dialog"
        };
        me.wizard = new StepperWizard(stepOptions);
        me.wizard.show();
        me.wizard.on("wizard:closed", function(cancel) {
          if (cancel) {
            deferred.reject();
          } else {
            deferred.resolve();
          }
        });
      });
      return deferred.promise();
    },
    _getUrl: function(node) {
      return CommandHelper.getOriginalActionLink(node, this.get("signature"), RestLinkrels.D2_NOTES);
    },
    saveNote: function(view) {
      var url = this._getUrl(view.taskModel), payload = {
        properties: {
          note_text: $.trim(view.ui.textarea.val())
        }
      }, qParams = {};
      if (view.taskModel instanceof WorkflowModel || view.taskModel instanceof WorkflowAuditTask || view.taskModel instanceof WorkflowAuditTaskEvent) {
        qParams["wf-overview-widget-name"] = view.taskModel.connector.context.viewStateModel.getDefaultViewState("widget_name");
      }
      url = Url.appendQuery(url, Url.combineQueryString(qParams));
      view.blockActions();
      $.ajax(view.taskModel.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        contentType: constants.MediaTypes.DCTM_JSON,
        dataType: "json",
        data: JSON.stringify(payload),
        success: function() {
          if (view.collection) {
            view.collection.unshift({
              note_by: RestResources.getCurrentUser().get("name"),
              note_date: new Date(),
              note_text: $.trim(view.ui.textarea.val())
            });
            (view.taskModel instanceof WorkflowAuditTask || view.taskModel instanceof WorkflowAuditTaskEvent) && view.taskModel.trigger("d2:note:added");
          } else {
            view.taskModel.trigger("d2:note:added");
            GlobalMessage.showMessage("success", _.str.sformat(lang.AddTaskNoteSuccessMessage, view.taskModel.get("name")));
          }
          view.unblockActions();
          view.wizard.close();
        },
        error: function(xhr, message, statusText) {
          CommandHelper.showErrorPanel(view.taskModel, _.str.sformat(lang.AddTaskNoteFailMessage, view.taskModel.get("name")), utils.parseAjaxErrorAsString(xhr, statusText, message));
          view.unblockActions();
        }
      }));
    },
    onCancel: function() {
      if ($.trim(this.ui.textarea.val()) === "") {
        return $.Deferred().resolve();
      }
      var deferred = $.Deferred(), buttonOptions = {
        labelYes: lang.AddTaskNoteLabelStop,
        showNo: false,
        showCancel: true
      };
      ModalAlert.confirmQuestion(function(result) {
        if (result) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }, "", lang.AddTaskNoteStopConfirmTitle, {
        buttons: buttonOptions
      });
      return deferred.promise();
    }
  });
});