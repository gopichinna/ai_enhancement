/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/models/node/node.model", "nuc/models/nodes", "nuc/utils/log", "smart/utils/accessibility", "csui/utils/commandhelper", "csui/utils/commands/open.plugins/open.plugins", "d2/commands/download", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/utils/constants", "d2/ctf/ctfBridge", "d2/ctf/constants", "nuc/utils/url", "d2/controls/globalmessage/globalmessage" ], function(module, require, _, $, NodeModel, NodeCollection, log, Accessibility, CommandHelper, openPlugins, DownloadCommand, RestLinkrels, utils, constants, ctfBridge, ctfConstants, Url, GlobalMessage) {
  "use strict";
  log = log(module.id);
  return DownloadCommand.extend({
    defaults: {
      signature: "Open",
      command_key: [ "open" ],
      scope: "single"
    },
    enabled: function(status) {
      if (!DownloadCommand.prototype.enabled.apply(this, arguments)) {
        return false;
      }
      var node = CommandHelper.getJustOneNode(status);
      return node === false ? true : _.contains([ constants.Types.DOCUMENT, constants.Types.EMAIL, constants.Types.RENDITION ], node.get("type"));
    },
    execute: _.throttle(function(status, options) {
      var me = this, node = CommandHelper.getJustOneNode(status), downloadLink = me.getDownloadLink(node), bravaCSRAnnotationsLink = me.getBravaCSRAnnotationsLink(node), bravaCSRAnnotationsListLink = me.getBravaCSRAnnotationsListLink(node), bravaCSRRasterURLsLink = me.getBravaCSRRasterURLsLink(node), bravaCSRChangemarkConfigLink = me.getBravaCSRChangemarkConfigLink(node), cmdOptions = _.defaults({
        context: status.context || options && options.context,
        highlightElement: event && $(event.target).closest("tr")
      }, options);
      var plugin = openPlugins.findByNode(node);
      if (plugin && !plugin.widgetView && !status.ignoreDefault) {
        me._contentWindow = window.open("");
      }
      status.suppressSuccessMessage = true;
      if (!downloadLink || !me.checkActionsLoaded(node)) {
        return this.fetchLatestNode(node).then(function(newNode) {
          return me._openContent(status, newNode, cmdOptions, me.getDownloadLink(newNode), me.getBravaCSRAnnotationsLink(newNode), me.getBravaCSRAnnotationsListLink(newNode), me.getBravaCSRRasterURLsLink(newNode), me.getBravaCSRChangemarkConfigLink(newNode));
        });
      }
      return me._openContent(status, node, cmdOptions, downloadLink, bravaCSRAnnotationsLink, bravaCSRAnnotationsListLink, bravaCSRRasterURLsLink, bravaCSRChangemarkConfigLink);
    }, 1e3, {
      trailing: false
    }),
    getDownloadLink: function(node) {
      return RestLinkrels.getLink(node.get("links"), RestLinkrels.PREVIEW_URLS);
    },
    getBravaCSRAnnotationsLink: function(node) {
      return RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_BRAVACSR_ANNOTATIONS);
    },
    getBravaCSRAnnotationsListLink: function(node) {
      return RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_BRAVACSR_ANNOTATIONS_LIST);
    },
    getBravaCSRRasterURLsLink: function(node) {
      return RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_BRAVACSR_RASTER_URLS);
    },
    getBravaCSRChangemarkConfigLink: function(node) {
      return RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_BRAVACSR_CHANGEMARK_CONFIG);
    },
    checkActionsLoaded: function(node) {
      var length = node.actions.filter(function(action) {
        if (action.get("csuiNonPromotedAction") !== undefined) {
          return action;
        }
      }).length;
      return length > 0;
    },
    _fetchDefaultActionsCommand: function(node, status) {
      var deferred = $.Deferred(), defaultCommand, defaultActions = node.actions.filter({
        defaultAction: true
      });
      var newStatus = _.defaults({
        nodes: new NodeCollection(node)
      }, status);
      if (this.get("signature") === "Open" && !status.ignoreDefault) {
        newStatus.defaultAction = true;
        newStatus.ignoreDefault = true;
        require([ "csui/utils/commands" ], function(commands) {
          _.find(defaultActions, function(actionItem) {
            var command = commands.findWhere({
              signature: actionItem.get("signature")
            });
            try {
              if (command && command.enabled(newStatus)) {
                defaultCommand = command;
                return true;
              } else {
                return false;
              }
            } catch (error) {
              log.warn('Evaluating the command "{0}" failed.\n{1}', command.get("signature"), error.message) && console.warn(log.last);
            }
          });
          deferred.resolve(defaultCommand);
        }, deferred.reject);
      } else {
        deferred.resolve(defaultCommand);
      }
      return deferred.promise();
    },
    _openContent: function(status, node, options, downloadLink, bravaCSRAnnotationsLink, bravaCSRAnnotationsListLink, bravaCSRRasterURLsLink, bravaCSRChangemarkConfigLink) {
      var me = this, deferred = $.Deferred();
      if (utils.isMobile() || options.skipDefaultActionCheck === true) {
        this.fetchDownloadUrlsAndOpenContent(status, node, options, downloadLink, bravaCSRAnnotationsLink, bravaCSRAnnotationsListLink, bravaCSRRasterURLsLink, bravaCSRChangemarkConfigLink).done(deferred.resolve).fail(deferred.reject);
      } else {
        this._fetchDefaultActionsCommand(node, status).done(function(defaultCommand) {
          require([ "d2/widgets/document.overview/document.overview.view" ], function(DocumentOverview) {
            if (defaultCommand && defaultCommand.get("signature") !== me.get("signature") && !(status.originatingView instanceof DocumentOverview)) {
              var newStatus = _.defaults({
                nodes: new NodeCollection(node)
              }, status);
              if (defaultCommand.execute.cancel) {
                defaultCommand.execute.cancel();
              }
              if (me._contentWindow) {
                me._contentWindow.close();
              }
              defaultCommand.execute(newStatus, options).done(deferred.resolve).fail(deferred.reject);
            } else {
              me.fetchDownloadUrlsAndOpenContent(status, node, options, downloadLink, bravaCSRAnnotationsLink, bravaCSRAnnotationsListLink, bravaCSRRasterURLsLink, bravaCSRChangemarkConfigLink).done(deferred.resolve).fail(deferred.reject);
            }
          });
        }).fail(deferred.reject);
      }
      return deferred.promise();
    },
    _cleanUpViewerData: function(node) {
      const paramsToClear = [ "_download_urls_", "_page_serving_urls_", "_page_count_", "_download_formats_", "_bravacsr_searchinfo_url_", "_bravacsr_searchInfo_fallback_url_", "_bravacsr_annotations_link_", "_bravacsr_annotations_list_link_", "_bravacsr_raster_urls_link_", "_bravacsr_changemark_config_link_" ];
      paramsToClear.forEach(param => node[param] = null);
    },
    fetchDownloadUrlsAndOpenContent: function(status, node, options, downloadLink, bravaCSRAnnotationsLink, bravaCSRAnnotationsListLink, bravaCSRRasterURLsLink, bravaCSRChangemarkConfigLink) {
      var me = this, deferred = $.Deferred();
      var plugin = openPlugins.findByNode(node);
      if (plugin && _.isFunction(plugin.isOverridePDF) && plugin.isOverridePDF(node) && node.get("type_name") !== "Rendition") {
        downloadLink = Url.appendQuery(downloadLink, Url.combineQueryString({
          "content-id": node.get("i_contents_id")
        }));
      }
      me.fetchDownloadUrls(node, downloadLink).done(function(downloadUrls, pageServingUrls, bravacsrSearchInfoUrl, bravacsrSearchInfoFallbackUrl, formats, pageCount, downloadLocationPath) {
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
        if (me.get("skipPreview") !== undefined) {
          node.skipPreview = me.get("skipPreview");
        }
        if (Accessibility.isAccessibleMode()) {
          node.skipPreview = true;
        }
        plugin = openPlugins.findByNode(node);
        node.stopListening(node, "change:id", me._cleanUpViewerData).listenToOnce(node, "change:id", me._cleanUpViewerData);
        if (node.get("isPreviewProtected") === true) {
          options.isMIPEnabled = true;
          me._showDownloadDialog(options, node, downloadUrls, downloadLocationPath).done(function() {
            deferred.resolve();
          }).fail(deferred.reject);
          return deferred.promise();
        }
        if (plugin && _.isFunction(plugin.open)) {
          if (me._contentWindow) {
            me._contentWindow.close();
          }
          if (options.containerRegion) {
            me._openWidget(plugin.ViewerClassPath, node, options).done(deferred.resolve).fail(deferred.reject);
          } else {
            plugin.open({
              context: options.context,
              node: node,
              highlightElement: options.highlightElement,
              widgetDetails: me._getWidgetDetails(options)
            }).done(deferred.resolve).fail(deferred.reject);
          }
        } else {
          if (plugin) {
            if (plugin.widgetView) {
              if (me._contentWindow) {
                me._contentWindow.close();
              }
              me._openWidget(plugin.widgetView, node, options).done(deferred.resolve).fail(deferred.reject);
            } else {
              me._openWindow(plugin, node, me._contentWindow, downloadUrls[0]).done(deferred.resolve).fail(deferred.reject);
            }
          } else {
            if (!options.containerRegion) {
              if (!options.containerRegion) {
                me._showDownloadDialog(options, node, downloadUrls, downloadLocationPath).done(function() {
                  deferred.resolve();
                }).fail(deferred.reject);
              } else {
                deferred.reject();
              }
            } else {
              deferred.reject();
            }
          }
        }
      }).fail(function(commandError) {
        GlobalMessage.showMessage("error", commandError.message, commandError.details);
      });
      return deferred.promise();
    },
    _getWidgetDetails: function(options) {
      const widgetType = options.originatingView ? options.originatingView.options.widgetType : options.context?._widgetSettings?.models[0]?.colPref?.options?.widgetType || options.originatingView?.collection?.widgetPreference?.widgetType;
      const widgetName = options.originatingView ? options.originatingView.options.widgetName : options.context?._widgetSettings?.models[0]?.colPref?.options?.widgetName || options.originatingView?.collection?.widgetPreference?.widgetName;
      return {
        widgetType: widgetType,
        widgetName: widgetName
      };
    },
    _showDownloadDialog: function(options, node, downloadUrls, downloadLocationPath) {
      var me = this, deferred = $.Deferred();
      if (utils.isMobile()) {
        this._performDownload(downloadUrls);
        return deferred.resolve().promise();
      }
      require([ "d2/dialogs/download.confirmation/download.confirmation.alert" ], function(DownloadView) {
        var downloadDialogView = new DownloadView(options);
        downloadDialogView.show().done(function() {
          if (ctfBridge.isCtfEnabled()) {
            var openfile = true;
            var data = {
              id: node.get("id"),
              viewPath: downloadLocationPath?.view || me._getDownloadPathForWsCtf(ctfConstants.OpType.VIEW),
              checkoutPath: downloadLocationPath?.checkout || me._getDownloadPathForWsCtf(ctfConstants.OpType.CHECKOUT)
            }, path = node.get("reserved") && data.checkoutPath ? data.checkoutPath : data.viewPath;
            if (!path) {
              ctfBridge.publishSelectFolder("", ctfConstants.Mode.EXPORT, "", function(result) {
                data.viewPath = result;
                me._publishDownload(data, downloadUrls, node, openfile, data.viewPath).done(deferred.resolve).fail(deferred.reject);
              }, function() {
                deferred.resolve();
              });
            } else {
              me._publishDownload(data, downloadUrls, node, openfile, path).done(deferred.resolve).fail(deferred.reject);
            }
          } else {
            me._performDownload(downloadUrls);
            deferred.resolve();
          }
        }).fail(deferred.reject);
        downloadDialogView.listenToOnce(node, "change:id", () => downloadDialogView.trigger("close:dialog"));
      });
      return deferred.promise();
    },
    _publishDownload: function(data, downloadUrls, node, openfile, path) {
      var me = this, deferred = $.Deferred();
      ctfBridge.publishIsDownloaded(data.id, path, function(checkStatus) {
        var optype = checkStatus.length > 0 ? ctfConstants.OpType.OPEN_CHECKEDOUT : ctfConstants.OpType.VIEW, downloadLocation = checkStatus.length > 0 ? data.checkoutPath : data.viewPath;
        if (optype === ctfConstants.OpType.VIEW) {
          path = data.viewPath;
        } else if (optype === ctfConstants.OpType.CHECKOUT) {
          path = data.checkoutPath;
        }
        me._updateUserSettings(optype, path, node.connector).done(function() {
          me._performDownloadUsingWsCtf(downloadUrls, node, optype, ctfConstants.Mode.VIEW, true, openfile, false, downloadLocation).done(deferred.resolve).fail(deferred.reject);
        }).fail(function(err) {
          GlobalMessage.showMessage("error", err.message);
        });
      });
      return deferred.promise();
    },
    _openWidget: function(view, node, options) {
      var deferred = $.Deferred(), me = this;
      require([ "csui/utils/commands/impl/full.page.modal/full.page.modal.view", view ], function(FullPageModal, ViewerView) {
        var viewerView = new ViewerView(_.defaults({
          context: options.context,
          model: node,
          widgetDetails: me._getWidgetDetails(options)
        }, options.viewerOptions)), fullPageModal = new FullPageModal({
          view: viewerView
        });
        if (options.containerRegion) {
          options.containerRegion.show(viewerView);
        } else {
          fullPageModal.on("destroy", function() {
            deferred.resolve();
          }).show();
        }
      }, deferred.reject);
      return deferred.promise();
    },
    _openWindow: function(plugin, node, content, downloadLink) {
      var hasUrl = plugin.getUrl, promise = hasUrl && plugin.getUrl(node, {
        downloadLink: downloadLink
      });
      if (!hasUrl) {
        return $.Deferred().reject("Missing getUrl implementation in the plugin");
      }
      return promise.done(function(url) {
        utils.openUrlInWindow(url, content, true);
      }).fail(function(error) {
        if (content !== window) {
          content.close();
        }
        return $.Deferred().reject(error);
      });
    },
    fetchLatestNode: function(node) {
      var deferred = $.Deferred(), newNode = new NodeModel({
        id: node.get("id")
      }, {
        connector: node.connector
      });
      newNode.skipPreview = node.skipPreview;
      newNode.fetch({
        success: function() {
          deferred.resolve(newNode);
        },
        error: function(model, resp) {
          deferred.reject(resp);
        }
      });
      return deferred.promise();
    }
  });
});