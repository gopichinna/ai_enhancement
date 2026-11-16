/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/models/node/node.model", "nuc/utils/url", "csui/utils/contexts/factories/node", "dctmw/utils/rest.resources", "d2/controls/button.toolbar/button.toolbar.view", "d2/utils/constants", "d2/commands/viewer/document.merge", "d2/dialogs/viewer.markup.selection/select.markup.dialog", "d2/utils/content.assist", "d2/commands/open.plugins/impl/publish/publish.dialog", "d2/utils/format.utils", "csui/controls/progressblocker/blocker", "hbs!d2/commands/open.plugins/impl/bravaenterprise/document.merge.template", "i18n!d2/commands/open.plugins/nls/localized.strings", "css!d2/commands/open.plugins/impl/bravaenterprise/document.merge" ], function(module, require, _, Backbone, $, Marionette, NodeModel, Url, NodeModelFactory, RestResources, ButtonToolbarView, constants, DocumentMergeCommand, SelectMarkupDialog, ContentAssist, PublishDialog, FormatUtils, BlockingView, ViewTemplate, lang) {
  "use strict";
  var moduleConfig = _.defaults(module.config(), {
    basePath: window.sv.config.releaseLocation + window.sv.config.otherBundlesLocation
  });
  var DocumentMergeView = Marionette.ItemView.extend({
    className: "d2-docmergeview",
    template: ViewTemplate,
    templateHelpers: function() {
      return {
        title: lang.DocMergeTitle,
        closeText: lang.ButtonCloseViewer
      };
    },
    ui: {
      close: ".d2-merge-close",
      toolbar: ".d2-docmerge-toolbar"
    },
    constructor: function DocumentMergeView(options) {
      options.data || (options.data = {});
      if (options.collection) {
        throw "Collection viewing is not supported yet.";
      }
      this.viewer = null;
      this.nodes = options.previewNodes;
      this._connector = options.model.connector;
      this.selectedMarkup = options.selectedMarkup;
      if (options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.documentMergeCommand = new DocumentMergeCommand();
      this.targetBrowseContainer = this.nodes.at(0).parent;
      this.viewerDocuments = new Backbone.Collection();
      this.setViewerDocuments();
      this.exportCompleteCallBackBind = this.exportCompleteCallBack.bind(this);
      $(window).off("exportDocMergeComplete", this.exportCompleteCallBackBind).on("exportDocMergeComplete", this.exportCompleteCallBackBind);
      this.viewerDocuments.on("add remove", this.viewerDocumentsUpdate.bind(this));
      this.listenTo(options.context, "sync change:perspective", function() {
        this.onClickClose();
      }.bind(this));
    },
    setViewerDocuments: function() {
      var me = this;
      this.nodes.each(function(node) {
        me.viewerDocuments.add(node);
      });
    },
    viewerDocumentsUpdate: function() {
      if (this.viewerDocuments.length === 0) {
        this.toolbarView.leftButtons.models[1].set("disabled", true);
        this.toolbarView.leftButtons.models[2].set("disabled", true);
        this.toolbarView.leftButtons.models[3].set("disabled", true);
      } else {
        this.toolbarView.leftButtons.models[1].set("disabled", false);
        this.toolbarView.leftButtons.models[2].set("disabled", false);
        this.toolbarView.leftButtons.models[3].set("disabled", false);
      }
    },
    onRender: function() {
      this.ui.close.on("click", _.bind(this.onClickClose, this));
      this._setupToolbarView();
    },
    onClickClose: function() {
      var me = this;
      this.clearMarkupsFromSession().done(function() {
        me.trigger("viewer:close");
        me.destroy();
      });
    },
    _setupToolbarView: function() {
      var region = new Marionette.Region({
        el: this.ui.toolbar
      });
      var buttonsConfig = {
        right: [],
        left: [ {
          id: "addDocument",
          className: "icon",
          iconName: "csui_action_add32",
          tooltip: lang.AddDocument,
          clickHandler: this.addDocuments.bind(this)
        }, {
          id: "removeAll",
          className: "text-button",
          tooltip: lang.RemoveAll,
          label: lang.RemoveAll,
          showLabel: true,
          clickHandler: this.closeAll.bind(this)
        }, {
          id: "mergeAll",
          className: "text-button",
          tooltip: lang.MergeAll,
          label: lang.MergeAll,
          showLabel: true,
          disabled: false,
          hidden: false,
          clickHandler: this.mergeAllDocuments.bind(this)
        }, {
          id: "selectMarkup",
          className: "text-button",
          tooltip: lang.SelectMarkup,
          label: lang.SelectMarkup,
          showLabel: true,
          clickHandler: this.selectMarkup.bind(this)
        } ]
      };
      this.toolbarView = new ButtonToolbarView(buttonsConfig);
      region.show(this.toolbarView);
    },
    onShow: function() {
      this.fetchAndLoadViewer();
    },
    addDocuments: function() {
      var me = this, status = {
        context: this._connector.context
      };
      this.targetBrowseContainer.fetch().done(function() {
        ContentAssist.getContentAssistOptions(status).done(function(config) {
          var title = config ? config.label_value : "";
          var includeBrowse = config && config.properties ? config.properties.has_browse_assist : true;
          var includeFavorites = config && config.properties ? config.properties.has_favorites_assist : false;
          var globalSearch = config && config.properties ? config.properties.has_search_assist : false;
          me.displayContentAssist(status, title, includeBrowse, includeFavorites, globalSearch, me.targetBrowseContainer).done(function(selectedNodes) {
            if (me.isNodesSupportDocMerge(selectedNodes)) {
              var nodeCollection = new Backbone.Collection();
              _.each(selectedNodes, function(node) {
                if (!me.viewerDocuments[node.get("id")]) {
                  nodeCollection.add(node);
                }
              });
              me.targetBrowseContainer = selectedNodes[0].parent;
              var options = {
                nodes: nodeCollection,
                context: me._connector.context,
                connector: me._connector
              };
              var selectMarkupDialog = new SelectMarkupDialog(options);
              selectMarkupDialog.show().done(function(selectedMarkup) {
                me.setSelectedMarkupToSession(selectedMarkup).done(function() {
                  me.selectedMarkup = _.extend(me.selectedMarkup, selectedMarkup);
                  _.each(selectedNodes, function(node) {
                    if (me.viewerDocuments.where({
                      id: node.get("id")
                    }).length === 0) {
                      me.viewerDocuments.add(node);
                      me.loadDocument(node);
                    }
                  });
                });
              }).fail(function() {});
            }
          });
        });
      });
    },
    closeAll: function() {
      var iframe = $("#" + this.viewer.clientId);
      if (iframe.length > 0) {
        var docTopPanes = $(iframe).contents().find(".docTopPane");
        $(docTopPanes).each(function() {
          $(this).find(".closeLink")[0].click();
        });
      }
    },
    mergeAllDocuments: function() {
      var me = this, promises = [];
      this.viewer.clearMergedPages().then(function() {
        me.viewerDocuments.each(function(node) {
          var objId = node.get("id");
          var promise = me.viewer.getLoadedDocumentData({
            documentId: objId
          });
          promises.push(promise);
        });
        $.when(promises).then(function(allPromises) {
          if (allPromises.length > 0) {
            for (var x = 0; x < allPromises.length; x++) {
              var y = x.toString();
              me.addPagesToMerge(allPromises[x], y);
            }
          }
        });
      });
    },
    addPagesToMerge: function(promise, docNum) {
      var me = this;
      promise.then(function(val) {
        for (var j = 0; j < val.pages.length; j++) {
          var pgNum = j + 1;
          me.viewer.addPageToMergedDocument({
            compositionId: val.compositionId,
            requestIndex: docNum,
            pageNumber: pgNum
          });
        }
      });
    },
    displayContentAssist: function(status, title, includeBrowse, includeFavorites, globalSearch, container) {
      var me = this, deferred = $.Deferred();
      require([ "d2/dialogs/target.browse/target.browse" ], function(NodePicker) {
        var pickerOptions = {
          dialogTitle: title,
          connector: me._connector,
          container: container,
          initialContainer: container,
          context: status.context,
          selectMultiple: true,
          includeBrowse: includeBrowse,
          globalSearch: globalSearch,
          includeFavorites: includeFavorites,
          includeRelatedFiles: false,
          selectType: "typeName",
          selectTypeValue: constants.Types.DOCUMENT,
          disableContentTypes: me.documentMergeCommand.getAllNotSupportedContentTypes(false)
        };
        pickerOptions.storeContainer = true;
        pickerOptions.restoreContainer = true;
        pickerOptions.dataId = constants.StorageKey.DOCUMENT_MERGE_VIEW + constants.StorageKey.ANCESTOR_INFO;
        if (!pickerOptions.dialogTitle || pickerOptions.dialogTitle.length === 0) {
          pickerOptions.dialogTitle = lang.TargetBrowseTitle;
        }
        pickerOptions.startLocations = [];
        if (pickerOptions.includeBrowse) {
          pickerOptions.startLocations.push("current.location");
        }
        if (pickerOptions.includeFavorites) {
          pickerOptions.startLocations.push("favorites");
        }
        var nodePicker = new NodePicker(pickerOptions);
        nodePicker.show().done(function(selectedNodes) {
          deferred.resolve(selectedNodes.nodes);
        }).fail(function() {
          deferred.reject("close");
        });
      }, deferred.reject);
      return deferred.promise();
    },
    selectMarkup: function() {
      var me = this;
      if (this.viewerDocuments.length === 0) {
        return;
      }
      var options = {
        nodes: this.viewerDocuments,
        context: this._connector.context,
        connector: this._connector,
        selectedMarkup: this.selectedMarkup
      };
      var selectMarkupDialog = new SelectMarkupDialog(options);
      selectMarkupDialog.show().done(function(selectedMarkup) {
        me.selectedMarkup = selectedMarkup;
        var objectKeys = _.keys(selectedMarkup);
        var markupCount = 0;
        _.each(objectKeys, function(docId) {
          markupCount += selectedMarkup[docId].length;
        });
        if (markupCount > 0) {
          me._loadViewer();
        }
      }).fail(function() {});
    },
    isNodesSupportDocMerge: function(selection) {
      if (selection.length !== 0) {
        var nodeCollection = new Backbone.Collection();
        _.each(selection, function(node) {
          nodeCollection.add(node);
        });
        var status = {
          nodes: nodeCollection
        };
        var documentMergeEnable = this.documentMergeCommand.enabled(status);
        return documentMergeEnable;
      }
      return false;
    },
    fetchAndLoadViewer: function() {
      var me = this, currentRepo = RestResources.getCurrentRepository().get("name"), currentUser = RestResources.getCurrentUser().get("name"), documentId = me.model.get("id"), tzoffset = FormatUtils.getTimezoneOffset(), href = Url.combine(me._connector.connection.url, "repositories", currentRepo, "bravaenterprise", "getClientLoadData"), qParams = {
        repo: currentRepo,
        log: currentUser,
        docid: documentId,
        tzoffset: tzoffset
      };
      href = Url.appendQuery(href, Url.combineQueryString(qParams));
      this.blockActions();
      $.ajax(me._connector.extendAjaxOptions({
        url: href,
        type: "GET",
        success: function(data) {
          data = JSON.parse(data);
          me.isCrossOrigin = data.isCrossOrigin;
          me.corsServersEntries = data.corsServersEntries;
          me.unblockActions();
          me._loadViewer();
        },
        error: function(error) {
          me.unblockActions();
          me.destroy();
          if (error.message) {
            require([ "d2/controls/globalmessage/globalmessage" ], function(GlobalMessage) {
              GlobalMessage.showMessage("error", error.message, undefined, {});
            });
          }
        }
      }));
    },
    _loadViewer: function() {
      var me = this, currentUser = RestResources.getCurrentUser().get("name"), signConfigUrl = this._getHtmlViewerSignConfigUrl();
      $(this.el).find(".d2-bravadocmergeviewer").html("");
      this.setSelectedMarkupToSession(this.selectedMarkup).done(function() {
        require([ "igc/HTML/html-clients" ], function loadScripts() {
          require([ "igc/DocMerge/viewer/docmerge" ], function loadScripts() {
            var dmClient = window.brava.htmlClients.create("docmerge", {
              clientType: "docmerge",
              path: moduleConfig.basePath + "/igc/DocMerge/viewer",
              container: "d2-bravadocmergeviewer",
              showCloseButton: false,
              userName: currentUser,
              logLevel: "all",
              nodeType: "iframe",
              isCrossOrigin: me.isCrossOrigin,
              corsServersEntries: me.corsServersEntries,
              height: "100%",
              width: "100%",
              signedConfigUrl: signConfigUrl,
              xmlPostType: "text/xml",
              requestHeaders: me._getSharedHeaderParams(),
              useCompatibilityPrint: true,
              ui: {},
              onDocumentExport: "fire-event"
            });
            dmClient.apiPromise.then(function(api) {
              me.viewer = api;
              me.viewerDocuments.each(function(node) {
                me.loadDocument(node);
              });
              api.on("DocMergeClosed", function() {
                me.trigger("viewer:close");
                me.destroy();
              });
              api.on("DocumentClosed", function(data) {
                me.unloadDocument(data);
              });
            });
          }, function() {
            me._onViewerApiError("HTML Client file load failed");
          });
        }, function() {
          me._onViewerApiError("HTML Client file load failed");
        });
      });
    },
    loadDocument: function(node) {
      this.viewer.loadDocument({
        title: node.get("title"),
        documentId: node.get("id")
      });
    },
    unloadDocument: function(data) {
      var documentId = data.content.documentId;
      var node = this.viewerDocuments.where({
        id: documentId
      });
      delete this.selectedMarkup[documentId];
      this.viewerDocuments.remove(node);
    },
    setSelectedMarkupToSession: function(selectedMarkup) {
      var me = this, currentRepo = RestResources.getCurrentRepository().get("name"), href = Url.combine(me._connector.connection.url, "repositories", currentRepo, "bravaenterprise", "docmerge", "markup-selection"), markupData = {
        selectedMarkUpAndDocument: []
      };
      var objectKeys = _.keys(selectedMarkup);
      _.each(objectKeys, function(docId) {
        markupData.selectedMarkUpAndDocument.push({
          documentId: docId,
          markUps: selectedMarkup[docId]
        });
      });
      return $.ajax(me._connector.extendAjaxOptions({
        url: href,
        type: "POST",
        contentType: constants.MediaTypes.DCTM_JSON,
        data: JSON.stringify(markupData)
      }));
    },
    clearMarkupsFromSession: function() {
      var currentRepo = RestResources.getCurrentRepository().get("name"), href = Url.combine(this._connector.connection.url, "repositories", currentRepo, "bravaenterprise", "docmerge", "markup-selection", "clear");
      return $.ajax(this._connector.extendAjaxOptions({
        url: href,
        type: "DELETE",
        contentType: constants.MediaTypes.DCTM_JSON
      }));
    },
    _getHtmlViewerSignConfigUrl: function() {
      var currentUser = RestResources.getCurrentUser().get("name"), currentRepo = RestResources.getCurrentRepository().get("name"), tzoffset = FormatUtils.getTimezoneOffset(), url = Url.combine(this._connector.connection.url, "repositories", currentRepo, "bravaenterprise", "docmerge", "signconfig");
      var qParams = {
        repo: currentRepo,
        log: currentUser,
        tzoffset: tzoffset
      };
      return Url.appendQuery(url, Url.combineQueryString(qParams));
    },
    _getSharedHeaderParams: function() {
      var headers = {};
      this.model.connector.authenticator.setAuthenticationHeaders(headers);
      return headers;
    },
    _onViewerApiError: function(error) {
      this.trigger("viewer:error", error);
    },
    reloadViewer: function() {
      this.fetchAndLoadViewer();
    },
    exportCompleteCallBack: function(e) {
      this.showPublishDialog(e);
    },
    showPublishDialog: function(e) {
      $(this.el).parents(".csui-full-page-modal").css("z-index", "1044");
      var dialog = new PublishDialog({
        publishUrl: e.detail.url,
        type: e.detail.type.toLowerCase(),
        node: this.model,
        context: this._connector.context,
        addExtraOptions: [],
        defaultFileName: ""
      });
      dialog.show();
    },
    onDestroy: function() {
      $(window).off("exportDocMergeComplete", this.exportCompleteCallBackBind);
    }
  });
  return DocumentMergeView;
});