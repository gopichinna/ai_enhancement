/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/utils/contexts/perspective/plugins/node/node.perspective.context.plugin", "d2/utils/constants", "d2/utils/widgets.utils" ], function(_, NodePerspectiveContextPlugin, constants, widgetUtils) {
  "use strict";
  var orig_changePerspective = NodePerspectiveContextPlugin.prototype._changePerspective, oldNodeFetchFailure = NodePerspectiveContextPlugin.prototype.onNodeFetchFailure;
  NodePerspectiveContextPlugin.prototype._changePerspective = function() {
    var children = this.context.hasCollection("children") && this.context.getCollection("children") || this.context.hasCollection("children2") && this.context.getCollection("children2");
    children && _.isFunction(children.resetLimit) && children.resetLimit();
    orig_changePerspective.apply(this, arguments);
  }, NodePerspectiveContextPlugin.prototype.onNodeFetchFailure = function() {
    oldNodeFetchFailure.apply(this, arguments);
    widgetUtils.clearFolderPathInfo(this.nextNode?.widgetName);
  };
});