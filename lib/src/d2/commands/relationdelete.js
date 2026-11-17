/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "i18n!d2/commands/nls/localized.strings", "d2/commands/delete" ], function(_, $, Url, lang, DeleteCommand) {
  "use strict";
  var RelationDeleteCommand = DeleteCommand.extend({
    defaults: {
      signature: "D2-RelationDelete",
      command_key: "D2-RelationDelete",
      name: lang.CommandNameDeleteRelation,
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
    execute: function(status, options = {}) {
      options.isRelationDelete = true;
      options.dontPromptAllVersionDeletePopup = true;
      if (status.nodes.length === 1) {
        options.deleteConfirmAlertMessage = lang.DeleteConfirmOneRelation;
      } else {
        options.deleteConfirmAlertMessage = _.str.sformat(lang.DeleteConfirmManyRelations, status.nodes.length);
      }
      return DeleteCommand.prototype.execute.call(this, status, options);
    },
    handleResults: function() {}
  });
  return RelationDeleteCommand;
});