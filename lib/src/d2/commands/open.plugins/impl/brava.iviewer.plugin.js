/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
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
    var widgetConfig, status = false;
    if (node["viewerWidgetName"]) {
      widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAIV, node["viewerWidgetName"]);
      if (widgetConfig && widgetConfig.widget_type === "OpenTextIntelligentViewingWidget") {
        status = true;
      }
    } else {
      var currentUser = RestResources.getCurrentUser(), userDefaultWidgets, userHasDefaultBravaIntelligentViewerWidget;
      if (currentUser && !_.isEmpty(currentUser)) {
        userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), 
        userHasDefaultBravaIntelligentViewerWidget = userDefaultWidgets && userDefaultWidgets[widgetConstants.DEFAULT.BRAVAIV];
      }
      if (userHasDefaultBravaIntelligentViewerWidget) {
        widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAIV, userDefaultWidgets[widgetConstants.DEFAULT.BRAVAIV]);
        if (widgetConfig.widget_type === "OpenTextIntelligentViewingWidget") {
          status = true;
        }
      }
    }
    if (!status) {
      return false;
    }
    var overridePDF = widgetConfig.widgetParams["is_override_pdf_config"];
    if (nativelySupportedContentTypes.length === 0) {
      nativelySupportedContentTypes = getAllContentTypes();
    }
    var formats = node["_download_formats_"], previewFormatAction = node.actions.get("D2-PreviewFormat"), contentType = node.get("aContentType") || node.get("a_content_type") || formats && formats[0];
    if (!overridePDF) {
      contentType = formats && formats[0] || node.get("d2_preview_format") || previewFormatAction && previewFormatAction.get("commandData")["preview-format"] || node.get("aContentType") || node.get("a_content_type");
    }
    if (_.contains(nativelySupportedContentTypes, contentType)) {
      return true;
    }
    return false;
  };
  return BravaIntelligentViewerPlugin;
});