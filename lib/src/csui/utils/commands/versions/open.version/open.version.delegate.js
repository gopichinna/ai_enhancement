/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/utils/commands/open.base", "csui/utils/commands/versions/open.version/delegates/open.version.delegates", "csui/utils/commandhelper" ], function(_, $, OpenBaseCommand, openVersionDelegates, CommandHelper) {
  "use strict";
  var OpenVersionDelegateCommand = OpenBaseCommand.extend({
    defaults: {
      signature: "OpenVersionDelegate"
    },
    openDelegates: openVersionDelegates.clone(),
    enabled: function(status, options) {
      this.openDelegates = openVersionDelegates.clone();
      if (!this.openDelegates) {
        return false;
      }
      const node = CommandHelper.getJustOneNode(status);
      if (!node) {
        return false;
      }
      const type = node.get("type"), supportedTypes = [ "144", "749", "736", "801" ];
      if (!(type && supportedTypes.indexOf(type.toString()) >= 0)) {
        return false;
      }
      var self = this, excludeCommands = status?.commandData?.exclude || [];
      if (!!excludeCommands.length) {
        var filteredCommandlist = self.openDelegates.models.filter(function(model) {
          if (excludeCommands.indexOf(model.get("command").get("signature")) < 0) {
            return model;
          }
        });
        self.openDelegates.models = filteredCommandlist;
        self.openDelegates.length = filteredCommandlist.length;
        const command = this.openDelegates.findByNode(node, status, options);
        if (command) {
          return true;
        } else {
          return false;
        }
      }
      const fallbackCommand = this.openDelegates.last().get("command");
      return fallbackCommand.enabled(status, options);
    }
  });
  return OpenVersionDelegateCommand;
});