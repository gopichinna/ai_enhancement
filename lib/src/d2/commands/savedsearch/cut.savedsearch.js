/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "d2/commands/cut", "d2/controls/globalmessage/globalmessage", "d2/utils/clipboard.manager", "d2/utils/widget.constants", "i18n!d2/commands/nls/localized.strings" ], function(_, $, CommandModel, CommandHelper, D2Cut, GlobalMessage, ClipboardManager, widgetConstants, lang) {
  "use strict";
  return D2Cut.extend({
    defaults: {
      signature: "D2-CutSavedSearch",
      command_key: "D2-CutSavedSearch",
      name: lang.CommandNameCutSearchObject,
      scope: "multiple"
    },
    enabled: function(status) {
      var container = status.container, enabled = D2Cut.prototype.enabled.apply(this, arguments);
      if (enabled && container.isAvailablePublic()) {
        enabled = container.searchConfig && container.searchConfig.canCreatePublicSearch;
      }
      return enabled;
    },
    execute: function(status) {
      var parentId, me = this, dfd = $.Deferred(), container = status.container, nodes = CommandHelper.getAtLeastOneNode(status), searchConfig = container.searchConfig, hasError = false, cutData = nodes.map(function(node) {
        parentId = node.get("parent_id");
        if (!parentId) {
          if (searchConfig) {
            parentId = node.isAvailablePublic() ? searchConfig.root_public_category_id : searchConfig.root_private_category_id;
          } else {
            hasError = true;
          }
        }
        return {
          nodeAttributes: _.clone(node.attributes),
          parentId: parentId,
          widgetScope: widgetConstants.D2.SEARCH
        };
      });
      if (hasError) {
        GlobalMessage.showMessage("error", lang.noSearchConfiguration);
        dfd.reject();
      } else {
        ClipboardManager.storeCutItems(cutData);
        me._showGlobalMessage(cutData);
        container.get("id") && container.fetch({
          force: true,
          reload: true
        });
        dfd.resolve();
      }
      return dfd.promise();
    }
  });
});