/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/models/nodes", "csui/utils/commandhelper", "nuc/utils/log" ], function(require, _, NodeCollection, CommandHelper, log) {
  "use strict";
  require([ "csui/controls/item.title/impl/otcdropdown.menu/otcdropdown.menu.view" ], function(DropdownMenuView) {
    DropdownMenuView.prototype._triggerMenuItemAction = function(toolItemView, args) {
      this.ui.dropdownToggle.binf_dropdown("toggle");
      var toolItem = args.toolItem;
      var signature = toolItem.get("signature");
      var command = this.commands.get(signature);
      var status = {
        context: this.options.context,
        nodes: new NodeCollection([ this.model ]),
        container: this.model,
        originatingView: this.options.originatingView,
        data: toolItem.get("commandData") || {}
      };
      try {
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        } else if (_.isFunction(command.execute)) {
          var promise = command.execute(status);
          CommandHelper.handleExecutionResults(promise, {
            command: command,
            suppressSuccessMessage: status.suppressSuccessMessage,
            suppressFailMessage: status.suppressFailMessage
          });
        } else {
          this.trigger(signature.toLowerCase(), this);
        }
      } catch (error) {
        log.warn('Executing the command "{0}" failed.\n{1}', command.get("signature"), error.message) && console.warn(log.last);
      }
    };
  });
});