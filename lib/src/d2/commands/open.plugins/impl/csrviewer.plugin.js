/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/utils/utils" ], function(_, utils) {
  "use strict";
  var nativelySupportedContentTypes = [ "pdf", "tiff", "jpeg", "png", "gif", "bmp" ];
  function CsrViewerPlugin() {}
  _.extend(CsrViewerPlugin.prototype, {
    widgetView: "d2/commands/open.plugins/impl/csrviewer.view",
    getUrl: function() {}
  });
  CsrViewerPlugin.isSupported = function(node) {
    if (utils.isMobile()) {
      return false;
    }
    var formats = node["_download_formats_"], previewFormatAction = node.actions.get("D2-PreviewFormat"), contentType = formats && formats[0] || node.get("d2_preview_format") || previewFormatAction && previewFormatAction.get("commandData")["preview-format"] || node.get("aContentType") || node.get("a_content_type");
    return _.contains(nativelySupportedContentTypes, contentType);
  };
  return CsrViewerPlugin;
});