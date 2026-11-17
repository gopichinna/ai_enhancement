/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "hbs!csui/controls/tree/impl/treeview", "css!csui/controls/tree/impl/treeview" ], function(module, _, $, Backbone, Marionette, TreeViewTemplate) {
  "use strict";
  var TreeRootView = Marionette.CompositeView.extend({
    template: TreeViewTemplate,
    templateHelpers: function() {
      return {
        isNodesExists: this.model.nodes && this.model.nodes.length > 0 ? true : false,
        readonly: this.model.attributes ? this.model.attributes.readonly : false
      };
    },
    tagName: "li",
    childViewContainer: "ul",
    className: "csui-tree-root",
    events: {
      "change otc-checkbox": "onNodeClicked"
    },
    initialize: function() {
      this.collection = this.model.nodes;
    },
    onNodeClicked: function(event) {
      this.trigger("Node:clicked", event.target);
    }
  });
  var TreeView = Marionette.CollectionView.extend({
    tagName: "ul",
    className: "csui-tree-container",
    childView: TreeRootView,
    childEvents: {
      "Node:clicked": "onChildNodeClicked"
    },
    onChildNodeClicked: function(childView, target) {
      if (target.checked) {
        this.trigger("node:selected", target);
      } else {
        this.trigger("node:unselected", target);
      }
    }
  });
  return TreeView;
});