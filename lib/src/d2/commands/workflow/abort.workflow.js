/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/dialogs/modal.alert/modal.alert", "csui/utils/commandhelper", "nuc/utils/url", "csui/utils/contexts/factories/connector", "dctmw/utils/rest.resources", "d2/utils/widget.constants", "d2/commands/node.progress.command", "d2/models/workflow/workflow", "d2/utils/constants", "d2/utils/rest.linkrels", "d2/commands/mixin/ba.actions/ba.actions.mixin", "i18n!d2/commands/nls/localized.strings" ], function(_, $, Backbone, ModalAlert, CommandHelper, Url, ConnectorFactory, RestResources, widgetConstants, NodeProgressCommand, WorkflowModel, constants, RestLinkrels, BaActionsMixin, lang) {
  "use strict";
  var AbortWorkflowCommand = NodeProgressCommand.extend({
    defaults: {
      signature: "D2-WorkflowAbort",
      command_key: "D2-WorkflowAbort",
      name: lang.CommandNameAbortWorkflow,
      scope: "single"
    },
    preProcess: function(status, options) {
      options = options || {};
      options.context = status.context;
      options.suppressProgress = true;
      options.model = CommandHelper.getJustOneNode(status);
      this._blockActions(status.originatingView);
      return this.getWorkflowConfig(options.model, options).then(function() {
        this._unblockActions(status.originatingView);
        options.deleteHistory = options.model.get("is_delete_workflow_history_enabled");
        if (options.deleteHistory) {
          return this._showAbortDialog(status, options);
        } else {
          return this.showModal(status, options);
        }
      }.bind(this)).catch(function(xhr, message, statusText) {
        this._unblockActions(status.originatingView);
        if (xhr === "complete") {
          return $.Deferred().resolve().promise();
        } else {
          return $.Deferred().reject(xhr, message, statusText).promise();
        }
      }.bind(this));
    },
    _setNodeForAction: function(node, options) {
      var dfd = $.Deferred(), connector = options.context.getObject(ConnectorFactory), defaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), workflow = new WorkflowModel({
        id: node.get("id")
      }, {
        connector: connector,
        widgetType: widgetConstants.D2.WORKFLOWS,
        widgetName: defaultWidgets[widgetConstants.DEFAULT.ALL_WORKFLOWS]
      });
      workflow.fetch().done(function() {
        node.set("is_delete_workflow_history_enabled", workflow.get("is_delete_workflow_history_enabled"));
        dfd.resolve();
      }).fail(dfd.reject);
      return dfd.promise();
    },
    getWorkflowConfig: function(model, options) {
      if (model.get("is_delete_workflow_history_enabled") !== undefined) {
        return $.Deferred().resolve().promise();
      } else if (model.get("rObjectType") === "d2c_workflow_tracker" || model.get("r_object_type") === "d2c_workflow_tracker") {
        return this._setNodeForAction(model, options);
      } else {
        return model.fetch();
      }
    },
    showModal: function(status, options) {
      var dfd = $.Deferred();
      var confirmOptions = {
        signature: "D2-WorkflowAbort",
        message: lang.AbortWorkflowConfirmationDialogMessage,
        nodes: status.nodes,
        showMessage: true,
        labelTitle: lang.AbortWorkflowConfirmationDialogTitle,
        labelYes: lang.AbortWorkflowConfirmationDialogBtnOK
      };
      this.showConfirmationDialog(confirmOptions).done(function(data) {
        if (data) {
          options["ba_data"] = data;
        }
        dfd.resolve();
      }).fail(dfd.reject);
      return dfd.promise();
    },
    doAction: function(task, options) {
      this._blockActions(options.originatingView);
      var url = CommandHelper.getOriginalActionLink(task, this.get("signature"), RestLinkrels.D2_WORKFLOW_STATUS), queryMap = {
        "delete-workflow-history": true
      };
      if (options.intention) {
        url = Url.appendQuery(url, Url.combineQueryString(queryMap));
      }
      return $.ajax(task.connector.extendAjaxOptions({
        url: url,
        type: "PUT",
        data: options["ba_data"] ? JSON.stringify(options["ba_data"]) : "",
        contentType: constants.MediaTypes.DCTM_JSON
      })).always(this._unblockActions.bind(this, options.originatingView));
    },
    handleResults: function(results, options) {
      var dfd = $.Deferred(), collection = options.originatingView && options.originatingView.collection || options.collection;
      _.each(results, function(result) {
        function removeItemsFromCollection(idAttribute) {
          if (collection) {
            var condition = {};
            condition[idAttribute] = result.get(idAttribute);
            var models = collection.where(condition);
            if (models && models.length) {
              collection.remove(models);
              if (_.isArray(collection.lastFilteredAndSortedModels)) {
                collection.lastFilteredAndSortedModels = _.without.apply(_, [ collection.lastFilteredAndSortedModels ].concat(models));
              }
            }
          }
        }
        if (result instanceof Backbone.Model) {
          if (result.get("type") === constants.Types.TASK) {
            result.trigger("d2:task:aborted", {
              id: result.get("id")
            });
            removeItemsFromCollection("workflow_id");
            dfd.resolve();
          } else if (options.intention) {
            result.trigger("d2:workflow:aborted", {
              id: result.get("id")
            });
            removeItemsFromCollection("id");
            dfd.resolve();
          } else {
            var widgetConfig = {};
            if (options.collection && options.collection.options) {
              widgetConfig.widgetType = options.collection.widgetType;
              widgetConfig.widgetName = options.collection.options.widgetName;
            }
            CommandHelper.refreshNode(result, widgetConfig).done(dfd.resolve).fail(dfd.reject);
          }
        } else {
          dfd.resolve();
        }
      });
      return dfd.promise();
    },
    _blockActions: function(view) {
      view && _.isFunction(view.blockActions) && view.blockActions();
    },
    _unblockActions: function(view) {
      view && _.isFunction(view.unblockActions) && view.unblockActions();
    },
    getMessageOptions: function(options) {
      return {
        oneFileFailure: options.model.get("type") === constants.Types.WORKFLOW ? lang.AbortWorkflowOneItemFailureMessage : lang.AbortWorkflowFromTaskListOneItemFailureMessage,
        oneFileSuccess: options.model.get("type") === constants.Types.WORKFLOW ? lang.AbortWorkflowOneItemSuccessMessage : lang.AbortWorkflowFromTaskListOneItemSuccessMessage,
        actionType: "ABORT_WORKFLOW"
      };
    },
    _showAbortDialog: function(status, options) {
      var me = this, dfd = $.Deferred();
      require([ "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/dialogs/modal.stopshare/stopShareDialog" ], function(ModalAlert, AbortDialogView) {
        var abortDialogView = new AbortDialogView({
          message: lang.AbortWorkflowConfirmationDialogMessage,
          checkboxMessage: lang.AbortWorkflowAndDeleteWfHistoryMessage,
          ariaLabel: lang.AbortWorkflowAndDeleteWfHistoryMessage
        });
        function getModelAbortButton() {
          var $modelContent = abortDialogView.$el.closest(".binf-modal-content");
          return $modelContent.find(".binf-modal-footer .csui-yes");
        }
        me.listenTo(abortDialogView, "checkbox:clicked", function(data) {
          var model = data.model, $abortButton = getModelAbortButton();
          if (model.get("checked") === "false") {
            $abortButton.text(lang.AbortWorkflowConfirmationDialogBtnAbortAndDelete);
            $abortButton.attr("title", lang.AbortWorkflowConfirmationDialogBtnAbortAndDelete);
            options.intention = true;
          } else {
            $abortButton.text("Abort");
            $abortButton.attr("title", lang.AbortWorkflowConfirmationDialogBtnOK);
            options.intention = false;
          }
        });
        var confirmOptions = {
          signature: "D2-WorkflowAbort",
          nodes: status.nodes,
          showMessage: false,
          labelTitle: lang.AbortWorkflowConfirmationDialogTitle,
          labelYes: lang.AbortWorkflowConfirmationDialogBtnOK,
          customView: abortDialogView,
          modalClass: "d2-confirm-cancel-checkout abort-workflow-dialog"
        };
        me.showConfirmationDialog(confirmOptions).done(function(data) {
          if (data) {
            options["ba_data"] = data;
          }
          dfd.resolve();
        }).fail(dfd.reject);
      });
      return dfd.promise();
    }
  });
  BaActionsMixin.mixin(AbortWorkflowCommand.prototype);
  return AbortWorkflowCommand;
});