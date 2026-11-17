/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "csui/utils/commandhelper", "csui/utils/commands/open.node.perspective", "csui/controls/form/pub.sub" ], function(require, $, _, CommandHelper, OpenNodePerspectiveCommand, PubSub) {
  "use strict";
  OpenNodePerspectiveCommand.prototype.execute = function(status, options) {
    var deferred = $.Deferred();
    require([ "csui/utils/contexts/factories/next.node", "d2/utils/contexts/factories/node.navigation", "d2/utils/contexts/context.controller", "d2/utils/node.utils" ], function(NextNodeModelFactory, NodeNavigationCollectionFactory, D2ContextController, NodeUtils) {
      var context = status.context || options && options.context, nextNode = context.getModel(NextNodeModelFactory), node = CommandHelper.getJustOneNode(status);
      var view = options && options.originatingView;
      if (context.isEmbeddedMode && !context.isFolderBrowser) {
        context.currentNodeId = node.get("id");
        window.location.hash = "#d2?mode=folderbrowser&allow_back=true&folder_id=" + context.rootNodeId;
      } else {
        var viewState = context.viewStateModel.get("state");
        if (viewState) {
          context.viewStateModel.set("state", _.omit(viewState, "filter"), {
            silent: true
          });
        }
        nextNode.trigger("before:change:id", node, view);
        D2ContextController.setCurrentWidgetInfo(view);
        if (view) {
          D2ContextController.removePreferredWidgetInfo();
          D2ContextController.setWidgetInfo(view);
        } else {
          D2ContextController.removeWidgetInfo();
        }
        if (options && options.selectionNode) {
          NodeUtils.setHighlightNode(options.selectionNode);
        }
        if (nextNode.attributes.id == node.get("id")) {
          PubSub.trigger("d2:highlight:node");
        } else {
          nextNode.set({
            id: node.get("id")
          });
          nextNode.set({
            _is_home_cabinet: node.get("_is_home_cabinet")
          });
          var navigationCollection = context.getCollection(NodeNavigationCollectionFactory);
          navigationCollection.add({
            id: node.get("id"),
            name: node.get("name")
          });
          if (context.isEmbeddedMode) {
            context.visitedNodeHistory.push(node.get("id"));
          }
        }
      }
      deferred.resolve();
    }, function(error) {
      deferred.reject(error);
    });
    return deferred.promise();
  };
});