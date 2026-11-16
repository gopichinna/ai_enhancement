/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/models/command", "csui/utils/commands/multiple.items" ], function(_, CommandModel, MultipleItemsCommand) {
  var NodeCommand = CommandModel.extend({
    _performAction: function(node, options) {
      throw new Error("Method not implemented in the descendant command.");
    }
  });
  _.extend(NodeCommand.prototype, MultipleItemsCommand);
  return NodeCommand;
});