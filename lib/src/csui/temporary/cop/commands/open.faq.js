/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/utils/commandhelper", "csui/utils/commands/open.classic.page" ], function($, CommandHelper, OpenClassicPageCommand) {
  "use strict";
  var OpenFaqCommand = OpenClassicPageCommand.extend({
    defaults: {
      signature: "OpenFAQ"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status), type = node && node.get("type");
      return type === 123475 || type === 123476;
    },
    getUrlQueryParameters: function(node, options) {
      var faq = node.get("type") === 123475, urlQuery = $.param({
        func: "ll",
        objAction: "view",
        objId: faq ? node.get("id") : node.get("volume_id"),
        nexturl: location.href
      });
      return faq ? urlQuery : urlQuery + "#entry_" + node.get("id");
    }
  });
  return OpenFaqCommand;
});