/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/utils/constants", "d2/commands/open.plugins/impl/bravaviewer.plugin", "d2/dialogs/document.preview/document.preview.plugin.mixin" ], function(constants, BravaViewerPlugin, DocumentPreviewPluginMixin) {
  "use strict";
  function BravaViewerTextComparePreviewPlugin() {
    this.ViewerClassPath = "d2/commands/open.plugins/impl/bravaenterprise/textcompareviewer.view";
  }
  BravaViewerTextComparePreviewPlugin.isSupported = function(node) {
    var enable = BravaViewerPlugin.isSupported(node);
    if (enable && node.previewType === constants.ComparableDocumentPreviewTypes.TEXT_COMPARE) {
      return true;
    }
    return false;
  };
  DocumentPreviewPluginMixin.mixin(BravaViewerTextComparePreviewPlugin.prototype);
  return BravaViewerTextComparePreviewPlugin;
});