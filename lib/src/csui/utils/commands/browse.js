/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commands/open.node.perspective", "csui/utils/commandhelper" ], function(OpenNodePerspectiveCommand, CommandHelper) {
  "use strict";
  var BrowseCommand = OpenNodePerspectiveCommand.extend({
    defaults: {
      signature: "Browse",
      command_key: [ "default", "open", "browse", "Browse" ],
      scope: "single"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get("container") && (node.get("openable") || this.checkPermittedActions(node));
    }
  });
  return BrowseCommand;
});