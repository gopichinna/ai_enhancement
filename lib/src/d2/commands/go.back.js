/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "csui/utils/contexts/factories/application.scope.factory", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, CommandModel, ApplicationScopeModelFactory, lang) {
  "use strict";
  var GoBackCommand = CommandModel.extend({
    defaults: {
      signature: "D2-Back",
      name: lang.CommandNameBack,
      scope: "single"
    },
    enabled: function() {
      return true;
    },
    execute: function(status) {
      var context = status.context, viewStateModel = context && context.viewStateModel;
      if (viewStateModel && !!viewStateModel.getLastHistoryEntry()) {
        var currentRouter = viewStateModel.get(viewStateModel.CONSTANTS.CURRENT_ROUTER), lastRouter = viewStateModel.get(viewStateModel.CONSTANTS.LAST_ROUTER), shouldRestoreFragment = _.isBoolean(status.restoreLastFragment) ? status.restoreLastFragment : currentRouter === lastRouter, historyIndex = status.restoryHistoryIndex ? status.restoryHistoryIndex : -1;
        if (shouldRestoreFragment === true) {
          if (historyIndex === -1) {
            viewStateModel.restoreLastFragment();
          } else {
            viewStateModel.restoreHistoryEntryByIndex(historyIndex);
          }
        } else {
          viewStateModel.restoreLastRouter();
        }
      } else if (viewStateModel && context.isEmbeddedMode) {
        if (context.isEmbeddedSearch === true) {
          context.visitedNodeHistory.pop();
          context.currentNodeId = context.visitedNodeHistory[context.visitedNodeHistory.length - 1];
        }
        viewStateModel.restoreLastRouter();
      } else {
        context && context.getModel(ApplicationScopeModelFactory).set("id", "");
      }
      return $.Deferred().resolve().promise();
    }
  });
  return GoBackCommand;
});