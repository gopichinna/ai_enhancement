/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/command" ], function(CommandModel) {
  "use strict";
  var RenameCommand = CommandModel.extend({
    defaults: {
      signature: "Rename",
      command_key: [ "rename", "Rename" ],
      scope: "single"
    },
    rename: function(node, name) {
      return node.save({
        name: name
      }, {
        wait: true,
        patch: true
      });
    }
  });
  return RenameCommand;
});