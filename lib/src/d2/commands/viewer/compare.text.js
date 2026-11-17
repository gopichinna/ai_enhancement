/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/underscore", "csui/utils/commandhelper", "d2/controls/globalmessage/globalmessage", "d2/commands/viewer/compare.base.command", "d2/commands/open.plugins/impl/bravaviewer.preview.plugin", "d2/commands/open.plugins/impl/iviewer.preview.plugin", "d2/dialogs/document.preview/document.preview.plugins", "d2/dialogs/document.preview/document.preview.plugin.mixin", "d2/utils/constants", "d2/utils/server.query.utils", "d2/utils/widget.constants", "dctmw/utils/rest.resources", "d2/commands/open.plugins/impl/iviewer/utils", "i18n!d2/commands/nls/localized.strings" ], function($, Backbone, _, CommandHelper, GlobalMessage, CompareBaseCommand, BravaViewerPreviewPlugin, IViewerPreviewPlugin, docPreviewPlugins, DocumentPreviewPluginMixin, constants, serverQueryUtils, widgetConstants, RestResources, iviewerUtils, lang) {
  "use strict";
  var CompareText = CompareBaseCommand.extend({
    defaults: {
      signature: "D2-CompareText",
      command_key: "D2-CompareText",
      name: lang.CompareTextName,
      scope: "multiple"
    },
    enabled: function(status) {
      var enable = false;
      if (status.nodes && status.nodes.length === 2) {
        var node = status.nodes.at(0);
        var previewPlugin = node && docPreviewPlugins.findByNode(node);
        this.isIViewer = previewPlugin instanceof IViewerPreviewPlugin;
        this.isBravaViewer = previewPlugin instanceof BravaViewerPreviewPlugin;
        var userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets");
        var ivTextEnabled = false, ivWidgetConfiguration = null;
        if (this.isIViewer && userDefaultWidgets && !_.isEmpty(userDefaultWidgets)) {
          ivWidgetConfiguration = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAIV, userDefaultWidgets[widgetConstants.DEFAULT.BRAVAIV]);
          ivTextEnabled = ivWidgetConfiguration["widgetParams"] && ivWidgetConfiguration["widgetParams"]["is_iv_t_compare_enabled"];
        }
        if ((this.isBravaViewer || this.isIViewer && ivTextEnabled) && this.validateContentTypeOfAllNodes(status.nodes)) {
          enable = true;
        }
        if (this.isIViewer && iviewerUtils.hasRegularLicense === 0) {
          enable = false;
        }
      }
      return enable;
    },
    validateContentTypeOfAllNodes: function(nodeCollection) {
      var valid = true, supportedContentTypes = this.getAllSupportedContentTypesForTextCompare(this.isIViewer);
      nodeCollection.each(function(node) {
        var contentType = this.getContentType(node);
        if (!supportedContentTypes[contentType]) {
          valid = false;
        }
      }, this);
      return valid;
    },
    execute: function(status, options) {
      this.previewNodes.reset(status.nodes.map(function(node) {
        var cloneNode = node.clone();
        return cloneNode;
      }));
      var node = this.previewNodes.at(0);
      this.previewNodes.originalNodes = status.nodes;
      this.previewNodes.each(function(node) {
        node.previewType = constants.ComparableDocumentPreviewTypes.TEXT_COMPARE;
      });
      status.suppressSuccessMessage = true;
      var context = status.context || options.context;
      this.openDocumetPreview(context, node);
    },
    openDocumetPreview: function(context, node) {
      return this._openDocumentPreview({
        context: context,
        node: node,
        nodes: this.previewNodes,
        highlightElement: false
      });
    }
  });
  DocumentPreviewPluginMixin.mixin(CompareText.prototype);
  return CompareText;
});