/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/commands/open.plugins/impl/csrviewer.plugin", "d2/dialogs/document.preview/document.preview.plugin.mixin" ], function(CSRViewerPlugin, DocumentPreviewPluginMixin) {
  "use strict";
  function CSRPreviewPlugin() {
    this.ViewerClassPath = "d2/commands/open.plugins/impl/csr.preview.view";
  }
  CSRPreviewPlugin.isSupported = function(node) {
    var enabled = CSRPreviewPlugin.shouldShowPreview(node);
    if (node["popOutWindow"]) {
      return false;
    }
    return enabled && CSRViewerPlugin.isSupported(node);
  };
  DocumentPreviewPluginMixin.mixin(CSRPreviewPlugin.prototype);
  return CSRPreviewPlugin;
});