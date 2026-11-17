/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/utils/constants", "d2/commands/open.plugins/impl/brava.iviewer.plugin", "d2/dialogs/document.preview/document.preview.plugin.mixin" ], function(constants, IViewerPlugin, DocumentPreviewPluginMixin) {
  "use strict";
  function IViewerGraphicalComparePlugin() {
    this.ViewerClassPath = "d2/commands/open.plugins/impl/iviewer/graphicalcompareviewer.view";
  }
  IViewerGraphicalComparePlugin.isSupported = function(node) {
    var enable = IViewerPlugin.isSupported(node);
    if (enable && node.previewType === constants.ComparableDocumentPreviewTypes.GRAPHICAL_COMPARE) {
      return true;
    }
    return false;
  };
  DocumentPreviewPluginMixin.mixin(IViewerGraphicalComparePlugin.prototype);
  return IViewerGraphicalComparePlugin;
});