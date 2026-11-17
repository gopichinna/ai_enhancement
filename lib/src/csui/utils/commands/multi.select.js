/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commandhelper", "csui/utils/commands/node" ], function(CommandHelper, NodeCommand) {
  "use strict";
  var MultiSelect = NodeCommand.extend({
    defaults: {
      signature: "Select",
      command_key: [ "select", "Select" ]
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status);
      if (node && status.collection && status.collection.length > 0) {
        return true;
      }
    }
  });
  return MultiSelect;
});