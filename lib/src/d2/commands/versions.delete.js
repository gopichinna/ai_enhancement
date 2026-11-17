/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "i18n!d2/commands/nls/localized.strings", "csui/utils/commandhelper", "d2/commands/delete" ], function(require, module, _, $, Backbone, lang, CommandHelper, DeleteCommand) {
  "use strict";
  var VersionDeleteCommand = DeleteCommand.extend({
    defaults: {
      signature: "VersionDelete",
      command_key: "VersionDelete",
      name: lang.CommandNameVersionDelete,
      verb: lang.CommandVerbVersionDelete,
      pageLeavingWarning: lang.DeletePageLeavingWarning,
      scope: "multiple",
      successMessages: {
        formatForNone: lang.DeleteItemsNoneMessage,
        formatForOne: lang.DeleteOneItemSuccessMessage,
        formatForTwo: lang.DeleteManyItemsSuccessMessage,
        formatForFive: lang.DeleteManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: lang.DeleteItemsNoneMessage,
        formatForOne: lang.DeleteOneItemFailMessage,
        formatForTwo: lang.DeleteManyItemsFailMessage2,
        formatForFive: lang.DeleteManyItemsFailMessage
      }
    },
    execute: function(status, options) {
      options = options || {};
      options.isVersionDelete = true;
      options.dontPromptAllVersionDeletePopup = true;
      if (status.nodes.length === 1) {
        options.deleteConfirmAlertMessage = lang.DeleteConfirmOneVersion;
      } else {
        options.deleteConfirmAlertMessage = _.str.sformat(lang.DeleteConfirmManyVersions, status.nodes.length);
      }
      return DeleteCommand.prototype.execute.call(this, status, options);
    },
    handleResults: function(results, options) {
      var deferred = $.Deferred(), currentDeleted = false;
      _.each(results || [], function(result) {
        if (result instanceof Backbone.Model) {
          currentDeleted = currentDeleted || result.get("r_version_label")[1] === "CURRENT";
        }
      });
      if (!currentDeleted && options.collection && options.collection.length > 0) {
        options.collection.fetch({
          reload: true
        }).done(deferred.resolve(results));
      } else {
        options.context.viewStateModel.restoreLastFragment();
        return $.Deferred().resolve(results);
      }
      return deferred.promise();
    }
  });
  return VersionDeleteCommand;
});