/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "dctmw/lib/fancytree/jquery.fancytree" ], function($) {
  "use strict";
  $.ui.fancytree.registerExtension({
    name: "single-select-tree",
    version: "1.0.0",
    nodeKeydown: function(ctx) {
      if (!ctx.node || ctx.node && ctx.node.data && ctx.node.data.creationNode === true) {
        return;
      } else if (ctx.originalEvent && ctx.originalEvent.type === "keydown" && (ctx.originalEvent.which === 13 || ctx.originalEvent.which === 32)) {
        var $nodeTitleEl = $(ctx.node.tr).find(".d2-tree-node-title");
        $nodeTitleEl.trigger("focus");
        return;
      }
      return this._superApply(arguments);
    },
    nodeSetFocus: function(ctx) {
      if (ctx.node && ctx.node.data && ctx.node.data.creationNode === true) {
        return;
      }
      ctx && ctx.node && ctx.node.makeVisible();
      this._superApply(arguments);
    }
  });
  return $.ui.fancytree;
});