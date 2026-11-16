/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/dialogs/modal.alert/modal.alert", "csui/utils/commandhelper", "nuc/utils/url", "d2/utils/rest.linkrels", "d2/commands/node.progress.command", "d2/commands/mixin/ba.actions/ba.actions.mixin", "d2/utils/constants", "i18n!d2/commands/nls/localized.strings" ], function(_, $, Backbone, ModalAlert, CommandHelper, Url, RestLinkrels, NodeProgressCommand, BaActionsMixin, constants, lang) {
  "use strict";
  var ResumeWorkflowCommand = NodeProgressCommand.extend({
    defaults: {
      signature: "D2-WorkflowResume",
      command_key: "D2-WorkflowResume",
      name: lang.CommandNameResumeWorkflow,
      scope: "single"
    },
    preProcess: function(status, options) {
      var deferred = $.Deferred();
      var confirmOptions = {
        signature: "D2-WorkflowResume",
        message: lang.ResumeWorkflowConfirmAlertMessage,
        nodes: status.nodes,
        showMessage: true,
        labelTitle: lang.ResumeWorkflowConfirmDialogTitle,
        labelYes: lang.ResumeWorkflowConfirmationYesButtonLabel
      };
      this.showConfirmationDialog(confirmOptions).done(function(data) {
        if (data) {
          options["ba_data"] = data;
        }
        deferred.resolve();
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _performActions: function(status, options) {
      var returnValue = NodeProgressCommand.prototype._performActions.apply(this, arguments);
      options.progressPanelView && typeof options.progressPanelView?.showProgressBar === "function" && options.progressPanelView.showProgressBar(false);
      return returnValue;
    },
    doAction: function(node, options) {
      var widgetConfig = {}, resumeActionPromise = $.Deferred();
      if (options.collection && options.collection.options) {
        widgetConfig.widgetType = options.collection.widgetType;
        widgetConfig.widgetName = options.collection.options.widgetName;
      }
      $.ajax(node.connector.extendAjaxOptions({
        url: CommandHelper.getOriginalActionLink(node, this.get("signature"), RestLinkrels.D2_WORKFLOW_STATUS),
        type: "PUT",
        data: options["ba_data"] ? JSON.stringify(options["ba_data"]) : "",
        contentType: constants.MediaTypes.DCTM_JSON
      })).done(function() {
        CommandHelper.refreshNode(node, widgetConfig).done(resumeActionPromise.resolve).fail(resumeActionPromise.reject);
      }).fail(resumeActionPromise.reject);
      return resumeActionPromise.promise();
    },
    getMessageOptions: function() {
      return {
        oneFilePending: lang.ResumeWorflowPendingMessage,
        oneFileSuccess: lang.ResumeWorflowSuccessMessage,
        oneFileFailure: lang.ResumeWorflowFailureMessage,
        actionType: "RESUME_WORKFLOW"
      };
    }
  });
  BaActionsMixin.mixin(ResumeWorkflowCommand.prototype);
  return ResumeWorkflowCommand;
});