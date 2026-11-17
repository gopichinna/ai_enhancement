/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/utils/commands/node", "csui/utils/commandhelper", "d2/commands/open.virtual.document", "i18n!d2/commands/nls/localized.strings", "d2/models/virtual.document.children", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/widget.constants", "d2/utils/vdoc.utils" ], function(_, NodeCommand, CommandHelper, OpenVirtualDocument, lang, VirtualDocumentChildren, RestLinkrels, RestResources, widgetConstants, vdUtil) {
  "use strict";
  var OpenVDocSnapshot = OpenVirtualDocument.extend({
    defaults: {
      signature: "D2-OpenVDocSnapshot",
      command_key: "D2-OpenVDocSnapshot",
      name: lang.CommandNameOpenVDocSnapshot,
      scope: "single"
    },
    enabled: function(status, options) {
      var userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), userHasDefaultVDWidget = !!userDefaultWidgets[widgetConstants.DEFAULT.VDOC];
      if (userHasDefaultVDWidget && status.nodes && status.nodes.length === 1) {
        var node = CommandHelper.getJustOneNode(status), collection = node.collection;
        if (node && vdUtil.isVDSnapshot(node) && (!(collection instanceof VirtualDocumentChildren) || !collection.perspectiveNode)) {
          return NodeCommand.prototype.enabled.call(this, status, options);
        }
      }
      return false;
    },
    isAlreadyFetched: function(node) {
      return !!CommandHelper.getOriginalActionLink(node, this.get("signature"), RestLinkrels.VD_SNAPSHOT_NODE_CHILDREN);
    }
  });
  return OpenVDocSnapshot;
});