/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "dctmw/utils/rest.resources", "d2/utils/widget.constants", "csui/models/command", "csui/utils/commandhelper", "dctmw/utils/client.location" ], function($, RestResources, widgetConstants, CommandModel, CommandHelper, clientLocation) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-GoToD2Collection",
      command_key: "D2-GoToD2Collection",
      scope: "single"
    },
    execute: function(status) {
      var deferred = $.Deferred(), node = CommandHelper.getJustOneNode(status), defaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), defaultCollectionWidget = defaultWidgets && defaultWidgets[widgetConstants.DEFAULT.COLLECTIONS];
      const encodedD2COollectionUrl = encodeURIComponent(defaultCollectionWidget + "&filter={}");
      const collectionId = node.get("collectionId") || node.get("id");
      if (collectionId) {
        if (status.originatingView && status.originatingView.options.isCollectionsListView) {
          status.originatingView.onClickItem(status.originatingView.children.findByModelCid(node.cid));
        } else {
          clientLocation.navigate(clientLocation.modularizeFragment("#d2/collection?widget_name=" + encodedD2COollectionUrl + "&collection-id=" + collectionId), {
            trigger: true,
            reload: true
          });
        }
        deferred.resolve();
      } else {
        deferred.reject();
      }
      return deferred.promise();
    }
  });
});