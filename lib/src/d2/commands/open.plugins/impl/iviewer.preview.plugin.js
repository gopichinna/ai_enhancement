/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/commands/open.plugins/impl/brava.iviewer.plugin", "d2/dialogs/document.preview/document.preview.plugin.mixin" ], function(IntelligentViewerPlugin, DocumentPreviewPluginMixin) {
  "use strict";
  function IntelligentViewerPreviewPlugin() {
    this.ViewerClassPath = "d2/commands/open.plugins/impl/brava.iviewer.view";
    this.isOverridePDF = function(node) {
      return IntelligentViewerPlugin.prototype.isOverridePDF(node);
    };
  }
  IntelligentViewerPreviewPlugin.isSupported = function(node) {
    var enabled = IntelligentViewerPreviewPlugin.shouldShowPreview(node);
    return enabled && IntelligentViewerPlugin.isSupported(node);
  };
  DocumentPreviewPluginMixin.mixin(IntelligentViewerPreviewPlugin.prototype);
  return IntelligentViewerPreviewPlugin;
});