/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commands/inlineedit", "csui/utils/commandhelper" ], function(InlineEdit, CommandHelper) {
  "use strict";
  return InlineEdit.extend({
    defaults: {
      signature: "D2-RenameSearchCategory",
      command_key: [ "rename", "Rename" ],
      scope: "single"
    },
    enabled: function(status) {
      var container = status.container, node = CommandHelper.getJustOneNode(status), enabled = status.nodes && status.nodes.length === 1 && node.isCategoryNode() && InlineEdit.prototype.enabled.apply(this, arguments);
      if (enabled && container.isAvailablePublic()) {
        enabled = container.searchConfig && container.searchConfig.canCreatePublicSearch;
      }
      return enabled;
    }
  });
});