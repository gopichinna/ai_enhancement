/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commandhelper", "csui/utils/commands/open.classic.page" ], function(CommandHelper, OpenClassicPageCommand) {
  var OpenROICommand = OpenClassicPageCommand.extend({
    defaults: {
      signature: "OpenROI"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get("type") === 952;
    },
    getUrlQueryParameters: function(node, options) {
      return {
        func: "ll",
        objAction: "info",
        objId: node.get("id"),
        nexturl: location.href
      };
    }
  });
  return OpenROICommand;
});