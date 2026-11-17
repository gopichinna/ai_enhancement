/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/underscore", "csui/models/command", "d2/utils/constants", "csui/utils/commandhelper", "d2/commands/viewer/compare.base.command", "d2/dialogs/document.preview/document.preview.plugins", "d2/commands/open.plugins/impl/bravaviewer.preview.plugin", "d2/dialogs/viewer.markup.selection/select.markup.dialog", "i18n!d2/commands/nls/localized.strings" ], function(require, $, Backbone, _, CommandModel, constants, CommandHelper, CompareBaseCommand, docPreviewPlugins, BravaViewerPreviewPlugin, SelectMarkupDialog, lang) {
  "use strict";
  var DocumentMerge = CompareBaseCommand.extend({
    defaults: {
      signature: "D2-DocumentMerge",
      command_key: "D2-DocumentMerge",
      name: lang.DocumentMerge,
      scope: "multiple"
    },
    enabled: function(status) {
      var enable = false;
      var node = status.nodes.at(0);
      var previewPlugin = node && docPreviewPlugins.findByNode(node);
      this.bravaViewer = previewPlugin instanceof BravaViewerPreviewPlugin;
      if (this.bravaViewer && this.validateContentTypeOfAllNodes(status.nodes)) {
        enable = true;
      }
      return enable;
    },
    validateContentTypeOfAllNodes: function(nodeCollection) {
      var valid = true, supportedContentTypes = this.getAllSupportedContentTypesForGraphicalCompare(false);
      nodeCollection.each(function(node) {
        var contentType = this.getContentType(node);
        if (!supportedContentTypes[contentType]) {
          valid = false;
        }
      }, this);
      return valid;
    },
    execute: function(status) {
      var deferred = $.Deferred(), me = this;
      this.options = {
        nodes: status.nodes,
        context: status.context,
        connector: status.container.connector
      };
      status.suppressSuccessMessage = true;
      var selectMarkupDialog = new SelectMarkupDialog(this.options);
      selectMarkupDialog.show().done(function(selectedMarkup) {
        me._openViewer(status, selectedMarkup);
        deferred.resolve();
      }).fail(function() {
        deferred.reject("close");
      });
      return deferred.promise();
    },
    _openViewer: function(status, selectedMarkup) {
      var deferred = $.Deferred(), node = status.nodes.at(0);
      require([ "csui/utils/commands/impl/full.page.modal/full.page.modal.view", "d2/commands/open.plugins/impl/bravaenterprise/document.merge.view" ], function(FullPageModal, ViewerView) {
        var viewerView = new ViewerView({
          context: status.context,
          model: node,
          previewNodes: status.nodes,
          selectedMarkup: selectedMarkup
        }), fullPageModal = new FullPageModal({
          view: viewerView
        });
        fullPageModal.on("destroy", function() {
          deferred.resolve();
        }).show();
      }, function(e) {
        console.log(e);
      });
      return deferred.promise();
    }
  });
  return DocumentMerge;
});