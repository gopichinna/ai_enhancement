/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/utils/commandhelper", "d2/models/workflow/workflow.audits", "d2/utils/rest.linkrels", "d2/commands/node.progress.command", "i18n!d2/commands/nls/localized.strings" ], function(_, $, Backbone, CommandHelper, WorkflowAuditCollection, RestLinkrels, NodeProgressCommand, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-PauseTask",
      command_key: "D2-PauseTask",
      name: lang.CommandNamePauseTask,
      scope: "single"
    },
    _performActions: function(status, options) {
      var returnValue = NodeProgressCommand.prototype._performActions.apply(this, arguments);
      options.progressPanelView && typeof options.progressPanelView?.showProgressBar === "function" && options.progressPanelView.showProgressBar(false);
      return returnValue;
    },
    doAction: function(node, options) {
      var pauseActionPromise = $.Deferred(), collection = options.collection || options.originatingView && options.originatingView.collection;
      $.ajax(node.connector.extendAjaxOptions({
        url: CommandHelper.getOriginalActionLink(node, this.get("signature"), RestLinkrels.D2_TASK_STATUS),
        type: "PUT"
      })).done(function() {
        if (collection instanceof WorkflowAuditCollection) {
          collection.fetch({
            reload: true,
            reset: true
          }).always(function() {
            pauseActionPromise.resolve();
          });
        } else {
          collection.remove(node, {
            silent: false
          });
          node.trigger("d2:task:paused", {
            id: node.get("id"),
            name: node.get("name")
          });
          pauseActionPromise.resolve();
        }
      }).fail(pauseActionPromise.reject);
      return pauseActionPromise.promise();
    },
    getMessageOptions: function() {
      return {
        oneFilePending: lang.PauseTaskPendingMessage,
        oneFileSuccess: lang.PauseTaskSuccessMessage,
        oneFileFailure: lang.PauseTaskFailureMessage,
        actionType: "PAUSE_TASK"
      };
    }
  });
});