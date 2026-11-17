/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commands/goto.location", "csui/utils/commandhelper", "d2/utils/contexts/factories/node.navigation", "dctmw/server.adaptors/converters/node" ], function(GotoLocation, CommandHelper, NodeNavigationCollctionFactory, nodeConverter) {
  "use strict";
  var oldExecute = GotoLocation.prototype.execute;
  GotoLocation.prototype.execute = function(status, options) {
    var context = status.context || options && options.context, nodeNavigationCollection = context && context.getCollection(NodeNavigationCollctionFactory);
    nodeNavigationCollection && nodeNavigationCollection.reset();
    if (status) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      nodes.each(node => {
        if (node && node.parent && node.parent.fetched !== true) {
          var parentId = node.parent.get("id"), properties = {
            id: parentId
          };
          nodeConverter.setNodeType(properties);
          node.parent.set("type", properties.type);
        }
      });
    }
    return oldExecute.apply(this, arguments);
  };
});