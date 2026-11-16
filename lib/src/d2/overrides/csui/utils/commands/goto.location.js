/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commands/goto.location", "d2/utils/contexts/factories/node.navigation" ], function(GotoLocation, NodeNavigationCollctionFactory) {
  "use strict";
  var oldExecute = GotoLocation.prototype.execute;
  GotoLocation.prototype.execute = function(status, options) {
    var context = status.context || options && options.context, nodeNavigationCollection = context && context.getCollection(NodeNavigationCollctionFactory);
    nodeNavigationCollection && nodeNavigationCollection.reset();
    return oldExecute.apply(this, arguments);
  };
});