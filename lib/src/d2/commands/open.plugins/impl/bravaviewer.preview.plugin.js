/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/commands/open.plugins/impl/bravaviewer.plugin", "d2/dialogs/document.preview/document.preview.plugin.mixin" ], function(BravaViewerPlugin, DocumentPreviewPluginMixin) {
  "use strict";
  function BravaViewerPreviewPlugin() {
    this.ViewerClassPath = "d2/commands/open.plugins/impl/bravaenterpriseviewer.view";
  }
  BravaViewerPreviewPlugin.isSupported = function(node) {
    var enabled = BravaViewerPreviewPlugin.shouldShowPreview(node);
    return enabled && BravaViewerPlugin.isSupported(node);
  };
  DocumentPreviewPluginMixin.mixin(BravaViewerPreviewPlugin.prototype);
  return BravaViewerPreviewPlugin;
});