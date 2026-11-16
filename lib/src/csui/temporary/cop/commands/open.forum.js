/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/utils/commandhelper", "csui/utils/commands/open.classic.page" ], function($, CommandHelper, OpenClassicPageCommand) {
  "use strict";
  var OpenForumCommand = OpenClassicPageCommand.extend({
    defaults: {
      signature: "OpenForum"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status), type = node && node.get("type");
      return type === 123469 || type === 123470;
    },
    getUrlQueryParameters: function(node, options) {
      var forum = node.get("type") === 123469;
      return {
        func: "ll",
        objAction: forum ? "view" : "viewincontainer",
        objId: node.get("id"),
        nexturl: location.href
      };
    }
  });
  return OpenForumCommand;
});