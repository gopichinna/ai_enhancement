/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/utils/commands/open.base", "csui/utils/commands/open.document/delegates/open.document.delegates", "csui/utils/commandhelper" ], function(_, $, OpenBaseCommand, openDocumentDelegates, CommandHelper) {
  "use strict";
  var OpenDocumentCommand = OpenBaseCommand.extend({
    defaults: {
      signature: "OpenDocument"
    },
    openDelegates: openDocumentDelegates.clone(),
    enabled: function(status, options) {
      this.openDelegates = openDocumentDelegates.clone();
      if (!this.openDelegates) {
        return false;
      }
      var node = CommandHelper.getJustOneNode(status);
      if (!node) {
        return false;
      }
      var type = node.get("type");
      if (!(type && _.contains([ "144", "749", "736", "801" ], type.toString()))) {
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
      var fallbackCommand = this.openDelegates.last().get("command");
      return fallbackCommand.enabled(status, options);
    }
  });
  return OpenDocumentCommand;
});