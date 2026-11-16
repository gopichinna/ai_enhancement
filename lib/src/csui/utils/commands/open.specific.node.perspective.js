/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commands/open.node.perspective", "csui/utils/commandhelper", "csui/utils/smart.nodes/smart.nodes", "i18n!csui/utils/commands/nls/localized.strings" ], function(OpenNodePerspectiveCommand, CommandHelper, smartNodes, lang) {
  "use strict";
  var OpenSpecificNodePerspectiveCommand = OpenNodePerspectiveCommand.extend({
    defaults: {
      signature: "OpenSpecificNodePerspective",
      name: lang.CommandNameDocumentOverview
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get("openable") !== false && smartNodes.isSupported(node);
    }
  });
  return OpenSpecificNodePerspectiveCommand;
});