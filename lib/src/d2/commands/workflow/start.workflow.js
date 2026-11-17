/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "csui/dialogs/modal.alert/modal.alert", "csui/utils/commandhelper", "d2/commands/node.progress.command", "d2/utils/rest.linkrels", "i18n!d2/commands/nls/localized.strings" ], function($, ModalAlert, CommandHelper, NodeProgressCommand, RestLinkrels, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-WorkflowStart",
      command_key: "D2-WorkflowStart",
      name: lang.CommandNameStartWorkflow,
      scope: "single"
    },
    preProcess: function() {
      var deferred = $.Deferred();
      ModalAlert.confirmQuestion(function(result) {
        if (result) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }, lang.StartWorkflowConfirmAlertMessage, lang.StartWorkflowConfirmDialogTitle, {
        buttons: {
          showYes: true,
          labelYes: lang.StartWorkflowConfirmationYesButtonLabel,
          showNo: false,
          showCancel: true
        }
      });
      return deferred.promise();
    },
    _performActions: function(status, options) {
      var returnValue = NodeProgressCommand.prototype._performActions.apply(this, arguments);
      options.progressPanelView && typeof options.progressPanelView?.showProgressBar === "function" && options.progressPanelView.showProgressBar(false);
      return returnValue;
    },
    doAction: function(node, options) {
      var widgetConfig = {}, deferred = $.Deferred();
      if (options.collection && options.collection.options) {
        widgetConfig.widgetType = options.collection.widgetType;
        widgetConfig.widgetName = options.collection.options.widgetName;
      }
      $.ajax(node.connector.extendAjaxOptions({
        url: CommandHelper.getOriginalActionLink(node, this.get("signature"), RestLinkrels.D2_WORKFLOW_STATUS),
        type: "PUT"
      })).done(function() {
        CommandHelper.refreshNode(node, widgetConfig).done(deferred.resolve).fail(deferred.reject);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    getMessageOptions: function() {
      return {
        oneFilePending: lang.StartWorkflowPendingMessage,
        oneFileSuccess: lang.StartWorkflowSuccessMessage,
        oneFileFailure: lang.StartWorkflowFailureMessage,
        actionType: "START_WORKFLOW"
      };
    }
  });
});