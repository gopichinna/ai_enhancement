/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "i18n!d2/commands/nls/localized.strings", "csui/utils/commandhelper", "csui/utils/command.error", "d2/commands/delete" ], function(_, $, Url, lang, CommandHelper, CommandError, DeleteCommand) {
  "use strict";
  var RenditionDeleteCommand = DeleteCommand.extend({
    defaults: {
      signature: "D2-RenditionDelete",
      command_key: "D2-RenditionDelete",
      name: lang.CommandNameDeleteRendition,
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
    enabled: function(status) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      var command = this.get("command_key");
      return nodes.length && nodes.every(function(node) {
        var action = node.actions.get(command);
        return action && action.attributes;
      });
    },
    execute: function(status, options = {}) {
      options.isRenditionDelete = true;
      options.dontPromptAllVersionDeletePopup = true;
      if (status.nodes.length === 1) {
        options.deleteConfirmAlertMessage = lang.DeleteConfirmOneRendition;
      } else {
        options.deleteConfirmAlertMessage = _.str.sformat(lang.DeleteConfirmManyRenditions, status.nodes.length);
      }
      return DeleteCommand.prototype.execute.apply(this, arguments);
    },
    handleResults: function() {}
  });
  return RenditionDeleteCommand;
});