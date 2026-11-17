/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/commands/open.plugins/impl/csr.preview.plugin", "d2/commands/open.plugins/impl/csrviewer.plugin", "d2/commands/open.plugins/impl/bravaviewer.plugin", "d2/commands/open.plugins/impl/browser.plugin", "d2/commands/open.plugins/impl/brava.iviewer.plugin", "d2/commands/open.plugins/impl/bravaviewer.preview.plugin", "d2/commands/open.plugins/impl/iviewer.preview.plugin", "d2/commands/open.plugins/impl/bravaenterprise/textcompare.preview.plugin", "d2/commands/open.plugins/impl/bravaenterprise/graphicalcompare.preview.plugin", "d2/commands/open.plugins/impl/iviewer/textcompare.preview.plugin", "d2/commands/open.plugins/impl/iviewer/graphicalcompare.preview.plugin" ], function(CSRPreviewPlugin, CsrViewerPlugin, BravaViewerPlugin, BrowserPlugin, BravaIntelligentViewerPlugin, BravaPreviewViewerPlugin, IntelligentViewerPreviewPlugin, BravaTextComparePreviewPlugin, BravaGraphicalComparePreviewPlugin, IVTextComparePreviewPlugin, IVGraphicalComparePreviewPlugin) {
  "use strict";
  var previewPlugins = [ {
    sequence: 60,
    plugin: BravaGraphicalComparePreviewPlugin,
    decides: BravaGraphicalComparePreviewPlugin.isSupported
  }, {
    sequence: 70,
    plugin: BravaTextComparePreviewPlugin,
    decides: BravaTextComparePreviewPlugin.isSupported
  }, {
    sequence: 80,
    plugin: IVGraphicalComparePreviewPlugin,
    decides: IVGraphicalComparePreviewPlugin.isSupported
  }, {
    sequence: 90,
    plugin: IVTextComparePreviewPlugin,
    decides: IVTextComparePreviewPlugin.isSupported
  }, {
    sequence: 100,
    plugin: BravaPreviewViewerPlugin,
    decides: BravaPreviewViewerPlugin.isSupported
  }, {
    sequence: 200,
    plugin: IntelligentViewerPreviewPlugin,
    decides: IntelligentViewerPreviewPlugin.isSupported
  }, {
    sequence: 300,
    plugin: CSRPreviewPlugin,
    decides: CSRPreviewPlugin.isSupported
  } ];
  return previewPlugins.concat([ {
    sequence: 400,
    plugin: BravaViewerPlugin,
    decides: BravaViewerPlugin.isSupported
  }, {
    sequence: 500,
    plugin: BravaIntelligentViewerPlugin,
    decides: BravaIntelligentViewerPlugin.isSupported
  }, {
    sequence: 600,
    plugin: CsrViewerPlugin,
    decides: CsrViewerPlugin.isSupported
  }, {
    sequence: 700,
    plugin: BrowserPlugin,
    decides: BrowserPlugin.isSupported
  } ]);
});