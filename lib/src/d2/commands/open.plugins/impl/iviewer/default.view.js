/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/utils/contexts/factories/node", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "dctmw/dialogs/authentication/oauth.login.dialog", "nuc/utils/log", "nuc/utils/url", "d2/controls/behaviors/viewer.masking.behavior", "csui/dialogs/modal.alert/modal.alert", "csui/controls/globalmessage/globalmessage", "csui/controls/progressblocker/blocker", "d2/utils/server.query.utils", "d2/utils/widget.constants", "d2/commands/open.plugins/impl/iviewer/utils", "d2/commands/open.plugins/impl/viewer.utils", "d2/commands/open.plugins/impl/markup.migration/view", "i18n!d2/commands/open.plugins/nls/localized.strings", "css!d2/commands/open.plugins/impl/iviewer/default" ], function(_, $, Marionette, NodeModelFactory, RestLinkrels, RestResources, OAuthLoginDialog, log, Url, ViewerMaskingBehavior, ModalAlert, GlobalMessage, BlockingView, serverQueryUtils, widgetConstants, iViewerUtils, viewerUtils, MarkupMigrationView, lang) {
  "use strict";
  var ivWidgetConfiguration, intelligentViewerConfig, isIVAnnotateDisabled, layout, userDefaultWidgets, userLanguage, currentUser = RestResources.getCurrentUser();
  if (currentUser && !_.isEmpty(currentUser)) {
    userDefaultWidgets = currentUser.get("defaultWidgets");
    userLanguage = currentUser.get("preferences")["default_language"];
  }
  if (userDefaultWidgets && !_.isEmpty(userDefaultWidgets)) {
    ivWidgetConfiguration = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAIV, userDefaultWidgets[widgetConstants.DEFAULT.BRAVAIV]);
  }
  if (ivWidgetConfiguration && !_.isEmpty(ivWidgetConfiguration)) {
    intelligentViewerConfig = JSON.parse(ivWidgetConfiguration.widgetParams["brava_iv_configuration"]);
    isIVAnnotateDisabled = ivWidgetConfiguration.widgetParams["is_brava_iv_disable_annotate"];
  }
  if (isIVAnnotateDisabled) {
    var removeAnnotationFeature = intelligentViewerConfig.leftTabContainer && intelligentViewerConfig.leftTabContainer.tabs;
    removeAnnotationFeature = removeAnnotationFeature.filter(function(value) {
      if (_.contains([ "MarkupPane", "StampRasterPane", "TakeoffPane" ], value.component)) {
        return false;
      } else {
        return true;
      }
    });
    intelligentViewerConfig.leftTabContainer.tabs = removeAnnotationFeature;
  }
  if (intelligentViewerConfig && !_.isEmpty(intelligentViewerConfig)) {
    layout = _.defaults({
      topToolbar: "toolbarWithMarkupStuff",
      toolbarWithMarkupStuff: intelligentViewerConfig.toolbarWithMarkupStuff,
      mainContainer: [ {
        component: "TabContainer",
        layoutKey: "leftTabContainer"
      }, {
        component: "PageContainer"
      } ]
    }, intelligentViewerConfig);
  }
  var viewerClassName = "d2-bravaintelligentviewer";
  var appleMatches = navigator.userAgent.match(/(iPad)/i);
  if (appleMatches) {
    viewerClassName = "d2-brava-iviewer-ipad";
  }
  if (userLanguage && !_.isEmpty(userLanguage)) {
    window.___BRAVA_LOCALE___ = userLanguage;
  }
  return Marionette.ItemView.extend({
    className: viewerClassName,
    template: _.template('<div id="migrationInfo" class="migration-info binf-hidden"></div><div id="bravaViewRoot" class="d2-iv-viewer-div"></div>'),
    behaviors: {
      MaskingBehavior: {
        behaviorClass: ViewerMaskingBehavior
      }
    },
    constructor: function DefaultViewer(options) {
      if (options == null) {
        log.error("OpenText Intelligent Viewing options is missing");
        return;
      }
      if (!options.model) {
        options.model = options.context.getModel(NodeModelFactory, {
          attributes: {
            id: options.data.id,
            version_number: options.data.version_number
          }
        });
      }
      this.ivWidgetName = null;
      if (userDefaultWidgets && !_.isEmpty(userDefaultWidgets) && !_.isEmpty(userDefaultWidgets[widgetConstants.DEFAULT.BRAVAIV])) {
        this.ivWidgetName = userDefaultWidgets[widgetConstants.DEFAULT.BRAVAIV];
      }
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.isPreviewMode = options.isPreviewMode;
      this.isEmbeddedPreview = options.isEmbeddedPreview ? options.isEmbeddedPreview : false;
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.api = null;
      this.isExpanded = false;
      this.nodes = options.previewNodes;
      this.listenTo(this.model, "change", this.onChangeModel);
      this.listenTo(this, "panel:expand", function() {
        this.isExpanded = true;
        this.showCollapseViewerButton();
      }.bind(this));
      this.listenTo(this, "panel:collapse", function() {
        this.isExpanded = false;
        this.showExpandViewerButton();
      }.bind(this));
      this.viewerId = _.uniqueId("viewer_");
      this.migrationStatusId = _.uniqueId("migration_");
      this.isRelatePermission = false;
      this.initIntelligentViewerConfig();
      this.listenTo(options.context, "sync change:perspective", function() {
        this.isAppliedMask() && this.trigger("remove:mask");
        this.clearViewer();
      }.bind(this));
      if (this.isPreviewMode) {
        !this.isAppliedMask() && this.trigger("apply:mask");
      }
    },
    ui: {
      markupMigration: "#migrationInfo"
    },
    initIntelligentViewerConfig: function() {
      this.bearerToken = null;
      this.bravaIVConfiguration = null;
      this.currentPageConfig = null;
      this.bravaReadyEventCallBackBind = this.bravaReadyEventCallBack.bind(this);
      $(window).off("bravaReady", this.bravaReadyEventCallBackBind).on("bravaReady", this.bravaReadyEventCallBackBind);
    },
    bravaReadyEventCallBack: function(e) {
      if (this.currentPageConfig) {
        return;
      }
      var me = this;
      this.currentPageConfig = e.detail;
      $("body").addClass("ot-iviewer-overflow");
      this.setViewerConfig();
      if (this.isPreviewMode) {
        if (this.isEmbeddedPreview) {
          $(this.el).addClass("d2-embedded-preview");
          this.api.hideToolbarButtons([ "popInViewerButtonButton", "expandViewerButtonButton", "collapseViewerButtonButton" ]);
        } else {
          this.api.hideToolbarButtons([ "popInViewerButtonButton", "popOutViewerButtonButton", "collapseViewerButtonButton" ]);
          this.isExpanded && this.showCollapseViewerButton();
        }
      } else {
        this.api.hideToolbarButtons([ "popInViewerButtonButton", "popOutViewerButtonButton", "expandViewerButtonButton", "collapseViewerButtonButton" ]);
        this.options.showCollapseButton && this.api.unhideToolbarButtons([ "popInViewerButtonButton" ]);
      }
      this.getPublicationDeferred.done(function(response) {
        me.addPublication(response);
        me.unblockActions();
      }).fail(function() {
        me._pageRendered();
        me.destroy();
      });
    },
    _closeEvent: function(e) {
      this.migrationStatusTimer && clearInterval(this.migrationStatusTimer);
      this.checkDirtyMarkupAndCloseOrPopOut(e, true);
    },
    _doClose: function(e) {
      this.isAppliedMask() && this.trigger("remove:mask");
      this.trigger("viewer:close", e);
      if (this.isEmbeddedPreview) {
        return;
      }
      if (this.needMarkupCountUpdate) {
        this.updateMarkupCountForNodes();
      }
      if (this.isPreviewMode) {
        if (this.isExpanded) {
          this.trigger("overlay:panel:collapse");
          this.isExpanded = false;
          this.showExpandViewerButton();
        }
        this.clearViewer();
        return;
      }
      this._setPredicates(false);
    },
    updateMarkupCountForNodes: function() {
      var def = $.Deferred();
      if (this.nodes && this.nodes.models && this.nodes.models.length > 0) {
        var nodeIds = _.chain(this.nodes.models).pluck("attributes").pluck("id").value();
        iViewerUtils.getMarkupCounts(this.model.connector, nodeIds).done(function(data) {
          this.nodes.trigger("update:viewer:markup:count", data.markupCount);
          this.needMarkupCountUpdate = false;
          def.resolve();
        }.bind(this), function(error) {
          def.reject(error);
        });
      } else {
        def.resolve().promise();
      }
      return def.promise();
    },
    onRender: function() {
      $(this.el).find(".d2-iv-viewer-div").attr("id", this.viewerId);
      $(this.el).find(".migration-info").attr("id", this.migrationStatusId);
      this.pageUnloadBind = this._pageUnloadEvent.bind(this);
      this.container = $(this.el).find("#" + this.viewerId);
      this.container.on("markupsDirty", this._markupsDirtyEvent.bind(this));
      this.container.on("close", this._closeEvent.bind(this));
      this.container.on("pageRender", this._pageRendered.bind(this));
      this.container.on("markupFeaturesAvailable", this._markupFeaturesAvailableEvent.bind(this));
      this.container.on("exportSuccess-download", this._exportSuccessDownloadEvent.bind(this));
      this.container.on("expandViewerButtonClick", this._expandViewerButtonClickEvent.bind(this));
      this.container.on("popOutViewerButtonClick", this._popOutViewerButtonClickEvent.bind(this));
      this.container.on("popInViewerButtonClick", this._popInViewerButtonClickEvent.bind(this));
      this.container.on("collapseViewerButtonClick", this._collapseViewerButtonClickEvent.bind(this));
      this.container.on("svgPageLoadFailure", this._svgPageLoadFailureEvent.bind(this));
      $(window).on("beforeunload", this.pageUnloadBind);
    },
    _pageUnloadEvent: function() {
      if (this.isDirtyMarkup) {
        return true;
      }
    },
    onBeforeDestroy: function() {
      $(this.el).html("");
      $(window).off("bravaReady", this.bravaReadyEventCallBackBind);
      $(window).off("beforeunload", this.pageUnloadBind);
      $("body").removeClass("ot-iviewer-overflow");
      this.isAppliedMask() && this.trigger("remove:mask");
    },
    _pageRendered: function() {
      this.unblockActions();
      this.trigger("viewer:init");
      this._setPredicates(!this.isAnnotateDisabled());
    },
    _setPredicates: function(isEnabled) {
      var me = this;
      this.api.commentableMarkupPredicate = function() {
        return isEnabled;
      };
      this.api.editableMarkupPredicate = function(markup) {
        return me._canPredicate(markup, isEnabled);
      };
      this.api.deletableMarkupPredicate = function(markup) {
        return me._canPredicate(markup, isEnabled);
      };
      this.api.deletableStampPredicate = function(stamp) {
        return me._canPredicate(stamp, isEnabled);
      };
      this.api.editableStampPredicate = function(stamp) {
        return me._canPredicate(stamp, isEnabled);
      };
      this.api.addableStampPredicate = function() {
        return isEnabled;
      };
      this.api.visibleCommandPredicate = function(key) {
        if (key === "addToNewStamp") {
          return isEnabled;
        }
      };
    },
    _canPredicate: function(feature, isEnabled) {
      if (!isEnabled) {
        return false;
      }
      return feature.author === RestResources.getCurrentUser().get("name");
    },
    _markupFeaturesAvailableEvent: function() {
      if (intelligentViewerConfig && intelligentViewerConfig.imageRaster) {
        this.api.addRasters(intelligentViewerConfig.imageRaster);
      }
    },
    _svgPageLoadFailureEvent: function() {
      this.unblockActions();
      this.reloadViewer();
    },
    _exportSuccessDownloadEvent: function(e) {
      if (e) {
        var loadSourcesProp, loadSources, sourceDocName, artifact, exportType, urlTemplate, content, url, downloadFileName;
        loadSourcesProp = Object.keys(e.detail._embedded["otc:get_configs_id"].features).filter(function(property) {
          return property.startsWith("opentext.publishing.sources@LoadSources@");
        });
        loadSources = loadSourcesProp ? Object.values(e.detail._embedded["otc:get_configs_id"].features[loadSourcesProp].documents) : undefined;
        sourceDocName = loadSources ? loadSources[0].filenameHint : undefined;
        artifact = e.detail._embedded["pa:get_publication_artifacts"][0]._embedded["ac:get_artifact_content"];
        if (artifact) {
          exportType = artifact.acceptHint ? artifact.acceptHint === "application/pdf" ? "pdf" : "tiff" : "";
          urlTemplate = artifact.urlTemplate;
          content = artifact.contentLinks[0];
        }
        if (urlTemplate) {
          url = urlTemplate.replace("{id}", content.id).replace("{name}", content.name).replace("{type}", content.type).replace("{file}", content.file);
        }
        if (sourceDocName) {
          downloadFileName = sourceDocName.replace(loadSources[0].formatHint, exportType);
        }
        if (url) {
          $.ajax({
            url: url,
            type: "GET",
            dataType: "binary",
            headers: {
              authorization: this.bearerToken
            },
            success: function(response) {
              var blob = new Blob([ response ], {
                type: response.type
              }), url = window.URL.createObjectURL(blob), link = document.createElement("a");
              link.download = downloadFileName;
              link.href = url;
              link.click();
              window.URL.revokeObjectURL(url);
            },
            error: function(error) {
              console.log("Failed to download the published document", error);
            }
          });
        }
      }
    },
    _expandViewerButtonClickEvent: function(e) {
      this.trigger("overlay:panel:expand", e);
      this.showCollapseViewerButton();
      this.isExpanded = true;
    },
    _collapseViewerButtonClickEvent: function(e) {
      this.trigger("overlay:panel:collapse", e);
      this.showExpandViewerButton();
      this.isExpanded = false;
    },
    _popOutViewerButtonClickEvent: function(e) {
      this.checkDirtyMarkupAndCloseOrPopOut(e, false);
    },
    _popInViewerButtonClickEvent: function(e) {
      this.checkDirtyMarkupAndCloseOrPopOut(e, true);
    },
    checkDirtyMarkupAndCloseOrPopOut: function(e, close) {
      var me = this;
      if (this.isDirtyMarkup) {
        this.showSaveMarkupDialog().done(function() {
          me.api.save();
          $("body").find("#ot-iv-tool-properties").hide();
          close ? me._doClose(e) : me._doPopOut(e);
        }).fail(function() {
          me.api.restoreToLastSave();
          me.isDirtyMarkup = false;
          me.isAppliedMask() && me.trigger("remove:mask");
          $("body").find("#ot-iv-tool-properties").hide();
          close ? me._doClose(e) : me._doPopOut(e);
        });
      } else {
        $("body").find("#ot-iv-tool-properties").hide();
        close ? me._doClose(e) : me._doPopOut(e);
      }
    },
    _doPopOut: function(e) {
      this.trigger("viewer:expand", e);
    },
    setPublicationToViewer: function() {
      var me = this, deferred = $.Deferred();
      this.blockActions();
      this._getPublication().done(function(response) {
        me.addPublication(response);
        deferred.resolve();
      }).fail(function() {
        me.destroy();
        deferred.reject();
      }).always(function() {
        me.unblockActions();
      });
      return deferred.promise();
    },
    addPublication: function(response) {
      var publication = JSON.parse(response);
      if (publication.status === "Failed") {
        this._pageRendered();
        GlobalMessage.showMessage("error", lang.IVDocumentLoadError);
      } else {
        var documentId = this.model.get("id");
        this.documentIdAdded = documentId;
        this.api.addPublication(publication, true, documentId);
        setTimeout(function() {
          this.checkForMigration(this.model.connector, [ documentId ]);
        }.bind(this), 1e3);
      }
    },
    setViewerConfig: function() {
      this.api = window[this.currentPageConfig];
      this.api.setAutoRender(false);
      this.setLayout();
      this.api.setHttpHeaders({
        Authorization: this.bearerToken
      });
      this.api.setSearchHost(this.bravaIVConfiguration.brava_highlight_service_url);
      this.api.setMarkupHost(this.bravaIVConfiguration.brava_markup_service_url);
      this.api.setUserName(RestResources.getCurrentUser().get("name"));
      this.api.enableMarkup(true);
      this.api.setActiveTab("tab.thumbnails");
      this.api.render(this.viewerId);
    },
    setLayout: function(isAnnotationDisable) {
      var layoutClone = JSON.parse(JSON.stringify(layout));
      if (isAnnotationDisable || this.isAnnotateDisabled()) {
        var removeAnnotationFeature = layoutClone.leftTabContainer && layoutClone.leftTabContainer.tabs;
        removeAnnotationFeature = removeAnnotationFeature.filter(function(value) {
          if (_.contains([ "MarkupPane", "StampRasterPane", "TakeoffPane" ], value.component)) {
            return false;
          } else {
            return true;
          }
        });
        layoutClone.leftTabContainer.tabs = removeAnnotationFeature;
      }
      iViewerUtils.setHelpUrl(layoutClone).done(function() {
        this.api.setLayout(layoutClone);
      }.bind(this));
    },
    isAnnotateDisabled: function() {
      var disabled = false;
      if (isIVAnnotateDisabled) {
        disabled = true;
      } else if (!this.isRelatePermission) {
        disabled = true;
      }
      return disabled;
    },
    onChangeModel: function() {
      if (this.model.hasChanged("id") || this.model.hasChanged("version_number")) {
        this.render();
      }
    },
    onShow: function() {
      var me = this;
      this.blockActions();
      this.getPublicationDeferred = this._getPublication();
      iViewerUtils.getBravaIViewerConfiguration(this.model.connector).done(function(bravaIViewerConfigutation) {
        me.bravaIVConfiguration = bravaIViewerConfigutation;
        iViewerUtils.getAccessToken(me.model.connector).done(function(token) {
          me.bearerToken = "Bearer " + token;
          viewerUtils.isRelatePermission(me.model.connector, [ me.model.get("id") ]).done(function(permission) {
            me.isRelatePermission = permission;
            me._loadBravaViewerScripts();
          });
        }).fail(function() {
          GlobalMessage.showMessage("error", lang.IVDocumentLoadError);
          me.destroy();
        });
      });
    },
    reloadViewer: function() {
      var me = this;
      this.clearViewer();
      this.migrationStatusTimer && clearInterval(this.migrationStatusTimer);
      this.hideMigrationStatusBar();
      this.blockActions();
      iViewerUtils.getAccessToken(this.model.connector).done(function(token) {
        me.bearerToken = "Bearer " + token;
        me.api.setHttpHeaders({
          Authorization: me.bearerToken
        });
        if (me.documentIdAdded !== me.model.get("id")) {
          me.api.setSidebarOpen(false);
          viewerUtils.isRelatePermission(me.model.connector, [ me.model.get("id") ]).done(function(permission) {
            me.isRelatePermission = permission;
            me.setPublicationToViewer().always(function() {
              me.unblockActions();
              me.setLayout(false);
            });
          });
        } else {
          this._pageRendered();
        }
      }).fail(function() {
        GlobalMessage.showMessage("error", lang.IVDocumentLoadError);
        me.destroy();
      });
    },
    _getBravaIViewerConfiguration: function() {
      var configAPI = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_BRAVAIVIEWER_CONFIG_OPTIONS);
      return $.ajax(this.model.connector.extendAjaxOptions({
        url: configAPI,
        type: "GET"
      }));
    },
    _getBravaViewerLoaderScript: function() {
      var viewerUrl = this.bravaIVConfiguration.brava_viewer_service_url + "/viewer/api/v1/viewers/brava-view-1.x/loader";
      return $.ajax({
        url: viewerUrl,
        type: "GET",
        headers: {
          Authorization: this.bearerToken
        }
      });
    },
    _loadBravaViewerScripts: function() {
      var me = this;
      var ivScript = $(this.el).find("#IV-Script");
      if (ivScript !== undefined && ivScript.length > 0) {
        var scriptText = ivScript.html();
        ivScript.remove();
        me._appendIVScript(scriptText);
        return;
      }
      this._getBravaViewerLoaderScript().done(function(response) {
        me._appendIVScript(response);
      }).fail(function(e) {
        GlobalMessage.showMessage("error", lang.IVDocumentLoadError);
        me.destroy();
        console.error("User seems to be forbidden" + e);
      });
    },
    _getPublication: function() {
      var publicationAPIUrl = RestLinkrels.getLink(this.model.get("links"), RestLinkrels.D2_BRAVAIVIEWER_PUBLICATION);
      return $.ajax(this.model.connector.extendAjaxOptions({
        url: publicationAPIUrl,
        type: "GET"
      }));
    },
    showExpandViewerButton: function() {
      this.api.unhideToolbarButtons([ "expandViewerButtonButton" ]);
      this.api.hideToolbarButtons([ "collapseViewerButtonButton" ]);
    },
    showCollapseViewerButton: function() {
      this.api.unhideToolbarButtons([ "collapseViewerButtonButton" ]);
      this.api.hideToolbarButtons([ "expandViewerButtonButton" ]);
    },
    _appendIVScript: function(scriptText) {
      var viewerScripts = document.createElement("script");
      viewerScripts.type = "text/javascript";
      viewerScripts.innerHTML = scriptText;
      viewerScripts.id = "IV-Script";
      viewerScripts.onerror = function() {
        log.error("Error loading Viewer scripts");
      };
      $(this.el).append(viewerScripts);
    },
    _markupsDirtyEvent: function(markup) {
      if (markup.detail > 0) {
        this.isDirtyMarkup = true;
        this.needMarkupCountUpdate = true;
      } else {
        this.isDirtyMarkup = false;
      }
    },
    showSaveMarkupDialog: function() {
      var deferred = $.Deferred();
      var buttonOptions = {
        labelYes: lang.SaveMarkupDialogButtonYes,
        labelNo: lang.SaveMarkupDialogButtonNo,
        showNo: true,
        showCancel: true
      };
      ModalAlert.confirmQuestion(function(result) {
        if (result === true) {
          deferred.resolve();
        }
        if (result === false) {
          deferred.reject();
        }
      }, lang.SaveMarkupDialogBody, lang.SaveMarkupDialogHeader, {
        buttons: buttonOptions,
        modalClass: "d2-iv-sm-dialog"
      });
      return deferred.promise();
    },
    checkForMigration: function(connector, documentIds) {
      var me = this;
      if (iViewerUtils.isMigrationEnabled()) {
        iViewerUtils.getMarkupMigrationStatusByObjectIds(connector, documentIds).done(function(statusData) {
          if (me.isMigrationStatusInProgress(statusData)) {
            me.setLayout(true);
            me.needMarkupCountUpdate = true;
            me.displayMigrationStatus("INPROGRESS", connector, documentIds);
          }
        });
      }
    },
    hideMigrationStatusBar: function() {
      $(this.el).find("#" + this.migrationStatusId).addClass("binf-hidden");
      $(this.el).find("#" + this.viewerId).removeClass("with-migration-status");
    },
    showMigrationStatusBar() {
      $(this.el).find("#" + this.migrationStatusId).removeClass("binf-hidden");
      $(this.el).find("#" + this.viewerId).addClass("with-migration-status");
    },
    displayMigrationStatus: function(status, connector, documentIds) {
      var me = this, region = new Marionette.Region({
        el: this.ui.markupMigration
      });
      var view = new MarkupMigrationView({
        status: status,
        reloadClick: function() {
          me.reloadViewer();
        }
      });
      this.showMigrationStatusBar();
      region.show(view);
      if (status == iViewerUtils.migrationStatusInprogress) {
        this.startPoolingMigrationStatus(connector, documentIds);
      }
    },
    startPoolingMigrationStatus: function(connector, documentIds) {
      this.migrationStatusTimer = setInterval(function() {
        iViewerUtils.getMarkupMigrationStatusByObjectIds(connector, documentIds).done(function(statusData) {
          if (this.isMigrationStatusComplete(statusData)) {
            this.displayMigrationStatus(iViewerUtils.migrationStatusComplete, connector, documentIds);
            clearInterval(this.migrationStatusTimer);
          } else if (this.isMigrationStatusFailed(statusData)) {
            this.displayMigrationStatus(iViewerUtils.migrationStatusFailed, connector, documentIds);
            clearInterval(this.migrationStatusTimer);
          }
        }.bind(this));
      }.bind(this), 1e4);
    },
    isMigrationStatusInProgress: function(objectList) {
      var status = false;
      if (objectList && objectList.markupMigration && objectList.markupMigration.length > 0) {
        status = _.some(objectList.markupMigration, function(object) {
          return object.status === iViewerUtils.migrationStatusInprogress;
        });
      }
      return status;
    },
    isMigrationStatusComplete: function(objectList) {
      var status = false;
      if (objectList && objectList.markupMigration && objectList.markupMigration.length > 0) {
        status = _.every(objectList.markupMigration, function(object) {
          return object.status === iViewerUtils.migrationStatusComplete;
        });
      }
      return status;
    },
    isMigrationStatusFailed: function(objectList) {
      var status = false;
      if (objectList && objectList.markupMigration && objectList.markupMigration.length > 0) {
        status = _.some(objectList.markupMigration, function(object) {
          return object.status === iViewerUtils.migrationStatusFailed;
        });
      }
      return status;
    },
    isMigrationStatusTitleUpdateFailed: function(objectList) {
      var status = false;
      if (objectList && objectList.markupMigration && objectList.markupMigration.length > 0) {
        status = _.some(objectList.markupMigration, function(object) {
          return object.status === iViewerUtils.isMigrationStatusTitleUpdateFailed;
        });
      }
      return status;
    },
    clearViewer: function() {
      if (this.api.clearViewer) {
        this.api.clearViewer();
      }
    },
    closeViewer: function() {
      var dfd = $.Deferred();
      if (this.api) {
        this.destroy();
        dfd.resolve();
      } else {
        dfd.reject();
      }
      return dfd.promise();
    }
  });
});