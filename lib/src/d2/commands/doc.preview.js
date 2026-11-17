/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "dctmw/utils/rest.resources", "csui/models/command", "csui/utils/commandhelper", "csui/utils/commands/open.plugins/open.plugins", "csui/utils/commands/open.document/delegates/open.document.delegates", "d2/dialogs/document.preview/document.preview.plugin.mixin", "d2/dialogs/document.preview/document.preview.plugins", "d2/commands/open.plugins/impl/iviewer.preview.plugin", "d2/models/workflow/task.files", "d2/utils/constants", "d2/utils/server.query.utils", "d2/utils/widget.constants", "nuc/utils/url", "nuc/models/node.children2/node.children2", "d2/controls/globalmessage/globalmessage", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, Backbone, RestResources, CommandModel, CommandHelper, openPlugins, openDocumentDelegates, DocumentPreviewPluginMixin, docPreviewPlugins, IViewerPreviewPlugin, TaskFileCollection, constants, serverQueryUtils, widgetConstants, Url, NodeChildren2Collection, GlobalMessage, lang) {
  "use strict";
  var DocPreviewCommand = CommandModel.extend({
    defaults: {
      signature: "DocPreview",
      command_key: "DocPreview",
      scope: "multiple",
      name: lang.DocumentPreview
    },
    enabled: function(status, options) {
      var node = CommandHelper.getJustOneNode(status), disablePreview = status && status.targetView && status.targetView.disablePreview, previewPlugin = node && docPreviewPlugins.findByNode(node);
      if (!disablePreview && previewPlugin && this.collection) {
        var openDelegates = openDocumentDelegates.findByNode(node, status, options), openDelegateCmd = (openDelegates.get("signature") || "").toLowerCase(), plugin = openPlugins.findByNode(node, {
          openInNewTab: false
        });
        if (openDelegateCmd !== "open" || !plugin || plugin.widgetView !== this.widgetView) {
          return true;
        }
      }
      var isMultiFileViewQualified = true;
      var modelObjects = status.nodes.models;
      if (modelObjects.length >= 1 && (status.collection instanceof NodeChildren2Collection || status.collection instanceof TaskFileCollection) && modelObjects.length <= RestResources.getD2Options().max_files_allowed_for_multifile_view_iv) {
        for (var i = 0; i < modelObjects.length; i++) {
          var selectedItem = modelObjects[i];
          var previewPluginAvailable = docPreviewPlugins.findByNode(selectedItem);
          if (previewPluginAvailable === undefined || !(previewPluginAvailable instanceof IViewerPreviewPlugin)) {
            isMultiFileViewQualified = false;
            break;
          }
        }
        return isMultiFileViewQualified;
      }
      return false;
    },
    execute: function(status, options) {
      options = options || {};
      var me = this, deferred = $.Deferred();
      status.suppressSuccessMessage = true;
      status.suppressFailMessage = true;
      var originatingView = status.originatingView && status.originatingView.options && status.originatingView.options.originatingView ? status.originatingView.options.originatingView : status.originatingView, highlightElement = originatingView && originatingView.$el.find($(event.target)).closest("tr");
      if (highlightElement && !highlightElement.length) {
        highlightElement = originatingView && originatingView.$el.find("tr.binf-active");
      }
      let node;
      let cloneNodes;
      if (status.nodes.models.length > 1) {
        cloneNodes = new Backbone.Collection(status.nodes.map(function(node) {
          return node.clone();
        }));
        node = cloneNodes.at(0);
        cloneNodes.each(function(node) {
          node.previewType = constants.ComparableDocumentPreviewTypes.MULTI_FILE_VIEW;
        });
      } else {
        node = CommandHelper.getJustOneNode(status);
      }
      if (status.nodes.models.length === 1) {
        me.isMipProtected(status, node).done(function(isEnabled) {
          if (isEnabled) {
            deferred.resolve();
          } else {
            me._openDocumentPreview({
              context: status.context || options.context,
              node: node,
              nodes: cloneNodes,
              highlightElement: highlightElement
            }).done(deferred.resolve).fail(deferred.reject);
          }
        }).fail(deferred.reject);
        return deferred.promise();
      }
      return this._openDocumentPreview({
        context: status.context || options.context,
        node: node,
        nodes: cloneNodes,
        highlightElement: highlightElement
      });
    },
    isMipProtected: function(status, node) {
      var deferred = $.Deferred(), me = this;
      require([ "d2/commands/open" ], function(OpenCommand) {
        var cmdOptions = {
          context: status.context
        };
        var openCmd = new OpenCommand();
        me.getDownloadLinkFromOpenCmd(openCmd, node).done(function(downloadLink) {
          var plugin = openPlugins.findByNode(node);
          if (plugin && _.isFunction(plugin.isOverridePDF) && plugin.isOverridePDF(node)) {
            downloadLink = Url.appendQuery(downloadLink, node.get("i_contents_id") ? Url.combineQueryString({
              "content-id": node.get("i_contents_id")
            }) : "");
          }
          var bravaCSRAnnotationsLink = openCmd.getBravaCSRAnnotationsLink(node), bravaCSRAnnotationsListLink = openCmd.getBravaCSRAnnotationsListLink(node), bravaCSRRasterURLsLink = openCmd.getBravaCSRRasterURLsLink(node), bravaCSRChangemarkConfigLink = openCmd.getBravaCSRChangemarkConfigLink(node);
          openCmd.fetchDownloadUrls(node, downloadLink).done(function(downloadUrls, pageServingUrls, bravacsrSearchInfoUrl, bravacsrSearchInfoFallbackUrl, formats, pageCount, downloadLocationPath) {
            node["_download_urls_"] = downloadUrls;
            node["_page_serving_urls_"] = pageServingUrls;
            node["_page_count_"] = pageCount;
            node["_download_formats_"] = formats;
            node["_bravacsr_searchinfo_url_"] = bravacsrSearchInfoUrl;
            node["_bravacsr_searchInfo_fallback_url_"] = bravacsrSearchInfoFallbackUrl;
            node["_bravacsr_annotations_link_"] = bravaCSRAnnotationsLink;
            node["_bravacsr_annotations_list_link_"] = bravaCSRAnnotationsListLink;
            node["_bravacsr_raster_urls_link_"] = bravaCSRRasterURLsLink;
            node["_bravacsr_changemark_config_link_"] = bravaCSRChangemarkConfigLink;
            if (node.get("isPreviewProtected") === true) {
              cmdOptions.isMIPEnabled = true;
              openCmd._showDownloadDialog(cmdOptions, node, downloadUrls, downloadLocationPath).done(function() {
                deferred.resolve(true);
              }).fail(deferred.reject);
            } else {
              deferred.resolve(false);
            }
          }).fail(function(error) {
            GlobalMessage.showMessage("error", error.message, error.details);
            deferred.reject();
          });
        }).fail(deferred.reject);
      });
      return deferred.promise();
    },
    getDownloadLinkFromOpenCmd: function(openCmd, node) {
      var deferred = $.Deferred(), downloadLink = openCmd.getDownloadLink(node);
      if (!downloadLink) {
        openCmd.fetchLatestNode(node).done(function(newNode) {
          downloadLink = openCmd.getDownloadLink(newNode);
          deferred.resolve(downloadLink);
        }).fail(deferred.reject);
      } else {
        return deferred.resolve(downloadLink).promise();
      }
      return deferred.promise();
    }
  });
  DocumentPreviewPluginMixin.mixin(DocPreviewCommand.prototype);
  return DocPreviewCommand;
});