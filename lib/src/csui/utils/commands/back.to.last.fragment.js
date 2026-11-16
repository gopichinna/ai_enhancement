/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/jquery", "csui/lib/underscore", "csui/models/command", "csui-ext!csui/utils/commands/back.to.last.fragment", "i18n!csui/utils/commands/nls/localized.strings" ], function(module, require, $, _, CommandModel, commandExtensions, lang) {
  "use strict";
  var BackToLastFragment = CommandModel.extend({
    defaults: {
      signature: "BackToLastFragment",
      name: lang.GoBack
    },
    enabled: function(status, options) {
      if (commandExtensions) {
        for (const extension of commandExtensions) {
          const enabledByExtension = extension.enabled(status, options);
          if (enabledByExtension !== undefined) {
            return enabledByExtension;
          }
        }
      }
      return this._enabled(status, options);
    },
    _enabled: function(status, options) {
      const config = _.extend({
        enabled: false
      }, module.config()), context = status.context || options && options.context;
      if (!context || !config.enabled) {
        return false;
      }
      var viewStateModel = context && context.viewStateModel;
      if (viewStateModel) {
        return !!viewStateModel.getLastHistoryEntry();
      }
    },
    execute: function(status, options) {
      let skipHistoryBy;
      if (commandExtensions) {
        for (const extension of commandExtensions) {
          skipHistoryBy = extension.getSkipHistoryBy(status, options);
          if (skipHistoryBy) {
            break;
          }
        }
      }
      return this._execute(status, options, skipHistoryBy);
    },
    _execute: function(status, options, skipHistoryBy) {
      let context = status.context || options && options.context, viewStateModel = context && context.viewStateModel;
      if (viewStateModel) {
        viewStateModel.set("browsing", true);
        const history = viewStateModel.getHistory();
        if (viewStateModel.getHistory().length - 1 - skipHistoryBy < 0) {
          if (skipHistoryBy > 0) {
            console.error("Error: BackToLastFragment command is unable to skip history by " + skipHistoryBy);
          }
          return $.Deferred().reject();
        } else {
          if (skipHistoryBy) {
            viewStateModel.restoreHistoryEntryByIndex(history.length - 1 - skipHistoryBy);
          } else {
            viewStateModel.restoreLastFragment();
          }
        }
      }
      return $.Deferred().resolve().promise();
    }
  });
  return BackToLastFragment;
});