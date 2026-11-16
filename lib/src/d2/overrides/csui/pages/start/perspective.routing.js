/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "csui/pages/start/perspective.routing", "dctmw/server.adaptors/converters/node", "i18n!csui/pages/start/nls/lang", "i18n!csui/pages/start/impl/nls/lang" ], function(require, $, _, PerspectiveRouting, nodeConverter, publicLang, publicLang2) {
  "use strict";
  var oldInstance = PerspectiveRouting.getInstance;
  var nodeRouter = null;
  require([ "csui/pages/start/impl/node.perspective.router" ], function(NodePerspectiveRouter) {
    PerspectiveRouting.getInstance = function() {
      var instance = oldInstance.apply(this, arguments);
      nodeRouter = _.find(instance._routers, function(router) {
        return router instanceof NodePerspectiveRouter;
      });
      nodeRouter.nextNode.off("change:id", nodeRouter._updatePageTitle, nodeRouter);
      nodeRouter.nextNode.off("change:name", nodeRouter._updatePageTitle, nodeRouter);
      nodeRouter.listenTo(nodeRouter.nextNode, "change:id", updatePageTitle);
      nodeRouter.listenTo(nodeRouter.nextNode, "change:name", updatePageTitle);
      return instance;
    };
  });
  function updatePageTitle() {
    if (!nodeRouter.nextNode.has("name")) {
      document.title = _.str.sformat(publicLang2.NodeLoadingTitle, nodeRouter.nextNode.get("id"));
    } else if (nodeConverter.isFavoritesNode(nodeRouter.nextNode.get("id"))) {
      document.title = _.str.sformat(publicLang.FavoritesNodeTitle, nodeRouter.nextNode.get("type_name"), publicLang.ProductName);
    } else {
      document.title = _.str.sformat(publicLang.NodeTitle, nodeRouter.nextNode.get("name"), nodeRouter.nextNode.get("type_name"), publicLang.ProductName);
    }
    nodeRouter._updateBackToTitle();
  }
});