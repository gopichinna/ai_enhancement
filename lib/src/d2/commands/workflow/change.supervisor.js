/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/utils/commandhelper", "csui/controls/form/pub.sub", "dctmw/utils/rest.resources", "d2/commands/node.progress.command", "d2/utils/constants", "d2/utils/task.utils", "i18n!d2/commands/nls/localized.strings", "i18n!d2/dialogs/ba.actions.comments.dialog/impl/nls/lang" ], function(require, _, $, Backbone, CommandHelper, PubSub, RestResources, NodeProgressCommand, constants, TaskUtils, lang, baLang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-WorkflowChangeSupervisor",
      command_key: "D2-WorkflowChangeSupervisor",
      name: lang.CommandNameChangeSupervisor,
      scope: "single"
    },
    preProcess: function(status, options) {
      var dfd = $.Deferred(), workflowNode = CommandHelper.getJustOneNode(status);
      options = options || {};
      options.model = workflowNode;
      options.suppressProgress = true;
      return dfd.resolve().promise();
    },
    doAction: function(workflowNode, options) {
      var me = this;
      options.signature = this.get("signature");
      return me._showChangeSupervisorDialog(workflowNode, options).then(function() {
        return TaskUtils.performChangeSupervisor(workflowNode, options);
      }).catch(function(xhr, message, statusText) {
        return $.Deferred().reject(xhr, message, statusText).promise();
      });
    },
    refreshNodeList: function(options) {
      var me = this, workflowNode = {}, result = options.result, collection = options.collection, newSupervisor = result.get("supervisor_name"), currentUser = options.currentUser, id = result.get("id");
      if (me.userList && me.userList.userData && me.userList.userData[newSupervisor] && !me.userList.userData[newSupervisor]["r_is_group"] && newSupervisor !== currentUser) {
        result.trigger("d2:workflow:supervisor:changed", {
          id: id
        });
        workflowNode = collection.findWhere({
          id: id
        });
        workflowNode && collection.remove(workflowNode);
      } else if (me.userList && me.userList.userData && me.userList.userData[newSupervisor] && me.userList.userData[newSupervisor]["r_is_group"]) {
        var groupApiOptions = {
          context: options.context,
          groupName: newSupervisor
        };
        TaskUtils.getGroupUsers(groupApiOptions).done(function(data) {
          if (data.indexOf(currentUser) < 0) {
            result.trigger("d2:workflow:supervisor:changed", {
              id: id
            });
            workflowNode = collection.findWhere({
              id: id
            });
            workflowNode && collection.remove(workflowNode);
          }
        });
      }
    },
    handleResults: function(results, options) {
      var me = this, widgetConfig = {}, collection = options.originatingView && options.originatingView.collection || options.collection;
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
      }
      var promises = _.compact(_.map(results, function(result) {
        if (result instanceof Backbone.Model) {
          var deferred = $.Deferred(), done = function() {
            var qformParam = options.context.viewStateModel.getViewState("qform-param", true), wfOptions = {
              context: options.context,
              collection: collection,
              currentUser: RestResources.getCurrentUser().get("name"),
              result: result
            };
            qformParam = qformParam ? JSON.parse(qformParam) : undefined;
            if (collection && collection.workflowsReportingType && collection.workflowsReportingType === constants.WorkflowsReportingType.USER) {
              me.refreshNodeList(wfOptions);
            } else if (collection && collection.workflowsReportingType && collection.workflowsReportingType === constants.WorkflowsReportingType.ALL && qformParam && qformParam["wf-users"]) {
              wfOptions["currentUser"] = qformParam["wf-users"];
              me.refreshNodeList(wfOptions);
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
        oneFileSuccess: _.str.sformat(lang.ChangeSupervisorSuccessMessage, options.data["change_wf_supervisor"]),
        oneFileFailure: _.str.sformat(lang.ChangeSupervisorFailMessage)
      };
    },
    _showChangeSupervisorDialog: function(node, options) {
      var dfd = $.Deferred(), me = this;
      require([ "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/dialogs/change.supervisor/change.supervisor.view" ], function(ModalAlert, ChangeSupervisorView) {
        const commentFieldOptions = me._getCommentFieldOptions(node, options), formContent = me.getChangeSupervisorForm(commentFieldOptions), changeSupervisorView = new ChangeSupervisorView({
          context: options.context,
          node: node,
          formContent: formContent,
          signature: me.get("signature")
        });
        function getChangeButton() {
          var $modelContent = changeSupervisorView.$el.closest(".binf-modal-content");
          return $modelContent.find(".binf-modal-footer .csui-yes");
        }
        function disableChangeButton() {
          var $changeButton = getChangeButton();
          $changeButton.attr("disabled", "disabled");
        }
        function enableChangeButton() {
          var $changeButton = getChangeButton();
          $changeButton.removeAttr("disabled");
        }
        function onFieldValueUpdate() {
          var wfSupervisor = changeSupervisorView.getValues()["change_wf_supervisor"];
          options["data"] = {
            change_wf_supervisor: wfSupervisor
          };
          let isFormValid = true;
          if (commentFieldOptions.showField) {
            const comment = changeSupervisorView.getValues()["comment_field"];
            options.data.comment = comment;
            if (commentFieldOptions.isMandatory) {
              isFormValid = comment !== "" && changeSupervisorView.validate();
            }
          }
          if (wfSupervisor && isFormValid) {
            enableChangeButton();
          } else {
            disableChangeButton();
          }
        }
        me.listenToOnce(changeSupervisorView, "render", disableChangeButton);
        me.listenToOnce(PubSub, "dctm:custom:modal:alert:show", disableChangeButton);
        me.listenTo(changeSupervisorView, "d2:change:formValidation", onFieldValueUpdate);
        me.listenTo(changeSupervisorView, "supervisor:user:list", function(data) {
          me.userList = data;
        });
        let modelClass = "d2-task-delegate-model d2-change-wf-supervisor-modal";
        if (commentFieldOptions.showField) {
          modelClass += " d2-wf-comment-model";
        }
        ModalAlert.confirmQuestion(function(result) {
          if (result) {
            options.hideFailureMessage = false;
            dfd.resolve();
          } else {
            options.hideFailureMessage = true;
            dfd.reject(new Error());
          }
        }, "", lang.ChangeSupervisorDialogTitle, {
          buttons: {
            showYes: true,
            labelYes: lang.ChangeSupervisorDialogChangeText,
            showNo: false,
            showCancel: true
          },
          contentView: changeSupervisorView,
          modalClass: modelClass
        });
      });
      return dfd.promise();
    },
    _getCommentFieldOptions: function(node, options) {
      const commandData = node.actions.find({
        signature: options.signature
      }).get("commandData"), isBaAction = commandData.isBaActions === "true";
      return {
        showField: isBaAction && commandData.showComments === "true",
        isMandatory: isBaAction && commandData.commentsMandatory === "true"
      };
    },
    getChangeSupervisorForm: function(commentFieldOptions) {
      let form = {
        dialog: {
          content: {
            order: 1,
            combo: {
              id: "change_wf_supervisor",
              label: lang.ChangeSupervisorUserLabel,
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
      if (commentFieldOptions.showField) {
        form["dialog"]["content"]["memo"] = {
          id: "comment_field",
          label: baLang.Comment,
          order: 2
        };
        if (commentFieldOptions.isMandatory) {
          form["dialog"]["content"]["memo"]["condition_required"] = true;
        }
      }
      return form;
    }
  });
});