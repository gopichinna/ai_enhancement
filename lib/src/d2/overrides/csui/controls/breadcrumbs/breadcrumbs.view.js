/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/breadcrumbs/breadcrumbs.view", "csui/utils/contexts/factories/next.node", "d2/utils/contexts/factories/node.navigation" ], function(_, BreadcrumbsView, NextNodeModelFactory, NodeNavigationFactory) {
  "use strict";
  BreadcrumbsView.prototype.onClickAncestor = function(model, node) {
    var context = this.context = this.options.context;
    this._nextNode = this.options.node || context.getModel(NextNodeModelFactory);
    if (node.get("id") !== "*") {
      var args = {
        node: node
      }, nodeNavigationCollection = context && context.getCollection(NodeNavigationFactory);
      this.trigger("before:defaultAction", args);
      if (!args.cancel) {
        var nodeId = node.get("id");
        if (this._nextNode.get("id") === nodeId) {
          this._nextNode.unset("id", {
            silent: true
          });
        }
        var viewStateModel = this.context && this.context.viewStateModel;
        var viewState = viewStateModel && viewStateModel.get("state");
        if (viewState) {
          this.context.viewStateModel.set("state", _.omit(viewState, "filter"), {
            silent: true
          });
        }
        this._nextNode.trigger("before:change:id", node, this);
        viewStateModel && viewStateModel.set("browsing", true);
        this._nextNode.set({
          id: nodeId
        });
        this._nextNode.set({
          _is_home_cabinet: node.get("_is_home_cabinet")
        });
        if (nodeNavigationCollection) {
          var navigationArray = [];
          this.collection.some(function(node) {
            navigationArray.push({
              id: node.get("id"),
              name: node.get("name")
            });
            if (node.get("id") === nodeId) {
              return true;
            }
          }, this);
          nodeNavigationCollection.reset(navigationArray);
        }
      }
    }
  };
});