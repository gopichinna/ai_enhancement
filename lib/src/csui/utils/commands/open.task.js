/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commandhelper", "csui/utils/commands/open.classic.page" ], function(CommandHelper, OpenClassicPageCommand) {
  var OpenTaskCommand = OpenClassicPageCommand.extend({
    defaults: {
      signature: "OpenTask"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get("type") === 206;
    },
    getUrlQueryParameters: function(node, options) {
      return {
        func: "ll",
        objAction: "BrowseTask",
        objId: node.get("id"),
        nexturl: location.href
      };
    }
  });
  return OpenTaskCommand;
});