/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commandhelper", "csui/utils/commands/open.classic.page" ], function(CommandHelper, OpenClassicPageCommand) {
  "use strict";
  var OpenBlogCommand = OpenClassicPageCommand.extend({
    defaults: {
      signature: "OpenBlog"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status), type = node && node.get("type");
      return type === 356 || type === 357;
    },
    getUrlQueryParameters: function(node, options) {
      var blog = node.get("type") === 356;
      return {
        func: "ll",
        objAction: blog ? "view" : "viewincontainer",
        objId: node.get("id"),
        nexturl: location.href
      };
    }
  });
  return OpenBlogCommand;
});