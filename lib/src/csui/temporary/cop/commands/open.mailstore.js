/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commandhelper", "csui/utils/commands/open.classic.page" ], function(CommandHelper, OpenClassicPageCommand) {
  "use strict";
  var OpenMailStoreCommand = OpenClassicPageCommand.extend({
    defaults: {
      signature: "OpenMailStore"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status), type = node && node.get("type");
      return type === 3030331;
    },
    getUrlQueryParameters: function(node, options) {
      var mailStore = node.get("type") === 3030331;
      if (mailStore) {
        return {
          func: "ll",
          objAction: "browse",
          objId: node.get("id"),
          viewType: 1,
          nexturl: location.href
        };
      }
    }
  });
  return OpenMailStoreCommand;
});