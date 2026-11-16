/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/utils/rest.resources", "d2/utils/widget.constants", "dctmw/utils/utils", "d2/utils/server.query.utils" ], function(_, RestResources, widgetConstants, utils, serverQueryUtils) {
  "use strict";
  function BravaViewerPlugin() {}
  _.extend(BravaViewerPlugin.prototype, {
    widgetView: "d2/commands/open.plugins/impl/bravaenterpriseviewer.view",
    getUrl: function() {}
  });
  BravaViewerPlugin.isSupported = function(node) {
    if (utils.isMobile()) {
      return false;
    }
    var currentUser = RestResources.getCurrentUser(), userDefaultWidgets, userHasDefaultBravaEnterpriseViewerWidget;
    var widgetConfig;
    if (node["viewerWidgetName"]) {
      widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAENTERPRISE, node["viewerWidgetName"]);
      if (widgetConfig && widgetConfig.widget_type === widgetConstants.D2.BRAVAENTERPRISE) {
        return true;
      }
      return false;
    }
    if (currentUser && !_.isEmpty(currentUser)) {
      userDefaultWidgets = currentUser.get("defaultWidgets");
      userHasDefaultBravaEnterpriseViewerWidget = userDefaultWidgets && userDefaultWidgets[widgetConstants.DEFAULT.BRAVAENTERPRISE];
    }
    if (userHasDefaultBravaEnterpriseViewerWidget) {
      widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAENTERPRISE, userDefaultWidgets[widgetConstants.DEFAULT.BRAVAENTERPRISE]);
      if (widgetConfig.getParam("brava_enterprise_viewer_type") === "brava_viewer_widget") {
        return true;
      }
    }
    return false;
  };
  return BravaViewerPlugin;
});