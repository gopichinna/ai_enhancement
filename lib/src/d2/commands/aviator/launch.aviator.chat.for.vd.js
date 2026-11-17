/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "csui/models/command", "csui/utils/commandhelper", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/commands/aviator/launch.aviator.chat", "d2/controls/globalmessage/globalmessage", "i18n!d2/commands/nls/localized.strings" ], function(module, require, $, _, Backbone, Url, CommandModel, CommandHelper, RestResources, RestLinkrels, LaunchAviatorChat, GlobalMessage, lang) {
  "use strict";
  const LaunchAviatorChatForVDCommand = LaunchAviatorChat.extend({
    defaults: {
      signature: "Aviator-LaunchChatForVD",
      command_key: "Aviator-LaunchChatForVD",
      name: lang.CommandLaunchAviatorChat,
      scope: "single"
    },
    enabled: function(status, options) {
      return CommandModel.prototype.enabled.call(this, status, options);
    },
    resolveNodesForChat: function(status) {
      let node = CommandHelper.getJustOneNode(status);
      node = node.clone();
      const deferred = $.Deferred(), href = Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF), "objects", node.get("id"), "aviator-enabled-vd-nodes");
      $.ajax(node.connector.extendAjaxOptions({
        url: href,
        success: function(result) {
          node.set("av4rAlliedObjectIds", result?.entries?.map(model => model.id));
          deferred.resolve([ node ]);
        },
        error: function(result) {
          GlobalMessage.showMessage("error", result.responseJSON.message);
          deferred.reject(result.responseJSON.message);
        }
      }));
      return deferred.promise();
    },
    getViewableNodes: function() {
      return [];
    }
  });
  return LaunchAviatorChatForVDCommand;
});