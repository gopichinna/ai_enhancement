/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/utils/log", "csui/utils/commands", "csui/controls/globalmessage/globalmessage", "csui/utils/commandhelper" ], function(module, _, $, Backbone, log, commands, GlobalMessage, CommandHelper) {
  "use strict";
  log = log(module.id);
  function CommandController(options) {
    options || (options = {});
    this.commands = options.commands || commands;
  }
  _.extend(CommandController.prototype, {
    executeAction: function(action, status, options) {
      var signature = action.get("signature"), command = this.commands.findWhere({
        signature: signature
      });
      try {
        if (!command) {
          throw new Error("Invalid command: " + signature);
        }
        var promises = command.execute(status, options);
        if (!_.isArray(promises)) {
          promises = [ promises ];
        }
        return $.when.apply($, promises).fail(function(error) {
          if (error) {
            if (!CommandHelper.showOfflineMessage(error)) {
              if (!error.message) {
                log.warn("Command " + signature + " did not throw error as object.");
              }
              GlobalMessage.showMessage("error", error.message ? error.message : error);
            }
          }
        });
      } catch (error) {
        log.warn('Executing the command "{0}" failed.\n{1}', !!command && command.get("signature"), error.stack) && console.warn(log.last);
      }
    }
  });
  CommandController.extend = Backbone.View.extend;
  return CommandController;
});