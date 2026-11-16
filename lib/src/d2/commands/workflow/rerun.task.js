/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "csui/utils/commandhelper", "d2/commands/node.progress.command", "d2/utils/rest.linkrels", "i18n!d2/commands/nls/localized.strings" ], function($, CommandHelper, NodeProgressCommand, RestLinkrels, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-RerunTask",
      command_key: "D2-RerunTask",
      name: lang.CommandNameRerunTask,
      scope: "single"
    },
    preProcess: function(status, options) {
      options.suppressProgress = true;
      return $.Deferred().resolve().promise();
    },
    doAction: function(node, options) {
      var deferred = $.Deferred(), collection = options.collection || options.originatingView && options.originatingView.collection;
      $.ajax(node.connector.extendAjaxOptions({
        url: CommandHelper.getOriginalActionLink(node, this.get("signature"), RestLinkrels.D2_TASK_STATUS),
        type: "PUT"
      })).done(function() {
        if (collection) {
          collection.fetch({
            reload: true,
            reset: true
          }).always(function() {
            deferred.resolve();
          });
        } else {
          deferred.resolve();
        }
      }).fail(deferred.reject);
      return deferred.promise();
    },
    getMessageOptions: function() {
      return {
        oneFileSuccess: lang.RerunTaskSuccessMessage,
        oneFileFailure: lang.RerunTaskFailureMessage,
        actionType: "RERUN_TASK"
      };
    }
  });
});