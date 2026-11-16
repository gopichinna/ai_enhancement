/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commands/open.classic.page", "csui/utils/commandhelper", "csui/utils/classic.nodes/classic.nodes" ], function(OpenClassicPageCommand, CommandHelper, classicNodes) {
  "use strict";
  var OpenSpecificClassicPageCommand = OpenClassicPageCommand.extend({
    defaults: {
      signature: "OpenSpecificClassicPage"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get("openable") !== false && classicNodes.isSupported(node);
    },
    getUrl: function(node, options) {
      return classicNodes.getUrl(node);
    }
  });
  return OpenSpecificClassicPageCommand;
});