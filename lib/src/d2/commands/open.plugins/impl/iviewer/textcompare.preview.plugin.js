/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/utils/constants", "d2/commands/open.plugins/impl/brava.iviewer.plugin", "d2/dialogs/document.preview/document.preview.plugin.mixin" ], function(constants, IViewerPlugin, DocumentPreviewPluginMixin) {
  "use strict";
  function IViewerTextComparePreviewPlugin() {
    this.ViewerClassPath = "d2/commands/open.plugins/impl/iviewer/textcompareviewer.view";
  }
  IViewerTextComparePreviewPlugin.isSupported = function(node) {
    var enable = IViewerPlugin.isSupported(node);
    if (enable && node.previewType === constants.ComparableDocumentPreviewTypes.TEXT_COMPARE) {
      return true;
    }
    return false;
  };
  DocumentPreviewPluginMixin.mixin(IViewerTextComparePreviewPlugin.prototype);
  return IViewerTextComparePreviewPlugin;
});