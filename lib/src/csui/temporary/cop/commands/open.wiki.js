/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/utils/url", "csui/utils/commandhelper", "csui/utils/commands/open.classic.page" ], function($, Url, CommandHelper, OpenClassicPageCommand) {
  "use strict";
  var OpenWikiCommand = OpenClassicPageCommand.extend({
    defaults: {
      signature: "OpenWiki"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status), type = node && node.get("type");
      return type === 5573 || type === 5574;
    },
    getUrl: function(node, options) {
      var url = OpenClassicPageCommand.prototype.getUrl.apply(this, arguments), wiki = node.get("type") === 5573;
      return wiki ? url : Url.combine(url, "open", node.get("id"));
    },
    getUrlQueryParameters: function(node, options) {
      var wiki = node.get("type") === 5573;
      if (wiki) {
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
  return OpenWikiCommand;
});