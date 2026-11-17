/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/command" ], function(CommandModel) {
  "use strict";
  var PurgeAllVersionsCommand = CommandModel.extend({
    defaults: {
      signature: "PurgeAllVersions",
      command_key: [ "versions_purge_all" ],
      name: "Purge All",
      scope: "single"
    },
    execute: function(status, options) {
      throw new Error("Not implemented");
    }
  });
  return PurgeAllVersionsCommand;
});