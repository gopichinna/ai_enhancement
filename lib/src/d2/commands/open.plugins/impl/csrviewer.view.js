/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/jquery.parse.param", "nuc/lib/marionette", "nuc/models/nodes", "csui/dialogs/modal.alert/modal.alert", "csui/utils/contexts/factories/node", "csui/utils/commandhelper", "nuc/utils/log", "d2/commands/download", "d2/commands/print", "dctmw/utils/utils", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "d2/utils/widget.constants", "d2/commands/open.plugins/impl/csrviewer.search", "d2/commands/open.plugins/impl/viewer.expression.util", "i18n", "i18n!d2/commands/open.plugins/nls/localized.strings", "d2/commands/open.plugins/impl/iviewer/utils", "d2/commands/open.plugins/impl/viewer.utils", "css!d2/commands/open.plugins/impl/csrviewer" ], function(module, _, $, parseParams, Marionette, NodeCollection, Alert, NodeModelFactory, CommandHelper, log, DownloadCommand, PrintCommand, utils, RestResources, serverQueryUtils, widgetConstants, CSRViewerSearch, ViewerExpressionUtil, i18n, lang, iViewerUtils, viewerUtils) {
  "use strict";
  log = log(module.id);
  var moduleConfig = _.defaults(module.config(), {
    basePath: window.sv.config.releaseLocation + window.sv.config.otherBundlesLocation + "/csrviewer"
  }), defaultWidgetsToHide = [ "publishTaskMenuPdf", "publishTaskMenuTiff", "publishTaskMenuDocx", "printRegionMenuItem", "rotateButton", "helpButton", "printButton", "downloadButton", "markupFileMenu", "closeButton" ], defaultWidgetsToShow = [ "fullScreenButton", "bookmarkPane" ], allowAnnotateCache = {};
  return Marionette.ItemView.extend({
    className: navigator.userAgent.match(/(iPad)/i) ? "d2-csrviewer-ipad" : "d2-csrviewer",
    template: false,
    constructor: function CsrViewerView(options) {
      options.data || (options.data = {});
      if (options.collection) {
        throw "Collection viewing is not supported yet.";
      }
      if (!options.model) {
        options.model = options.context.getModel(NodeModelFactory, {
          attributes: {
            id: options.data.id,
            version_number: options.data.version_number || undefined
          }
        });
      }
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.isEmbeddedPreview = options.isEmbeddedPreview ? options.isEmbeddedPreview : false;
      this._connector = this.model.connector;
      if (!this._connector) {
        throw "Models must be created with a context in order to obtain a valid connection.";
      }
      this.listenTo(this.model, "change", this.onChangeModel);
      this.listenTo(this.options.context, "sync change:perspective", () => {
        this.closeViewer();
      });
      this.contentView = this.options["contentView"];
    },
    initialize: function(options) {
      var defaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), defaultBravaWidget = defaultWidgets && defaultWidgets[widgetConstants.DEFAULT.BRAVACSR], widgetConfig, disableAnnotations, enableChunking;
      if (options && options.model && options.model.viewerWidgetName) {
        defaultBravaWidget = options.model.viewerWidgetName;
      }
      if (defaultBravaWidget) {
        widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVACSR, defaultBravaWidget);
        disableAnnotations = widgetConfig && widgetConfig.widgetParams && widgetConfig.widgetParams.is_brava_disable_annotate;
        enableChunking = widgetConfig && widgetConfig.widgetParams && widgetConfig.widgetParams.is_enablechunking_smartview;
      } else {
        log.debug("Default Brava CSR widget name not configured in Landing Page XML") && console.log(log.last);
      }
      this.expConfig = widgetConfig && widgetConfig.widgetParams && widgetConfig.widgetParams.csrviewer_conditions ? widgetConfig.widgetParams.csrviewer_conditions : "";
      this.disableAnnotations = disableAnnotations;
      this.enableChunking = enableChunking;
      this.annotationPanelDefn = JSON.stringify({
        palettes: [ {
          id: "basic",
          label: lang.Annotation,
          tools: [ "Arrow", "Text", "Bookmark" ]
        }, {
          id: "changemarks",
          label: lang.Changemark,
          tools: "Changemark ChangemarkHighlight ChangemarkCloud ChangemarkArrow Checkview ChangemarkTextHighlight ChangemarkTextStrikethrough".split(" ")
        }, {
          id: "sketches",
          label: lang.Drawings,
          tools: "Cloud Highlight Rect RoundedRect Polygon Ellipse Sketch SketchPolygon".split(" ")
        }, {
          id: "lines",
          label: lang.Lines,
          tools: [ "Line", "Polyline", "Crossout", "Scratchout" ]
        }, {
          id: "stamps",
          label: lang.Stamps,
          tools: [ "Image" ]
        }, {
          id: "textEditing",
          label: lang.TextEditing,
          tools: [ "TextStrikeout", "TextStrikethrough", "TextHighlight", "TextUnderline" ]
        } ]
      });
    },
    onChangeModel: function() {
      if (this.model.hasChanged("id") || this.model.hasChanged("version_number")) {
        this.render();
      }
    },
    onAttach: function() {
      var me = this, el = me.el, elId = el.getAttribute("id");
      if (!elId) {
        elId = "d2-csrviewer" + new Date().getTime();
        el.setAttribute("id", elId);
      }
      var documentId = this.model.get("id");
      this.isAllowAnnotate(this.model.connector, documentId).done(function(status) {
        me.allowAnnotate = status;
        me._loadCsrScripts().done(function() {
          var modelUrl = me.model["_download_urls_"] && me.model["_download_urls_"][0], callback = function() {
            me.nodes = new NodeCollection([ me.model ]);
            me.viewerInstance = window.igc.be.htmlClient({
              container: elId,
              options: {
                locale: i18n.settings.locale === "iw" ? "he" : i18n.settings.locale,
                clientHTMLPath: moduleConfig.basePath + "/lib",
                xmlPostType: "text/xml",
                nodeType: "iframe",
                logLevel: "all",
                useWorkersForDataRequests: true,
                earlyRequest: true,
                viewerConfig: me._getDefaultViewerConfig()
              }
            });
            me.viewerInstance.then(me._onBravaInstanceCreate.bind(me), function(err) {
              Alert.showError(err);
              me.bravaApi = false;
            });
          };
          if (modelUrl) {
            callback();
          } else {
            DownloadCommand.prototype.fetchDownloadUrls.call(me, me.model, me.options.downloadLink).done(function(downloadUrls, pageServingUrls, formats, pageCount) {
              me.model["_download_urls_"] = downloadUrls;
              me.model["_page_serving_urls_"] = pageServingUrls;
              me.model["_download_formats_"] = formats;
              me.model["_page_count_"] = pageCount;
              callback();
            }).fail(function() {
              setTimeout(function() {
                me.destroy();
                me.bravaApi = false;
              }, 300);
            });
          }
        });
      });
    },
    _getDefaultViewerConfig: function() {
      var docObj = this._getBravaDocumentObject(), url = docObj.source, queryParams = parseParams(url.slice(url.lastIndexOf("?") + 1)), allowEditAnnotations = queryParams.hasRelate === "1", widgetsToHide = defaultWidgetsToHide.concat(allowEditAnnotations ? [] : [ "checkviewOkButton", "checkviewNotOkButton", "changemarkReplyButton", "replyButton" ]), widgetsToShow = _.clone(defaultWidgetsToShow), transformHeaderParams = function(headers) {
        return _.map(_.keys(headers), function(k) {
          return {
            name: k,
            value: headers[k]
          };
        });
      };
      if (window !== window.top) {
        widgetsToHide.push("fullScreenButton");
      }
      return {
        userName: RestResources.getCurrentUser().get("id"),
        uiOverride: "DesktopUx2",
        enableMarkupOverwrite: true,
        alwaysOverrideSave: true,
        enableAutosave: false,
        autosaveMinutes: 1,
        useWorkerForDocRequests: true,
        pageLoadScrollTimeout: 300,
        changemarkConfigURI: docObj.changemarkConfigURI,
        rasterURI: docObj.rasterURI,
        promptForUnsavedDirtyMarkup: false,
        toolConfig: this.annotationPanelDefn,
        hide: {
          widget: widgetsToHide
        },
        show: {
          widget: widgetsToShow
        },
        download: {
          documentURI: docObj.source
        },
        documents: [ docObj ],
        headerParameters: {
          param: transformHeaderParams(this._getSharedHeaderParams())
        }
      };
    },
    _getSharedHeaderParams: function() {
      var headers = {};
      this.model.connector.authenticator.setAuthenticationHeaders(headers);
      return headers;
    },
    _getBravaDocumentObject: function() {
      var me = this, url, pageServingUrl = "";
      url = me.model["_download_urls_"] && me.model["_download_urls_"][0];
      if (this.enableChunking) {
        if (this._isChunkingAllowed()) {
          pageServingUrl = me.model["_page_serving_urls_"] && me.model["_page_serving_urls_"][0];
          url = "";
        }
      }
      if (pageServingUrl === undefined) {
        url = me.model["_download_urls_"] && me.model["_download_urls_"][0];
      }
      var searchService = CSRViewerSearch, searchInfoFallbackLinkUrl = utils.buildLinkUrl({
        href: me.model["_bravacsr_searchInfo_fallback_url_"]
      });
      searchService.initialize({
        searchInfoUrl: me.model["_bravacsr_searchinfo_url_"],
        searchInfoFallbackUrl: searchInfoFallbackLinkUrl
      });
      window.csrviewerSearch = window.csrviewerSearch || {};
      window.csrviewerSearch[me.model.attributes.id] = searchService;
      var format = me.model["_download_formats_"] && me.model["_download_formats_"][0] || me.model.get("aContentType") || me.model.get("a_content_type"), changemarkConfigURI = me.model["_bravacsr_changemark_config_link_"], markupListURI = me.model["_bravacsr_annotations_list_link_"], markupSaveURI = me.model["_bravacsr_annotations_link_"], rasterURI = me.model["_bravacsr_raster_urls_link_"], pageCount = me.model["_page_count_"], markupEditListURI = markupListURI + "?action=edit", markupReviewListURI = markupListURI + "?action=review";
      pageCount = parseInt(pageCount, 10);
      if (_.isNaN(pageCount) || !_.isNumber(pageCount)) {
        pageCount = 0;
      }
      var disableAnnotations = this.disableAnnotationsForcefully || this.disableAnnotations && this.getExpConfigResult();
      var docObj = {
        source: url,
        title: me.model.get("name"),
        nativeFormatType: format,
        cid: me.model.get("id"),
        changemarkConfigURI: "",
        markupEditListURI: "",
        markupReviewListURI: "",
        markupSaveURI: "",
        rasterURI: ""
      };
      if (this._isChunkingAllowed() && pageCount > 0) {
        _.extend(docObj, {
          pageCount: pageCount,
          chunkSize: this._getChunkSize(),
          pageServingUrl: pageServingUrl
        });
      }
      if (!disableAnnotations) {
        _.extend(docObj, {
          changemarkConfigURI: this.allowAnnotate ? changemarkConfigURI : "",
          markupEditListURI: this.allowAnnotate ? markupEditListURI : "",
          markupReviewListURI: markupReviewListURI,
          markupSaveURI: this.allowAnnotate ? markupSaveURI : "",
          rasterURI: this.allowAnnotate ? rasterURI : ""
        });
      }
      return docObj;
    },
    getExpConfigResult: function() {
      if (!this.expConfig) {
        return true;
      }
      var viewerExpressionUtil = new ViewerExpressionUtil(this.model);
      var exResult = viewerExpressionUtil.evaluateExpression(this.expConfig);
      return exResult;
    },
    _isChunkingAllowed: function() {
      var bravaConfig = this._getBravaConfig();
      return !!bravaConfig && bravaConfig.is_chunking_allowed === true;
    },
    _getChunkSize: function() {
      var bravaConfig = this._getBravaConfig();
      return !!bravaConfig && bravaConfig.chunk_size;
    },
    _getBravaConfig: function() {
      return RestResources.getD2Options().brava_configurations;
    },
    _onBravaInstanceCreate: function(bravaApi) {
      var me = this;
      me.bravaApi = bravaApi;
      bravaApi.on("ClientClosed", function() {
        me.destroy();
      });
      bravaApi.on("ClientClosedOnStartup", function() {
        me.destroy();
      });
      bravaApi.on("MarkupDirty", function() {
        bravaApi.saveMarkupFile();
      });
      bravaApi.on("DocumentVisible", function() {
        if (me.options.showCollapseButton === true) {
          me._addViewerCollapseButton(bravaApi);
        }
        if (CommandHelper.getOriginalActionLink(me.model, "Download")) {
          me._addExportButton(bravaApi);
        }
        if (CommandHelper.getOriginalActionLink(me.model, "D2-Print")) {
          me._addPrintButton(bravaApi);
        }
        me._addRotateButton(bravaApi);
        if (!me.contentView) {
          me._addCustomCloseButton(bravaApi);
        }
        me._addCustomRefreshMarkupButton(bravaApi);
        bravaApi.getAllAvailableMarkups().then(function(xml) {
          var parser = new DOMParser();
          var xmlDoc = parser.parseFromString(xml, "text/xml");
          var markups = xmlDoc.getElementsByTagName("Markup");
          for (var x = 0; x < markups.length; x++) {
            var URI = markups[x].getElementsByTagName("URI")[0].childNodes[0].nodeValue;
            var edit = markups[x].getElementsByTagName("AvailableForEdit")[0].textContent;
            bravaApi.openMarkupFile({
              url: URI,
              options: {
                openForEdit: edit === "true"
              }
            }).then(function() {
              bravaApi.activateMarkupTool({
                tool: "default"
              });
            }, function(err) {
              log.error(err) && console.log(log.last);
              bravaApi.activateMarkupTool({
                tool: "default"
              });
            });
          }
        }, function(err) {
          log.error(err) && console.log(log.last);
        });
      });
      var failcount = 0;
      bravaApi.on("LoadingError", function(e) {
        failcount++;
        if (failcount === 1) {
          var response, msg = e.content;
          try {
            response = JSON.parse(msg);
            msg = utils.parseErrorAsString(response.type, response.text);
          } catch (e) {
            log.warn(e) && console.warn(e);
          }
          me.destroy();
          Alert.showError(msg);
        }
      });
    },
    _loadCsrScripts: function() {
      var deferred = $.Deferred(), script;
      if (window.igc && window.igc.be) {
        deferred.resolve();
      } else {
        script = document.createElement("script");
        script.setAttribute("src", moduleConfig.basePath + "/be.js");
        script.onload = function() {
          deferred.resolve();
        };
        script.onerror = function() {
          Alert.showError("Error loading Viewer scripts");
          deferred.reject();
        };
        document.getElementsByTagName("head")[0].appendChild(script);
      }
      return deferred.promise();
    },
    _addViewerCollapseButton: function(bravaApi) {
      var me = this;
      me._addCustomButton(bravaApi, {
        varName: "viewerCollapseButton",
        tooltip: lang.ButtonCollapseViewer,
        icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTcuODc1IDIwLjAwMDFINFY0LjI4NThDNCA0LjE0NTI0IDQuMDQyMzQgNC4wNDc3NyA0LjA3NTQ5IDQuMDAwMDlIMjBWNy44NzUwOUMyMCA4LjQyNzM4IDIwLjQ0NzcgOC44NzUwOSAyMSA4Ljg3NTA5QzIxLjU1MjMgOC44NzUwOSAyMiA4LjQyNzM4IDIyIDcuODc1MDlWMy42NDI5NUMyMiAyLjk4NDI1IDIxLjU0NzYgMi4wMDAwOSAyMC41IDIuMDAwMDlINEMyLjY3NjQgMi4wMDAwOSAyIDMuMjcyMjUgMiA0LjI4NThWMjAuMzU3MkMyIDIxLjAxNTkgMi40NTIzOSAyMi4wMDAxIDMuNSAyMi4wMDAxSDcuODc1QzguNDI3MjggMjIuMDAwMSA4Ljg3NSAyMS41NTI0IDguODc1IDIxLjAwMDFDOC44NzUgMjAuNDQ3OCA4LjQyNzI4IDIwLjAwMDEgNy44NzUgMjAuMDAwMVpNMTEuNzA3MSAxMC4yOTNMMjAgMTguNTg1OVYxNC4wMDAxQzIwIDEzLjQ0NzggMjAuNDQ3NyAxMy4wMDAxIDIxIDEzLjAwMDFDMjEuNTUyMyAxMy4wMDAxIDIyIDEzLjQ0NzggMjIgMTQuMDAwMVYyMi4wMDAxSDE0QzEzLjQ0NzcgMjIuMDAwMSAxMyAyMS41NTI0IDEzIDIxLjAwMDFDMTMgMjAuNDQ3OCAxMy40NDc3IDIwLjAwMDEgMTQgMjAuMDAwMUgxOC41ODU4TDEwLjI5MjkgMTEuNzA3MkM5LjkwMjM4IDExLjMxNjcgOS45MDIzOCAxMC42ODM1IDEwLjI5MjkgMTAuMjkzQzEwLjY4MzQgOS45MDI0NiAxMS4zMTY2IDkuOTAyNDYgMTEuNzA3MSAxMC4yOTNaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==",
        hoverIcon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTcuODc1IDIwLjAwMDFINFY0LjI4NThDNCA0LjE0NTI0IDQuMDQyMzQgNC4wNDc3NyA0LjA3NTQ5IDQuMDAwMDlIMjBWNy44NzUwOUMyMCA4LjQyNzM4IDIwLjQ0NzcgOC44NzUwOSAyMSA4Ljg3NTA5QzIxLjU1MjMgOC44NzUwOSAyMiA4LjQyNzM4IDIyIDcuODc1MDlWMy42NDI5NUMyMiAyLjk4NDI1IDIxLjU0NzYgMi4wMDAwOSAyMC41IDIuMDAwMDlINEMyLjY3NjQgMi4wMDAwOSAyIDMuMjcyMjUgMiA0LjI4NThWMjAuMzU3MkMyIDIxLjAxNTkgMi40NTIzOSAyMi4wMDAxIDMuNSAyMi4wMDAxSDcuODc1QzguNDI3MjggMjIuMDAwMSA4Ljg3NSAyMS41NTI0IDguODc1IDIxLjAwMDFDOC44NzUgMjAuNDQ3OCA4LjQyNzI4IDIwLjAwMDEgNy44NzUgMjAuMDAwMVpNMTEuNzA3MSAxMC4yOTNMMjAgMTguNTg1OVYxNC4wMDAxQzIwIDEzLjQ0NzggMjAuNDQ3NyAxMy4wMDAxIDIxIDEzLjAwMDFDMjEuNTUyMyAxMy4wMDAxIDIyIDEzLjQ0NzggMjIgMTQuMDAwMVYyMi4wMDAxSDE0QzEzLjQ0NzcgMjIuMDAwMSAxMyAyMS41NTI0IDEzIDIxLjAwMDFDMTMgMjAuNDQ3OCAxMy40NDc3IDIwLjAwMDEgMTQgMjAuMDAwMUgxOC41ODU4TDEwLjI5MjkgMTEuNzA3MkM5LjkwMjM4IDExLjMxNjcgOS45MDIzOCAxMC42ODM1IDEwLjI5MjkgMTAuMjkzQzEwLjY4MzQgOS45MDI0NiAxMS4zMTY2IDkuOTAyNDYgMTEuNzA3MSAxMC4yOTNaIiBmaWxsPSIjNjI3NzgzIi8+PC9zdmc+",
        activeIcon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTcuODc1IDIwLjAwMDFINFY0LjI4NThDNCA0LjE0NTI0IDQuMDQyMzQgNC4wNDc3NyA0LjA3NTQ5IDQuMDAwMDlIMjBWNy44NzUwOUMyMCA4LjQyNzM4IDIwLjQ0NzcgOC44NzUwOSAyMSA4Ljg3NTA5QzIxLjU1MjMgOC44NzUwOSAyMiA4LjQyNzM4IDIyIDcuODc1MDlWMy42NDI5NUMyMiAyLjk4NDI1IDIxLjU0NzYgMi4wMDAwOSAyMC41IDIuMDAwMDlINEMyLjY3NjQgMi4wMDAwOSAyIDMuMjcyMjUgMiA0LjI4NThWMjAuMzU3MkMyIDIxLjAxNTkgMi40NTIzOSAyMi4wMDAxIDMuNSAyMi4wMDAxSDcuODc1QzguNDI3MjggMjIuMDAwMSA4Ljg3NSAyMS41NTI0IDguODc1IDIxLjAwMDFDOC44NzUgMjAuNDQ3OCA4LjQyNzI4IDIwLjAwMDEgNy44NzUgMjAuMDAwMVpNMTEuNzA3MSAxMC4yOTNMMjAgMTguNTg1OVYxNC4wMDAxQzIwIDEzLjQ0NzggMjAuNDQ3NyAxMy4wMDAxIDIxIDEzLjAwMDFDMjEuNTUyMyAxMy4wMDAxIDIyIDEzLjQ0NzggMjIgMTQuMDAwMVYyMi4wMDAxSDE0QzEzLjQ0NzcgMjIuMDAwMSAxMyAyMS41NTI0IDEzIDIxLjAwMDFDMTMgMjAuNDQ3OCAxMy40NDc3IDIwLjAwMDEgMTQgMjAuMDAwMUgxOC41ODU4TDEwLjI5MjkgMTEuNzA3MkM5LjkwMjM4IDExLjMxNjcgOS45MDIzOCAxMC42ODM1IDEwLjI5MjkgMTAuMjkzQzEwLjY4MzQgOS45MDI0NiAxMS4zMTY2IDkuOTAyNDYgMTEuNzA3MSAxMC4yOTNaIiBmaWxsPSIjNjI3NzgzIi8+PC9zdmc+",
        placement: {
          toolbarRegion: "Start",
          buttonPosition: "First"
        },
        pinWidget: true,
        applyRTLStyleForIcon: true,
        handler: function customClick(e) {
          e = e ? $.Event(event) : e;
          me.trigger("viewer:collapse", e);
          if (!e || !e.isDefaultPrevented()) {
            bravaApi.closeViewer({
              allowCancel: false
            });
          }
        }
      });
    },
    _addExportButton: function(bravaApi) {
      var me = this;
      me._addCustomButton(bravaApi, {
        varName: "exportButton",
        tooltip: lang.CommandNameExport,
        icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTcuNzggOC43NUMxNy4xOSA4LjE2IDE2LjI0IDguMTYgMTUuNjUgOC43NUwxMy40NyAxMC45M1YzLjVDMTMuNDcgMi42NyAxMi44IDIgMTEuOTcgMkMxMS4xNCAyIDEwLjQ3IDIuNjcgMTAuNDcgMy41VjEwLjg4TDguMzM5OTYgOC43NUM3Ljc0OTk2IDguMTYgNi43OTk5NiA4LjE2IDYuMjA5OTYgOC43NUM1LjYxOTk2IDkuMzQgNS42MTk5NiAxMC4yOSA2LjIwOTk2IDEwLjg4TDEyIDE2LjY2TDE3Ljc4IDEwLjg4QzE4LjM3IDEwLjI5IDE4LjM3IDkuMzQgMTcuNzggOC43NVoiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTIwLjc1IDIySDMuMjVDMi41NTgzMyAyMiAyIDIxLjMzIDIgMjAuNUMyIDE5LjY3IDIuNTU4MzMgMTkgMy4yNSAxOUgyMC43NUMyMS40NDE3IDE5IDIyIDE5LjY3IDIyIDIwLjVDMjIgMjEuMzMgMjEuNDQxNyAyMiAyMC43NSAyMloiIGZpbGw9IndoaXRlIi8+PC9zdmc+DQo=",
        hoverIcon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTcuNzgwMSA4Ljc1QzE3LjE5MDEgOC4xNiAxNi4yNDAxIDguMTYgMTUuNjUwMSA4Ljc1TDEzLjQ3MDEgMTAuOTNWMy41QzEzLjQ3MDEgMi42NyAxMi44MDAxIDIgMTEuOTcwMSAyQzExLjE0MDEgMiAxMC40NzAxIDIuNjcgMTAuNDcwMSAzLjVWMTAuODhMOC4zNDAwOCA4Ljc1QzcuNzUwMDggOC4xNiA2LjgwMDA4IDguMTYgNi4yMTAwOCA4Ljc1QzUuNjIwMDggOS4zNCA1LjYyMDA4IDEwLjI5IDYuMjEwMDggMTAuODhMMTIuMDAwMSAxNi42NkwxNy43ODAxIDEwLjg4QzE4LjM3MDEgMTAuMjkgMTguMzcwMSA5LjM0IDE3Ljc4MDEgOC43NVoiIGZpbGw9IiM2Mjc3ODMiLz48cGF0aCBkPSJNMjAuNzUgMjJIMy4yNUMyLjU1ODMzIDIyIDIgMjEuMzMgMiAyMC41QzIgMTkuNjcgMi41NTgzMyAxOSAzLjI1IDE5SDIwLjc1QzIxLjQ0MTcgMTkgMjIgMTkuNjcgMjIgMjAuNUMyMiAyMS4zMyAyMS40NDE3IDIyIDIwLjc1IDIyWiIgZmlsbD0iIzYyNzc4MyIvPjwvc3ZnPg==",
        activeIcon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTcuNzgwMSA4Ljc1QzE3LjE5MDEgOC4xNiAxNi4yNDAxIDguMTYgMTUuNjUwMSA4Ljc1TDEzLjQ3MDEgMTAuOTNWMy41QzEzLjQ3MDEgMi42NyAxMi44MDAxIDIgMTEuOTcwMSAyQzExLjE0MDEgMiAxMC40NzAxIDIuNjcgMTAuNDcwMSAzLjVWMTAuODhMOC4zNDAwOCA4Ljc1QzcuNzUwMDggOC4xNiA2LjgwMDA4IDguMTYgNi4yMTAwOCA4Ljc1QzUuNjIwMDggOS4zNCA1LjYyMDA4IDEwLjI5IDYuMjEwMDggMTAuODhMMTIuMDAwMSAxNi42NkwxNy43ODAxIDEwLjg4QzE4LjM3MDEgMTAuMjkgMTguMzcwMSA5LjM0IDE3Ljc4MDEgOC43NVoiIGZpbGw9IiM2NjY2NjYiLz48cGF0aCBkPSJNMjAuNzUgMjJIMy4yNUMyLjU1ODMzIDIyIDIgMjEuMzMgMiAyMC41QzIgMTkuNjcgMi41NTgzMyAxOSAzLjI1IDE5SDIwLjc1QzIxLjQ0MTcgMTkgMjIgMTkuNjcgMjIgMjAuNUMyMiAyMS4zMyAyMS40NDE3IDIyIDIwLjc1IDIyWiIgZmlsbD0iIzY2NjY2NiIvPjwvc3ZnPg==",
        position: 5,
        handler: function customClick() {
          new DownloadCommand().execute({
            nodes: me.nodes
          });
        }
      });
    },
    _addPrintButton: function(bravaApi) {
      var me = this;
      me._addCustomButton(bravaApi, {
        varName: "printButton",
        tooltip: lang.CommandNamePrint,
        icon: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIxLjEuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMjQgMjQ7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojRkZGRkZGO30KCS5zdDF7b3BhY2l0eTowLjQ1O2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yMiw2aC0yVjNjMC0xLjEtMC45LTItMi0ySDZDNC45LDEsNCwxLjksNCwzdjNIMkMwLjksNiwwLDYuOSwwLDh2OGMwLDEuMSwwLjksMiwyLDJoMnYzYzAsMS4xLDAuOSwyLDIsMmgxMgoJYzEuMSwwLDItMC45LDItMnYtM2gyYzEuMSwwLDItMC45LDItMlY4QzI0LDYuOSwyMy4xLDYsMjIsNnogTTUsM2MwLTAuNiwwLjQtMSwxLTFoMTJjMC42LDAsMSwwLjQsMSwxdjNINVYzeiBNMTksMjEKCWMwLDAuNi0wLjQsMS0xLDFINmMtMC42LDAtMS0wLjQtMS0xdi0zdi01aDE0djVWMjF6Ii8+CjxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik0xNi41LDE2aC05QzcuMiwxNiw3LDE1LjgsNywxNS41UzcuMiwxNSw3LjUsMTVoOWMwLjMsMCwwLjUsMC4yLDAuNSwwLjVTMTYuOCwxNiwxNi41LDE2eiIvPgo8cGF0aCBjbGFzcz0ic3QxIiBkPSJNMTYuNSwxOWgtOUM3LjIsMTksNywxOC44LDcsMTguNVM3LjIsMTgsNy41LDE4aDljMC4zLDAsMC41LDAuMiwwLjUsMC41UzE2LjgsMTksMTYuNSwxOXoiLz4KPC9zdmc+Cg==",
        hoverIcon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI0IDI0OyI+PHN0eWxlPi5zdDB7ZmlsbDojNjI3NzgzO30gLnN0MXtvcGFjaXR5OjAuNDU7ZmlsbDojNjI3NzgzO308L3N0eWxlPjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yMiw2aC0yVjNjMC0xLjEtMC45LTItMi0ySDZDNC45LDEsNCwxLjksNCwzdjNIMkMwLjksNiwwLDYuOSwwLDh2OGMwLDEuMSwwLjksMiwyLDJoMnYzYzAsMS4xLDAuOSwyLDIsMmgxMiAgYzEuMSwwLDItMC45LDItMnYtM2gyYzEuMSwwLDItMC45LDItMlY4QzI0LDYuOSwyMy4xLDYsMjIsNnogTTUsM2MwLTAuNiwwLjQtMSwxLTFoMTJjMC42LDAsMSwwLjQsMSwxdjNINVYzeiBNMTksMjEgIGMwLDAuNi0wLjQsMS0xLDFINmMtMC42LDAtMS0wLjQtMS0xdi0zdi01aDE0djVWMjF6Ii8+PHBhdGggY2xhc3M9InN0MSIgZD0iTTE2LjUsMTZoLTlDNy4yLDE2LDcsMTUuOCw3LDE1LjVTNy4yLDE1LDcuNSwxNWg5YzAuMywwLDAuNSwwLjIsMC41LDAuNVMxNi44LDE2LDE2LjUsMTZ6Ii8+PHBhdGggY2xhc3M9InN0MSIgZD0iTTE2LjUsMTloLTlDNy4yLDE5LDcsMTguOCw3LDE4LjVTNy4yLDE4LDcuNSwxOGg5YzAuMywwLDAuNSwwLjIsMC41LDAuNVMxNi44LDE5LDE2LjUsMTl6Ii8+PC9zdmc+",
        activeIcon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI0IDI0OyI+PHN0eWxlPi5zdDB7ZmlsbDojNjY2O30gLnN0MXtvcGFjaXR5OjAuNDU7ZmlsbDojNjY2O308L3N0eWxlPjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yMiw2aC0yVjNjMC0xLjEtMC45LTItMi0ySDZDNC45LDEsNCwxLjksNCwzdjNIMkMwLjksNiwwLDYuOSwwLDh2OGMwLDEuMSwwLjksMiwyLDJoMnYzYzAsMS4xLDAuOSwyLDIsMmgxMiAgYzEuMSwwLDItMC45LDItMnYtM2gyYzEuMSwwLDItMC45LDItMlY4QzI0LDYuOSwyMy4xLDYsMjIsNnogTTUsM2MwLTAuNiwwLjQtMSwxLTFoMTJjMC42LDAsMSwwLjQsMSwxdjNINVYzeiBNMTksMjEgIGMwLDAuNi0wLjQsMS0xLDFINmMtMC42LDAtMS0wLjQtMS0xdi0zdi01aDE0djVWMjF6Ii8+PHBhdGggY2xhc3M9InN0MSIgZD0iTTE2LjUsMTZoLTlDNy4yLDE2LDcsMTUuOCw3LDE1LjVTNy4yLDE1LDcuNSwxNWg5YzAuMywwLDAuNSwwLjIsMC41LDAuNVMxNi44LDE2LDE2LjUsMTZ6Ii8+PHBhdGggY2xhc3M9InN0MSIgZD0iTTE2LjUsMTloLTlDNy4yLDE5LDcsMTguOCw3LDE4LjVTNy4yLDE4LDcuNSwxOGg5YzAuMywwLDAuNSwwLjIsMC41LDAuNVMxNi44LDE5LDE2LjUsMTl6Ii8+PC9zdmc+",
        position: 15,
        handler: function customClick() {
          new PrintCommand().execute({
            nodes: me.nodes
          });
        }
      });
    },
    _addRotateButton: function(bravaApi) {
      this._addCustomButton(bravaApi, {
        varName: "customRotateButton",
        tooltip: lang.CommandNameRotate,
        icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj48ZyBjbGlwLXBhdGg9InVybCgjY2xpcDApIj48cGF0aCBkPSJNNCAxMkM0IDkuODc4MjcgNC44NDI4NiA3Ljg0MzQ0IDYuMzQzMTUgNi4zNDMxNEM3Ljg0MzQ0IDQuODQyODUgOS44NzgyNyA0IDEyIDRDMTQuMTIxNyA0IDE2LjE1NjYgNC44NDI4NSAxNy42NTY5IDYuMzQzMTRDMTkuMTU3MSA3Ljg0MzQ0IDIwIDkuODc4MjcgMjAgMTIiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMjAgMTJDMjAgMTMuMDUwNiAxOS43OTMxIDE0LjA5MDkgMTkuMzkxIDE1LjA2MTVDMTguOTg5IDE2LjAzMjEgMTguMzk5NyAxNi45MTQgMTcuNjU2OSAxNy42NTY5QzE2LjkxNCAxOC4zOTk3IDE2LjAzMjEgMTguOTg5IDE1LjA2MTUgMTkuMzkxQzE0LjA5MDkgMTkuNzkzMSAxMy4wNTA2IDIwIDEyIDIwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtZGFzaGFycmF5PSIwLjc1IDMiLz48cGF0aCBkPSJNMS4xOTU5MiA5LjY1OTU4TDMuODI0NjQgMTIuOTg5N0w3LjE1NDc4IDEwLjM2MSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvZz48ZGVmcz48Y2xpcFBhdGggaWQ9ImNsaXAwIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IndoaXRlIi8+PC9jbGlwUGF0aD48L2RlZnM+PC9zdmc+",
        hoverIcon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj48ZyBjbGlwLXBhdGg9InVybCgjY2xpcDApIj48cGF0aCBkPSJNNCAxMkM0IDkuODc4MjcgNC44NDI4NiA3Ljg0MzQ0IDYuMzQzMTUgNi4zNDMxNEM3Ljg0MzQ0IDQuODQyODUgOS44NzgyNyA0IDEyIDRDMTQuMTIxNyA0IDE2LjE1NjYgNC44NDI4NSAxNy42NTY5IDYuMzQzMTRDMTkuMTU3MSA3Ljg0MzQ0IDIwIDkuODc4MjcgMjAgMTIiIHN0cm9rZT0iIzYyNzc4MyIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0yMCAxMkMyMCAxMy4wNTA2IDE5Ljc5MzEgMTQuMDkwOSAxOS4zOTEgMTUuMDYxNUMxOC45ODkgMTYuMDMyMSAxOC4zOTk3IDE2LjkxNCAxNy42NTY5IDE3LjY1NjlDMTYuOTE0IDE4LjM5OTcgMTYuMDMyMSAxOC45ODkgMTUuMDYxNSAxOS4zOTFDMTQuMDkwOSAxOS43OTMxIDEzLjA1MDYgMjAgMTIgMjAiIHN0cm9rZT0iIzYyNzc4MyIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWRhc2hhcnJheT0iMC43NSAzIi8+PHBhdGggZD0iTTEuMTk1OCA5LjY1OTY3TDMuODI0NTIgMTIuOTg5OEw3LjE1NDY2IDEwLjM2MTEiIHN0cm9rZT0iIzYyNzc4MyIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvZz48ZGVmcz48Y2xpcFBhdGggaWQ9ImNsaXAwIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IndoaXRlIi8+PC9jbGlwUGF0aD48L2RlZnM+PC9zdmc+",
        activeIcon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBjbGlwLXBhdGg9InVybCgjY2xpcDApIj48cGF0aCBkPSJNNCAxMkM0IDkuODc4MjcgNC44NDI4NiA3Ljg0MzQ0IDYuMzQzMTUgNi4zNDMxNEM3Ljg0MzQ0IDQuODQyODUgOS44NzgyNyA0IDEyIDRDMTQuMTIxNyA0IDE2LjE1NjYgNC44NDI4NSAxNy42NTY5IDYuMzQzMTRDMTkuMTU3MSA3Ljg0MzQ0IDIwIDkuODc4MjcgMjAgMTIiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0yMCAxMkMyMCAxMy4wNTA2IDE5Ljc5MzEgMTQuMDkwOSAxOS4zOTEgMTUuMDYxNUMxOC45ODkgMTYuMDMyMSAxOC4zOTk3IDE2LjkxNCAxNy42NTY5IDE3LjY1NjlDMTYuOTE0IDE4LjM5OTcgMTYuMDMyMSAxOC45ODkgMTUuMDYxNSAxOS4zOTFDMTQuMDkwOSAxOS43OTMxIDEzLjA1MDYgMjAgMTIgMjAiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWRhc2hhcnJheT0iMC43NSAzIi8+PHBhdGggZD0iTTEuMTk1OCA5LjY1OTY3TDMuODI0NTIgMTIuOTg5OEw3LjE1NDY2IDEwLjM2MTEiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvZz48ZGVmcz48Y2xpcFBhdGggaWQ9ImNsaXAwIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IndoaXRlIi8+PC9jbGlwUGF0aD48L2RlZnM+PC9zdmc+",
        position: 9,
        handler: function customClick() {
          bravaApi.rotateCurrentPage({
            angle: 90
          });
        }
      });
    },
    _addCustomCloseButton: function(bravaApi) {
      var me = this;
      this._addCustomButton(bravaApi, {
        varName: "customCloseButton",
        tooltip: lang.ButtonCloseViewer,
        icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSA1TDE5IDE5IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTE5IDVMNSAxOSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==",
        hoverIcon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSA1TDE5IDE5IiBzdHJva2U9IiM2Mjc3ODMiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMTkgNUw1IDE5IiBzdHJva2U9IiM2Mjc3ODMiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=",
        activeIcon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSA1TDE5IDE5IiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMTkgNUw1IDE5IiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=",
        placement: {
          toolbarRegion: "End",
          buttonPosition: "Last"
        },
        pinWidget: true,
        handler: function customClick(e) {
          e = e ? $.Event(event) : e;
          if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen && document.webkitFullscreenElement) {
            document.webkitExitFullscreen();
          } else if (document.msExitFullscreen && document.msFullscreenElement) {
            document.msExitFullscreen();
          }
          me.trigger("viewer:close", e);
          if (!me.isEmbeddedPreview) {
            setTimeout(function() {
              me.$el.find("iframe").css("visibility", "hidden");
            }, 0);
          }
          if (!e || !e.isDefaultPrevented()) {
            me.closeViewer();
          }
        }
      });
    },
    _refreshMarkup: function(bravaApi, URL, edit) {
      if (edit === "true") {
        bravaApi.closeMarkupFile({
          uri: URL,
          forceClose: "true"
        }).then(function() {
          bravaApi.openMarkupFile({
            url: URL,
            options: {
              openForEdit: edit === "true"
            }
          }).then(function() {
            bravaApi.activateMarkupTool({
              tool: "default"
            });
          }, function() {
            Alert(lang.RefreshMarkupFailMessage);
            bravaApi.activateMarkupTool({
              tool: "default"
            });
          });
        });
      } else {
        bravaApi.openMarkupFile({
          url: URL,
          options: {
            openForEdit: false
          }
        }).then(function() {
          bravaApi.activateMarkupTool({
            tool: "default"
          });
        }, function() {
          Alert(lang.RefreshMarkupFailMessage);
          bravaApi.activateMarkupTool({
            tool: "default"
          });
        });
      }
    },
    _addCustomRefreshMarkupButton: function(bravaApi) {
      var me = this;
      this._addCustomButton(bravaApi, {
        varName: "customRefreshMarkupButton",
        tooltip: lang.ButtonRefreshMarkup,
        icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgaWQ9ImFjdGlvbl92aWV3ZXJfcmVsb2FkX21hcmt1cDI0Ij4KPGcgaWQ9InN0YXR1c19tYXJrdXBfYXZhaWxhYmUyNCIgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwKSI+CjxnIGlkPSJHcm91cCAxNCI+CjxnIGlkPSJHcm91cCAxNSI+CjxnIGlkPSJHcm91cCAxNiI+CjxwYXRoIGlkPSJFbGxpcHNlIDIgKFN0cm9rZSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTMuNDg5NSAyMC42MzA5QzEzLjUxMTcgMjEuMTEzNyAxMy45MjEgMjEuNDg3IDE0LjQwMzcgMjEuNDY0OEMxNS42MjkzIDIxLjQwODQgMTYuODQzOCAyMS4xMTE0IDE3Ljk3NDcgMjAuNTc3NEMyMC4yMjI1IDE5LjUxNjEgMjEuOTU2NiAxNy42MDUzIDIyLjc5NTUgMTUuMjY1NEMyMy42MzQ1IDEyLjkyNTUgMjMuNTA5NSAxMC4zNDgyIDIyLjQ0ODIgOC4xMDA0MkMyMi4yNDE4IDcuNjYzNDMgMjEuNzIwMyA3LjQ3NjQ1IDIxLjI4MzMgNy42ODI3OEMyMC44NDY0IDcuODg5MTIgMjAuNjU5NCA4LjQxMDYzIDIwLjg2NTcgOC44NDc2MkMyMS43Mjg5IDEwLjY3NTcgMjEuODMwNSAxMi43NzE4IDIxLjE0ODIgMTQuNjc0OEMyMC40NjU5IDE2LjU3NzggMTkuMDU1NiAxOC4xMzE4IDE3LjIyNzUgMTguOTk0OUMxNi4zMDc3IDE5LjQyOTMgMTUuMzIwMSAxOS42NzA4IDE0LjMyMzMgMTkuNzE2NkMxMy44NDA2IDE5LjczODggMTMuNDY3MiAyMC4xNDgyIDEzLjQ4OTUgMjAuNjMwOVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGlkPSJWZWN0b3IgNSAoU3Ryb2tlKSIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xOC4wMjE0IDIyLjk2OTRDMTguMjA4IDIyLjUyMzcgMTcuOTk3OSAyMi4wMTEgMTcuNTUyMSAyMS44MjQ1TDE1LjA5NDIgMjAuNzk1N0wxNi4xMjMgMTguMzM3OEMxNi4zMDk2IDE3Ljg5MiAxNi4wOTk1IDE3LjM3OTQgMTUuNjUzNyAxNy4xOTI4QzE1LjIwOCAxNy4wMDYyIDE0LjY5NTMgMTcuMjE2MyAxNC41MDg3IDE3LjY2MjFMMTIuODA0MiAyMS43MzQyTDE2Ljg3NjQgMjMuNDM4N0MxNy4zMjIyIDIzLjYyNTMgMTcuODM0OCAyMy40MTUyIDE4LjAyMTQgMjIuOTY5NFoiIGZpbGw9IndoaXRlIi8+CjwvZz4KPGcgaWQ9Ikdyb3VwIDE3Ij4KPHBhdGggaWQ9IkVsbGlwc2UgMiAoU3Ryb2tlKV8yIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEwLjUxMDMgMi45NDk4M0MxMC40ODgxIDIuNDY3MDkgMTAuMDc4OCAyLjA5Mzc2IDkuNTk2MDEgMi4xMTU5OEM4LjM3MDQ0IDIuMTcyMzcgNy4xNTU5OSAyLjQ2OTMzIDYuMDI1MDIgMy4wMDMzNEMzLjc3NzI1IDQuMDY0NjggMi4wNDMxNiA1Ljk3NTQ3IDEuMjA0MjMgOC4zMTUzNkMwLjM2NTI5NyAxMC42NTUyIDAuNDkwMjQxIDEzLjIzMjYgMS41NTE1OCAxNS40ODAzQzEuNzU3OTEgMTUuOTE3MyAyLjI3OTQyIDE2LjEwNDMgMi43MTY0MSAxNS44OThDMy4xNTM0IDE1LjY5MTYgMy4zNDAzOCAxNS4xNzAxIDMuMTM0MDQgMTQuNzMzMUMyLjI3MDg4IDEyLjkwNTEgMi4xNjkyNiAxMC44MDkgMi44NTE1NSA4LjkwNTk4QzMuNTMzODQgNy4wMDI5OSA0Ljk0NDE0IDUuNDQ4OTcgNi43NzIyMiA0LjU4NTgxQzcuNjkyMDIgNC4xNTE1IDguNjc5NjQgMy45MDk5OSA5LjY3NjQ1IDMuODY0MTNDMTAuMTU5MiAzLjg0MTkxIDEwLjUzMjUgMy40MzI1NyAxMC41MTAzIDIuOTQ5ODNaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBpZD0iVmVjdG9yIDUgKFN0cm9rZSlfMiIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik01Ljk3ODM3IDAuNjExMzAxQzUuNzkxNzggMS4wNTcwNyA2LjAwMTg5IDEuNTY5NzEgNi40NDc2NyAxLjc1NjNMOC45MDU1NCAyLjc4NTFMNy44NzY3NCA1LjI0Mjk3QzcuNjkwMTUgNS42ODg3NCA3LjkwMDI2IDYuMjAxMzcgOC4zNDYwMyA2LjM4Nzk2QzguNzkxOCA2LjU3NDU1IDkuMzA0NDQgNi4zNjQ0NCA5LjQ5MTAyIDUuOTE4NjdMMTEuMTk1NSAxLjg0NjUxTDcuMTIzMzcgMC4xNDIwMDdDNi42Nzc1OSAtMC4wNDQ1ODI1IDYuMTY0OTYgMC4xNjU1MjggNS45NzgzNyAwLjYxMTMwMVoiIGZpbGw9IndoaXRlIi8+CjwvZz4KPC9nPgo8L2c+CjxwYXRoIGlkPSJWZWN0b3IiIGQ9Ik0xOS44MzA5IDUuNzM5NzZDMTkuNjY2NCA0LjIyNjcyIDE4LjMwNjMgMy4xMzMzOSAxNi43OTM1IDMuMjk3ODlDMTYuMzY4MiAzLjM0MzgyIDE1Ljk1OTUgMy40ODgzMSAxNS41OTk5IDMuNzE5ODdDMTUuMjQwMiAzLjk1MTQ0IDE0LjkzOTUgNC4yNjM3IDE0LjcyMTcgNC42MzE4NEw1LjkzMTE0IDE1LjU2NzFMMTAuMTgzNCAxOC45ODUzTDE4Ljk3MzkgOC4wNDk2M0MxOS4yODY2IDcuNzU3OCAxOS41MjY4IDcuMzk3MDUgMTkuNjc1NiA2Ljk5NjA2QzE5LjgyNDQgNi41OTUwNyAxOS44Nzc2IDYuMTY0OTEgMTkuODMwOSA1LjczOTc2VjUuNzM5NzZaTTMuOTA2NTQgMjIuNDM5Nkw0Ljk1NDgxIDE2Ljc4MTlMOS4yMDcwNiAyMC4yMDAxTDMuOTA2NTQgMjIuNDM5NloiIGZpbGw9IiNERjFBMjIiLz4KPC9nPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=",
        hoverIcon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgaWQ9ImFjdGlvbl92aWV3ZXJfcmVsb2FkX21hcmt1cDI0Ij4KPGcgaWQ9InN0YXR1c19tYXJrdXBfYXZhaWxhYmUyNCIgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwKSI+CjxnIGlkPSJHcm91cCAxNCI+CjxnIGlkPSJHcm91cCAxNSI+CjxnIGlkPSJHcm91cCAxNiI+CjxwYXRoIGlkPSJFbGxpcHNlIDIgKFN0cm9rZSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTMuNDg5NSAyMC42MzA5QzEzLjUxMTcgMjEuMTEzNyAxMy45MjEgMjEuNDg3IDE0LjQwMzcgMjEuNDY0OEMxNS42MjkzIDIxLjQwODQgMTYuODQzOCAyMS4xMTE0IDE3Ljk3NDcgMjAuNTc3NEMyMC4yMjI1IDE5LjUxNjEgMjEuOTU2NiAxNy42MDUzIDIyLjc5NTUgMTUuMjY1NEMyMy42MzQ1IDEyLjkyNTUgMjMuNTA5NSAxMC4zNDgyIDIyLjQ0ODIgOC4xMDA0MkMyMi4yNDE4IDcuNjYzNDMgMjEuNzIwMyA3LjQ3NjQ1IDIxLjI4MzMgNy42ODI3OEMyMC44NDY0IDcuODg5MTIgMjAuNjU5NCA4LjQxMDYzIDIwLjg2NTcgOC44NDc2MkMyMS43Mjg5IDEwLjY3NTcgMjEuODMwNSAxMi43NzE4IDIxLjE0ODIgMTQuNjc0OEMyMC40NjU5IDE2LjU3NzggMTkuMDU1NiAxOC4xMzE4IDE3LjIyNzUgMTguOTk0OUMxNi4zMDc3IDE5LjQyOTMgMTUuMzIwMSAxOS42NzA4IDE0LjMyMzMgMTkuNzE2NkMxMy44NDA2IDE5LjczODggMTMuNDY3MiAyMC4xNDgyIDEzLjQ4OTUgMjAuNjMwOVoiIGZpbGw9IiM2Mjc3ODMiLz4KPHBhdGggaWQ9IlZlY3RvciA1IChTdHJva2UpIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE4LjAyMTQgMjIuOTY5NEMxOC4yMDggMjIuNTIzNyAxNy45OTc5IDIyLjAxMSAxNy41NTIxIDIxLjgyNDVMMTUuMDk0MiAyMC43OTU3TDE2LjEyMyAxOC4zMzc4QzE2LjMwOTYgMTcuODkyIDE2LjA5OTUgMTcuMzc5NCAxNS42NTM3IDE3LjE5MjhDMTUuMjA4IDE3LjAwNjIgMTQuNjk1MyAxNy4yMTYzIDE0LjUwODcgMTcuNjYyMUwxMi44MDQyIDIxLjczNDJMMTYuODc2NCAyMy40Mzg3QzE3LjMyMjIgMjMuNjI1MyAxNy44MzQ4IDIzLjQxNTIgMTguMDIxNCAyMi45Njk0WiIgZmlsbD0iIzYyNzc4MyIvPgo8L2c+CjxnIGlkPSJHcm91cCAxNyI+CjxwYXRoIGlkPSJFbGxpcHNlIDIgKFN0cm9rZSlfMiIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMC41MTAzIDIuOTQ5ODNDMTAuNDg4MSAyLjQ2NzA5IDEwLjA3ODggMi4wOTM3NiA5LjU5NjAxIDIuMTE1OThDOC4zNzA0NCAyLjE3MjM3IDcuMTU1OTkgMi40NjkzMyA2LjAyNTAyIDMuMDAzMzRDMy43NzcyNSA0LjA2NDY4IDIuMDQzMTYgNS45NzU0NyAxLjIwNDIzIDguMzE1MzZDMC4zNjUyOTcgMTAuNjU1MiAwLjQ5MDI0MSAxMy4yMzI2IDEuNTUxNTggMTUuNDgwM0MxLjc1NzkxIDE1LjkxNzMgMi4yNzk0MiAxNi4xMDQzIDIuNzE2NDEgMTUuODk4QzMuMTUzNCAxNS42OTE2IDMuMzQwMzggMTUuMTcwMSAzLjEzNDA0IDE0LjczMzFDMi4yNzA4OCAxMi45MDUxIDIuMTY5MjYgMTAuODA5IDIuODUxNTUgOC45MDU5OEMzLjUzMzg0IDcuMDAyOTkgNC45NDQxNCA1LjQ0ODk3IDYuNzcyMjIgNC41ODU4MUM3LjY5MjAyIDQuMTUxNSA4LjY3OTY0IDMuOTA5OTkgOS42NzY0NSAzLjg2NDEzQzEwLjE1OTIgMy44NDE5MSAxMC41MzI1IDMuNDMyNTcgMTAuNTEwMyAyLjk0OTgzWiIgZmlsbD0iIzYyNzc4MyIvPgo8cGF0aCBpZD0iVmVjdG9yIDUgKFN0cm9rZSlfMiIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik01Ljk3ODM3IDAuNjExMzAxQzUuNzkxNzggMS4wNTcwNyA2LjAwMTg5IDEuNTY5NzEgNi40NDc2NyAxLjc1NjNMOC45MDU1NCAyLjc4NTFMNy44NzY3NCA1LjI0Mjk3QzcuNjkwMTUgNS42ODg3NCA3LjkwMDI2IDYuMjAxMzcgOC4zNDYwMyA2LjM4Nzk2QzguNzkxOCA2LjU3NDU1IDkuMzA0NDQgNi4zNjQ0NCA5LjQ5MTAyIDUuOTE4NjdMMTEuMTk1NSAxLjg0NjUxTDcuMTIzMzcgMC4xNDIwMDdDNi42Nzc1OSAtMC4wNDQ1ODI1IDYuMTY0OTYgMC4xNjU1MjggNS45NzgzNyAwLjYxMTMwMVoiIGZpbGw9IiM2Mjc3ODMiLz4KPC9nPgo8L2c+CjwvZz4KPHBhdGggaWQ9IlZlY3RvciIgZD0iTTE5LjgzMDkgNS43Mzk3NkMxOS42NjY0IDQuMjI2NzIgMTguMzA2MyAzLjEzMzM5IDE2Ljc5MzUgMy4yOTc4OUMxNi4zNjgyIDMuMzQzODIgMTUuOTU5NSAzLjQ4ODMxIDE1LjU5OTkgMy43MTk4N0MxNS4yNDAyIDMuOTUxNDQgMTQuOTM5NSA0LjI2MzcgMTQuNzIxNyA0LjYzMTg0TDUuOTMxMTQgMTUuNTY3MUwxMC4xODM0IDE4Ljk4NTNMMTguOTczOSA4LjA0OTYzQzE5LjI4NjYgNy43NTc4IDE5LjUyNjggNy4zOTcwNSAxOS42NzU2IDYuOTk2MDZDMTkuODI0NCA2LjU5NTA3IDE5Ljg3NzYgNi4xNjQ5MSAxOS44MzA5IDUuNzM5NzZWNS43Mzk3NlpNMy45MDY1NCAyMi40Mzk2TDQuOTU0ODEgMTYuNzgxOUw5LjIwNzA2IDIwLjIwMDFMMy45MDY1NCAyMi40Mzk2WiIgZmlsbD0iI0RGMUEyMiIvPgo8L2c+CjwvZz4KPGRlZnM+CjxjbGlwUGF0aCBpZD0iY2xpcDAiPgo8cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiM2Mjc3ODMiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4K",
        activeIcon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgaWQ9ImFjdGlvbl92aWV3ZXJfcmVsb2FkX21hcmt1cDI0Ij4KPGcgaWQ9InN0YXR1c19tYXJrdXBfYXZhaWxhYmUyNCIgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwKSI+CjxnIGlkPSJHcm91cCAxNCI+CjxnIGlkPSJHcm91cCAxNSI+CjxnIGlkPSJHcm91cCAxNiI+CjxwYXRoIGlkPSJFbGxpcHNlIDIgKFN0cm9rZSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTMuNDg5NSAyMC42MzA5QzEzLjUxMTcgMjEuMTEzNyAxMy45MjEgMjEuNDg3IDE0LjQwMzcgMjEuNDY0OEMxNS42MjkzIDIxLjQwODQgMTYuODQzOCAyMS4xMTE0IDE3Ljk3NDcgMjAuNTc3NEMyMC4yMjI1IDE5LjUxNjEgMjEuOTU2NiAxNy42MDUzIDIyLjc5NTUgMTUuMjY1NEMyMy42MzQ1IDEyLjkyNTUgMjMuNTA5NSAxMC4zNDgyIDIyLjQ0ODIgOC4xMDA0MkMyMi4yNDE4IDcuNjYzNDMgMjEuNzIwMyA3LjQ3NjQ1IDIxLjI4MzMgNy42ODI3OEMyMC44NDY0IDcuODg5MTIgMjAuNjU5NCA4LjQxMDYzIDIwLjg2NTcgOC44NDc2MkMyMS43Mjg5IDEwLjY3NTcgMjEuODMwNSAxMi43NzE4IDIxLjE0ODIgMTQuNjc0OEMyMC40NjU5IDE2LjU3NzggMTkuMDU1NiAxOC4xMzE4IDE3LjIyNzUgMTguOTk0OUMxNi4zMDc3IDE5LjQyOTMgMTUuMzIwMSAxOS42NzA4IDE0LjMyMzMgMTkuNzE2NkMxMy44NDA2IDE5LjczODggMTMuNDY3MiAyMC4xNDgyIDEzLjQ4OTUgMjAuNjMwOVoiIGZpbGw9IiM2Mjc3ODMiLz4KPHBhdGggaWQ9IlZlY3RvciA1IChTdHJva2UpIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE4LjAyMTQgMjIuOTY5NEMxOC4yMDggMjIuNTIzNyAxNy45OTc5IDIyLjAxMSAxNy41NTIxIDIxLjgyNDVMMTUuMDk0MiAyMC43OTU3TDE2LjEyMyAxOC4zMzc4QzE2LjMwOTYgMTcuODkyIDE2LjA5OTUgMTcuMzc5NCAxNS42NTM3IDE3LjE5MjhDMTUuMjA4IDE3LjAwNjIgMTQuNjk1MyAxNy4yMTYzIDE0LjUwODcgMTcuNjYyMUwxMi44MDQyIDIxLjczNDJMMTYuODc2NCAyMy40Mzg3QzE3LjMyMjIgMjMuNjI1MyAxNy44MzQ4IDIzLjQxNTIgMTguMDIxNCAyMi45Njk0WiIgZmlsbD0iIzYyNzc4MyIvPgo8L2c+CjxnIGlkPSJHcm91cCAxNyI+CjxwYXRoIGlkPSJFbGxpcHNlIDIgKFN0cm9rZSlfMiIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMC41MTAzIDIuOTQ5ODNDMTAuNDg4MSAyLjQ2NzA5IDEwLjA3ODggMi4wOTM3NiA5LjU5NjAxIDIuMTE1OThDOC4zNzA0NCAyLjE3MjM3IDcuMTU1OTkgMi40NjkzMyA2LjAyNTAyIDMuMDAzMzRDMy43NzcyNSA0LjA2NDY4IDIuMDQzMTYgNS45NzU0NyAxLjIwNDIzIDguMzE1MzZDMC4zNjUyOTcgMTAuNjU1MiAwLjQ5MDI0MSAxMy4yMzI2IDEuNTUxNTggMTUuNDgwM0MxLjc1NzkxIDE1LjkxNzMgMi4yNzk0MiAxNi4xMDQzIDIuNzE2NDEgMTUuODk4QzMuMTUzNCAxNS42OTE2IDMuMzQwMzggMTUuMTcwMSAzLjEzNDA0IDE0LjczMzFDMi4yNzA4OCAxMi45MDUxIDIuMTY5MjYgMTAuODA5IDIuODUxNTUgOC45MDU5OEMzLjUzMzg0IDcuMDAyOTkgNC45NDQxNCA1LjQ0ODk3IDYuNzcyMjIgNC41ODU4MUM3LjY5MjAyIDQuMTUxNSA4LjY3OTY0IDMuOTA5OTkgOS42NzY0NSAzLjg2NDEzQzEwLjE1OTIgMy44NDE5MSAxMC41MzI1IDMuNDMyNTcgMTAuNTEwMyAyLjk0OTgzWiIgZmlsbD0iIzYyNzc4MyIvPgo8cGF0aCBpZD0iVmVjdG9yIDUgKFN0cm9rZSlfMiIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik01Ljk3ODM3IDAuNjExMzAxQzUuNzkxNzggMS4wNTcwNyA2LjAwMTg5IDEuNTY5NzEgNi40NDc2NyAxLjc1NjNMOC45MDU1NCAyLjc4NTFMNy44NzY3NCA1LjI0Mjk3QzcuNjkwMTUgNS42ODg3NCA3LjkwMDI2IDYuMjAxMzcgOC4zNDYwMyA2LjM4Nzk2QzguNzkxOCA2LjU3NDU1IDkuMzA0NDQgNi4zNjQ0NCA5LjQ5MTAyIDUuOTE4NjdMMTEuMTk1NSAxLjg0NjUxTDcuMTIzMzcgMC4xNDIwMDdDNi42Nzc1OSAtMC4wNDQ1ODI1IDYuMTY0OTYgMC4xNjU1MjggNS45NzgzNyAwLjYxMTMwMVoiIGZpbGw9IiM2Mjc3ODMiLz4KPC9nPgo8L2c+CjwvZz4KPHBhdGggaWQ9IlZlY3RvciIgZD0iTTE5LjgzMDkgNS43Mzk3NkMxOS42NjY0IDQuMjI2NzIgMTguMzA2MyAzLjEzMzM5IDE2Ljc5MzUgMy4yOTc4OUMxNi4zNjgyIDMuMzQzODIgMTUuOTU5NSAzLjQ4ODMxIDE1LjU5OTkgMy43MTk4N0MxNS4yNDAyIDMuOTUxNDQgMTQuOTM5NSA0LjI2MzcgMTQuNzIxNyA0LjYzMTg0TDUuOTMxMTQgMTUuNTY3MUwxMC4xODM0IDE4Ljk4NTNMMTguOTczOSA4LjA0OTYzQzE5LjI4NjYgNy43NTc4IDE5LjUyNjggNy4zOTcwNSAxOS42NzU2IDYuOTk2MDZDMTkuODI0NCA2LjU5NTA3IDE5Ljg3NzYgNi4xNjQ5MSAxOS44MzA5IDUuNzM5NzZWNS43Mzk3NlpNMy45MDY1NCAyMi40Mzk2TDQuOTU0ODEgMTYuNzgxOUw5LjIwNzA2IDIwLjIwMDFMMy45MDY1NCAyMi40Mzk2WiIgZmlsbD0iI0RGMUEyMiIvPgo8L2c+CjwvZz4KPGRlZnM+CjxjbGlwUGF0aCBpZD0iY2xpcDAiPgo8cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiM2Mjc3ODMiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4K",
        container: {
          name: "MarkupTools",
          placement: {
            toolbarRegion: "Start",
            buttonPosition: "First"
          }
        },
        pinWidget: true,
        handler: function customClick() {
          bravaApi.getAllAvailableMarkups().then(function(xml) {
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(xml, "text/xml");
            var markups = xmlDoc.getElementsByTagName("Markup");
            bravaApi.closeAllMarkupFilesForReview().then(function() {
              for (var x = 0; x < markups.length; x++) {
                var URL = markups[x].getElementsByTagName("URI")[0].childNodes[0].nodeValue;
                var edit = markups[x].getElementsByTagName("AvailableForEdit")[0].textContent;
                me._refreshMarkup(bravaApi, URL, edit);
              }
            }, function() {
              Alert(lang.RefreshMarkupFailMessage);
            });
          }, function() {
            Alert(lang.RefreshMarkupFailMessage);
          });
        }
      });
    },
    _addCustomButton: function(bravaApi, options) {
      var me = this, setBtnBg = function(e, icon) {
        var elId = "customBravaWidgetId_" + e.targetId, btnEl = $("#" + me.el.getAttribute("id") + " iframe").contents().find(".dijitButton[widgetId=" + elId + "]");
        btnEl.css({
          backgroundImage: 'url("' + icon + '")'
        });
      };
      if (bravaApi[options.varName] === undefined) {
        bravaApi[options.varName] = bravaApi.addCustomButton({
          type: "Button",
          showLabel: false,
          toolTip: options.tooltip,
          icon: options.icon,
          cssStyleAdjustments: "background-position:center; background-size:24px 24px" + (options.applyRTLStyleForIcon === true && i18n.settings.rtl ? "; transform: scaleX(-1)" : ""),
          container: options.container ? options.container : {
            name: "TaskBar",
            placement: options.placement ? options.placement : {
              toolbarRegion: "Start",
              index: options.position
            }
          },
          pinWidget: options.pinWidget === true,
          eventHandlers: {
            click: options.handler,
            mouseover: function(e) {
              setBtnBg(e, options.hoverIcon);
            },
            mouseout: function(e) {
              setBtnBg(e, options.icon);
            },
            mousedown: function(e) {
              setBtnBg(e, options.activeIcon);
            },
            mouseup: function(e) {
              setBtnBg(e, options.hoverIcon);
            }
          }
        });
      }
    },
    closeViewer: function() {
      var dfd = $.Deferred();
      if (this.bravaApi) {
        var clientNode = this.bravaApi?.bravaContextId ? document.getElementById(this.bravaApi?.bravaContextId) : null;
        if (clientNode) {
          this.bravaApi.closeViewer({
            allowCancel: false
          }).then(function() {
            dfd.resolve();
          }, function() {
            this._onViewerApiError();
            dfd.reject();
          }.bind(this));
        } else {
          dfd.reject();
        }
      } else {
        dfd.reject();
      }
      return dfd.promise();
    },
    _onViewerApiError: function(error) {
      this.trigger("viewer:error", error);
    },
    isAllowAnnotate: function(connector, documentId) {
      var dfd = $.Deferred();
      var allowAnnotate = allowAnnotateCache[documentId];
      if (this.disableAnnotationsForcefully || this.disableAnnotations && this.getExpConfigResult()) {
        dfd.resolve(false);
      } else if (typeof allowAnnotate !== "undefined" && allowAnnotate !== null) {
        dfd.resolve(allowAnnotate);
      } else {
        viewerUtils.isRelatePermission(connector, [ documentId ]).done(function(status) {
          if (status) {
            iViewerUtils.getMarkupMigrationStatusByObjectIds(connector, [ documentId ]).done(function(statusData) {
              allowAnnotate = true;
              if (statusData && statusData.markupMigration && statusData.markupMigration.length > 0) {
                var result = _.filter(statusData.markupMigration, function(object) {
                  return object && object.object_id == documentId;
                });
                if (result && result.length > 0) {
                  var status = _.first(result).status;
                  allowAnnotate = !(status === iViewerUtils.migrationStatusInprogress || status === iViewerUtils.migrationStatusComplete || status === iViewerUtils.migrationStatusFailed || status === iViewerUtils.migrationStatusNotApplicable);
                }
              }
              log.debug("Markup migration status for the document id: {0} is {1}", documentId, !allowAnnotate);
              if (status === iViewerUtils.migrationStatusComplete || status === iViewerUtils.migrationStatusNotApplicable) {
                allowAnnotateCache[documentId] = allowAnnotate;
              }
              dfd.resolve(allowAnnotate);
            }).fail(function(err) {
              log.error("Failed to check markup migration status for the document id: {0} with error message: {1}", documentId, err && err.responseText ? err.responseText : err);
              Alert.showError(lang.DisableMarkupCreationMessage);
              dfd.resolve(false);
            });
          } else {
            allowAnnotate = false;
            allowAnnotateCache[documentId] = allowAnnotate;
            dfd.resolve(allowAnnotate);
          }
        }).fail(function(err) {
          log.error("Failed to check permission for the document id: {0} with error message: {1}", documentId, err && err.responseText ? err.responseText : err);
          Alert.showError(lang.DisableMarkupCreationMessage);
          dfd.resolve(false);
        });
      }
      return dfd;
    }
  });
});