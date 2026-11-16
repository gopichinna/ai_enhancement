/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/command", "dctmw/utils/client.location", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function(CommandModel, ClientLocation, utils, lang) {
  "use strict";
  var ExecuteQueryFormSearchCommand = CommandModel.extend({
    defaults: {
      signature: "D2-ExecuteQueryFormSearch",
      command_key: "D2-ExecuteQueryFormSearch",
      name: lang.CommandNameExecuteQueryFormSearch,
      scope: "single"
    },
    enabled: function() {
      return true;
    },
    execute: function(status) {
      var savedSearchId = status.savedSearchId;
      utils.openUrlInWindow(ClientLocation.modularizeFragment("#search/queryform/" + savedSearchId));
    }
  });
  return ExecuteQueryFormSearchCommand;
});