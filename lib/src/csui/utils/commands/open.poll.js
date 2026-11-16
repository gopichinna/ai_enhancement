/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commandhelper", "csui/utils/commands/open.classic.page" ], function(CommandHelper, OpenClassicPageCommand) {
  var OpenPollCommand = OpenClassicPageCommand.extend({
    defaults: {
      signature: "OpenPoll"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get("type") === 218;
    },
    getUrlQueryParameters: function(node, options) {
      return {
        func: "ll",
        objAction: "OpenPoll",
        objId: node.get("id"),
        nexturl: location.href
      };
    }
  });
  return OpenPollCommand;
});