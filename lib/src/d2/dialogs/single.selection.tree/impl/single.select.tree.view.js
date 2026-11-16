/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/controls/tree/tree.view", "hbs!d2/dialogs/single.selection.tree/impl/single.select.tree.table", "dctmw/lib/fancytree/jquery.fancytree.table", "css!d2/dialogs/single.selection.tree/impl/single.select.tree", "d2/dialogs/single.selection.tree/impl/fancytree.ext.single.select.tree" ], function(_, TreeView, templateTreeTable) {
  "use strict";
  var ftAdditionalOptions = [ "filter", "modifyChild", "renderColumns" ];
  return TreeView.extend({
    tagName: "table",
    template: templateTreeTable,
    className: function() {
      return TreeView.prototype.className + " d2-single-select-tree";
    },
    constructor: function SingleSelectTreeView(options) {
      options = options || {};
      var ftOptionsCustom = _.pick(options, ftAdditionalOptions);
      options = _.omit(options, ftAdditionalOptions);
      TreeView.prototype.constructor.call(this, options);
      this.treeOptions = _.extend(this.treeOptions, ftOptionsCustom, {
        extensions: [ "d2-overrides", "filter", "table", "single-select-tree" ]
      });
      this.$el.on("keyup", function(event) {
        if (event.which === 27) {
          event.stopPropagation();
          event.preventDefault();
        }
      });
    },
    onBeforeRender: function() {
      return;
    },
    onShow: function() {
      var retVal = TreeView.prototype.onBeforeRender.apply(this, arguments);
      return retVal;
    }
  });
});