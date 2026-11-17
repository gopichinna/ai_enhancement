/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/utils/server.query.utils", "d2/utils/widget.constants", "d2/commands/open.plugins/impl/iviewer/utils" ], function(_, RestResources, utils, serverQueryUtils, widgetConstants, iviewerUtils) {
  "use strict";
  var nativelySupportedContentTypes = [];
  function getAllContentTypes() {
    var contentTypes = [], formatCollection = RestResources.getFormats(), userInfo;
    var userSupportedExtensions = {};
    iviewerUtils.getIVUserInfo().done(uInfo => {
      userInfo = uInfo;
    });
    if (userInfo && userInfo["supported_extensions"] && userInfo["supported_extensions"].length > 0) {
      userSupportedExtensions = _.reduce(userInfo["supported_extensions"], function(result, value) {
        result[value] = value;
        return result;
      }, {});
    } else {
      console.log("Not found user supported extensions");
    }
    if (formatCollection && !_.isEmpty(formatCollection)) {
      formatCollection.each(function(data) {
        if (userSupportedExtensions[data.get("dos_extension")]) {
          contentTypes.push(data.get("name"));
        }
      });
    }
    return contentTypes;
  }
  function BravaIntelligentViewerPlugin() {}
  _.extend(BravaIntelligentViewerPlugin.prototype, {
    widgetView: "d2/commands/open.plugins/impl/brava.iviewer.view",
    getUrl: function() {},
    isOverridePDF: function(node) {
      var userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets");
      var widgetName = node["viewerWidgetName"] ? node["viewerWidgetName"] : userDefaultWidgets[widgetConstants.DEFAULT.BRAVAIV];
      var widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAIV, widgetName);
      return widgetConfig.widgetParams["is_override_pdf_config"] ? true : false;
    }
  });
  BravaIntelligentViewerPlugin.isSupported = function(node) {
    if (utils.isMobile()) {
      return false;
    }
    const widgetConfig = getWidgetConfigForNode(node);
    if (!widgetConfig || widgetConfig.widget_type !== widgetConstants.D2.BRAVAIV) {
      return false;
    }
    const overridePDF = widgetConfig.widgetParams["is_override_pdf_config"];
    const contentType = getContentType(node, overridePDF);
    if (nativelySupportedContentTypes.length === 0) {
      nativelySupportedContentTypes = getAllContentTypes();
    }
    return _.contains(nativelySupportedContentTypes, contentType);
  };
  function getWidgetConfigForNode(node) {
    let widgetConfig, userHasIVConfigParam;
    if (node["viewerWidgetName"]) {
      widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAIV, node["viewerWidgetName"]);
    } else {
      const currentUser = RestResources.getCurrentUser();
      if (currentUser && !_.isEmpty(currentUser)) {
        const userDefaultWidgets = currentUser.get("defaultWidgets");
        const userHasDefaultBravaIntelligentViewerWidget = userDefaultWidgets && userDefaultWidgets[widgetConstants.DEFAULT.BRAVAIV];
        const widgetPreferenceName = getWidgetPreferenceName(node);
        const widgetPreferenceType = getWidgetPreferenceType(node);
        if (widgetPreferenceName && serverQueryUtils.getWidgetConfig(widgetPreferenceType, widgetPreferenceName).widgetParams !== undefined) {
          userHasIVConfigParam = serverQueryUtils.getWidgetConfig(widgetPreferenceType, widgetPreferenceName).widgetParams["iv_viewer_smartview"];
          if (userHasIVConfigParam) {
            widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAIV, userHasIVConfigParam);
          }
        }
        if (!userHasIVConfigParam && userHasDefaultBravaIntelligentViewerWidget) {
          widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAIV, userDefaultWidgets[widgetConstants.DEFAULT.BRAVAIV]);
        }
      }
    }
    return widgetConfig;
  }
  function getWidgetPreferenceName(node) {
    return node.widgetDetails?.widgetName || node.collection?.widgetPreference?.widgetName || node.widgetName || node.collection?.options?.widgetName;
  }
  function getWidgetPreferenceType(node) {
    return node.widgetDetails?.widgetType || node.collection?.widgetPreference?.widgetType || node.widgetType || node.collection?.widgetType || node.collection?.options?.widgetType;
  }
  function getContentType(node, overridePDF) {
    let contentType = node.get("aContentType") || node.get("a_content_type");
    if (!overridePDF) {
      contentType = node["_download_formats_"] && node["_download_formats_"][0] || node.get("d2_preview_format") || node.actions.get("D2-PreviewFormat") && node.actions.get("D2-PreviewFormat").get("commandData")["preview-format"] || node.get("aContentType") || node.get("a_content_type");
    }
    return contentType;
  }
  return BravaIntelligentViewerPlugin;
});