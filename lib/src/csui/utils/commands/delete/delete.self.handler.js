/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore" ], function($, _) {
  function goBackToFolder(id, context) {
    var viewStateModel = context.viewStateModel;
    if (viewStateModel) {
      var historyEntry = viewStateModel.getLastHistoryEntry();
      if (historyEntry && historyEntry.fragment === "nodes/" + id) {
        viewStateModel.set("replaceURL", true);
        viewStateModel.restoreLastFragment();
        return true;
      }
    }
  }
  return function(node, options) {
    var context = options && options.context;
    if (context && context.hasModel("nextNode")) {
      var nextNode = context.getModel("nextNode");
      var parent = node.get("parent_id");
      if (parent) {
        var id = parent.id || parent;
        if (!goBackToFolder(id, context)) {
          nextNode.set("id", id);
        }
      }
    }
  };
});