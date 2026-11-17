/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "csui/integration/folderbrowser/commands/go.to.node.history" ], function(require, $, _, GoToNodeHistoryCommand) {
  "use strict";
  require([ "csui/utils/contexts/factories/next.node" ], function(NextNodeModelFactory) {
    var proto = GoToNodeHistoryCommand.prototype;
    _.extend(proto, {
      enabled: function(status, options) {
        var context = status.context || options && options.context, isEnabled = context.visitedNodeHistory && context.visitedNodeHistory.length > 1;
        return isEnabled;
      },
      execute: function(status, options) {
        var deferred = $.Deferred(), context = status.context || options && options.context, nextNode = context.getModel(NextNodeModelFactory);
        if (context.visitedNodeHistory.length > 1) {
          context.visitedNodeHistory.pop();
          var nextNodeId = context.visitedNodeHistory[context.visitedNodeHistory.length - 1];
          if (nextNodeId === "search") {
            context.visitedNodeHistory.pop();
            window.history.go(-1);
          } else {
            nextNode.set("id", nextNodeId);
          }
        }
        return deferred.resolve().promise();
      }
    });
  });
});