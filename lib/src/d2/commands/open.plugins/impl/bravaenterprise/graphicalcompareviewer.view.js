/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/utils/contexts/factories/node", "dctmw/utils/rest.resources", "nuc/utils/url", "d2/controls/behaviors/viewer.masking.behavior", "csui/dialogs/modal.alert/modal.alert", "d2/commands/open.plugins/impl/markup.migration/view", "d2/controls/globalmessage/globalmessage", "d2/utils/format.utils", "i18n", "i18n!d2/commands/open.plugins/nls/localized.strings", "css!d2/commands/open.plugins/impl/bravaenterprise/graphicalcompare" ], function(module, require, _, $, Marionette, NodeModelFactory, RestResources, Url, ViewerMaskingBehavior, ModalAlert, markupMigrationView, GlobalMessage, FormatUtils, i18n, lang) {
  "use strict";
  var moduleConfig = _.defaults(module.config(), {
    basePath: window.sv.config.releaseLocation + window.sv.config.otherBundlesLocation
  });
  var BravaEnterpriseView = Marionette.ItemView.extend({
    className: "d2-bravaenterpriseviewer",
    template: _.template('<div id="migrationInfo" class="migration-info binf-hidden"></div>'),
    behaviors: {
      MaskingBehavior: {
        behaviorClass: ViewerMaskingBehavior
      }
    },
    constructor: function BravaEnterpriseView(options) {
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
      this.clientLoadData = null;
      this._connector = this.model.connector;
      this.nodes = options.previewNodes;
      this.isPreviewMode = options.isPreviewMode;
      this.isEmbeddedPreview = options.isEmbeddedPreview ? options.isEmbeddedPreview : false;
      this.isExpanded = false;
      this.expandButtonTooltip = lang.ButtonExpandViewer;
      this.collapseButtonTooltip = lang.ButtonCollapseViewer;
      this.expandIcon = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwKSI+CjxwYXRoIGQ9Ik0xMCAzTDUgOEwxMCAxMyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9nPgo8ZGVmcz4KPGNsaXBQYXRoIGlkPSJjbGlwMCI+CjxyZWN0IHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0id2hpdGUiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4K";
      this.collapseIcon = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwKSI+CjxwYXRoIGQ9Ik02IDEzTDExIDhMNiAzIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJ3aGl0ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYgMTYpIHJvdGF0ZSgtMTgwKSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=";
      if (!this._connector) {
        throw "Models must be created with a context in order to obtain a valid connection.";
      }
      this.listenTo(this, "panel:expand", function() {
        this.isExpanded = true;
        this.expandMode();
      });
      this.listenTo(this, "panel:collapse", function() {
        this.isExpanded = false;
        this.expandMode();
      });
      this.dirtyMarkupCount = 0;
      if (this.isPreviewMode) {
        !this.isAppliedMask() && this.trigger("apply:mask");
      }
    },
    ui: {
      markupMigration: "#migrationInfo"
    },
    onChangeModel: function() {
      if (this.model.hasChanged("id") || this.model.hasChanged("version_number")) {
        this.render();
      }
    },
    onShow: function() {
      this.fetchAndLoadViewer();
    },
    fetchAndLoadViewer: function() {
      if (this.nodes.length < 2) {
        return;
      }
      if (this.clientLoadData) {
        this._loadViewer();
        return;
      }
      var me = this, currentRepo = RestResources.getCurrentRepository().get("name"), currentUser = RestResources.getCurrentUser().get("name"), documentId = this.nodes.at(0).get("id"), tzoffset = FormatUtils.getTimezoneOffset(), el = me.el, elId = el.getAttribute("id"), href = Url.combine(me._connector.connection.url, "repositories", currentRepo, "bravaenterprise", "getClientLoadData"), qParams = {
        repo: currentRepo,
        log: currentUser,
        docid: documentId,
        tzoffset: tzoffset
      };
      if (this.isPreviewMode) {
        qParams["mode"] = "preview";
      }
      href = Url.appendQuery(href, Url.combineQueryString(qParams));
      if (!elId) {
        elId = "d2-bravaenterpriseviewer" + new Date().getTime();
        el.setAttribute("id", elId);
      }
      $.ajax(me._connector.extendAjaxOptions({
        url: href,
        type: "GET",
        success: function(data) {
          data = JSON.parse(data);
          me.clientLoadData = data;
          me._loadViewer();
        },
        error: function(error) {
          me.destroy();
          if (error.message) {
            GlobalMessage.showMessage("error", error.message, undefined, {});
          }
        }
      }));
    },
    _loadViewer: function() {
      var me = this, htmlViewerConfigUrl = this._getHtmlViewerConfigUrl();
      var documentIds = [ me.nodes.at(0).get("id"), me.nodes.at(1).get("id") ];
      var view = new markupMigrationView({
        viewerType: "GRAPHICAL_COMPARE"
      });
      view.checkAndDisplayMigrationBanner(me.model.connector, documentIds, me.ui.markupMigration, view);
      if (me.viewer) {
        me.ignoreNextClientClosedEvent = true;
        me.closeViewer().always(me._loadViewer.bind(me));
      }
      require([ "igc/HTML/html-clients" ], function loadScripts() {
        require([ "igc/HTML/" + me.clientLoadData.htmlClientFactory ], function createContent() {
          var viewer = window.brava.htmlClients.create(me.clientLoadData.htmlClientFactory, {
            path: moduleConfig.basePath + "/igc/HTML",
            container: me.el.getAttribute("id"),
            locale: i18n.settings.locale === "iw" ? "he" : i18n.settings.locale,
            clientType: "compare",
            logLevel: "all",
            isCrossOrigin: me.clientLoadData.isCrossOrigin,
            corsServersEntries: me.clientLoadData.corsServersEntries,
            height: "100%",
            width: "100%",
            nodeType: "iframe",
            signedConfigUrl: htmlViewerConfigUrl,
            xmlPostType: "text/xml",
            requestHeaders: me._getSharedHeaderParams(),
            useCompatibilityPrint: true
          });
          viewer.then(function(api) {
            me.viewer = api;
            api.on("ClientClosed", function() {
              if (me.ignoreNextClientClosedEvent === true) {
                me.ignoreNextClientClosedEvent = false;
              } else {
                me.trigger("viewer:close");
                me.destroy();
              }
            });
            api.on("ClientClosedOnStartup", function() {
              me.destroy();
            });
            api.on("DocumentVisible", function() {
              if (me.isPreviewMode === true) {
                me._addCustomCloseButton(api);
                me._addCustomExpandCollapseButton(api);
              }
            });
            api.on("NewDocumentVisible", function() {
              me._onViewerInit();
            });
            api.on("MarkupDirty", function(e) {
              if (e.content && !e.content.fromErrorOrCancel) {
                me.dirtyMarkupCount++;
              }
            });
            api.on("MarkupSaved", function() {
              me.dirtyMarkupCount--;
            });
            api.on("MarkupEditClosed", function() {
              me.dirtyMarkupCount > 0 && me.dirtyMarkupCount--;
            });
            api.on("LoadingError", function() {
              me.isAppliedMask() && me.trigger("remove:mask");
              $("#" + me.el.getAttribute("id") + " iframe").contents().find("#closeOnStartupButton").css({
                display: "block"
              });
            });
          });
        }, function() {
          me._onViewerApiError("HTML Client Factory load error");
        });
      }, function() {
        me._onViewerApiError("HTML Client file load failed");
      });
    },
    _getHtmlViewerConfigUrl: function() {
      var tzoffset = FormatUtils.getTimezoneOffset(), currentRepo = RestResources.getCurrentRepository().get("name"), currentUser = RestResources.getCurrentUser().get("name"), href = Url.combine(this._connector.connection.url, "repositories", currentRepo, "bravaenterprise", "compare", "graphical"), docId = this.nodes.at(0).get("id"), compareDocId = this.nodes.at(1).get("id"), qParams = {
        repo: currentRepo,
        docId: docId,
        compareDocId: compareDocId,
        log: currentUser,
        tzoffset: tzoffset
      };
      href = Url.appendQuery(href, Url.combineQueryString(qParams));
      return href;
    },
    showMigrationStatusBar() {
      $(this.el).find(this.ui.markupMigration).removeClass("binf-hidden");
      $(this.el).find(this.ui.markupMigration).addClass("with-migration-status");
    },
    _getSharedHeaderParams: function() {
      var headers = {};
      this.model.connector.authenticator.setAuthenticationHeaders(headers);
      headers["Accept-Language"] = i18n.settings.locale === "iw" ? "he" : i18n.settings.locale;
      return headers;
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
        cssStyle: "background-color: transparent;",
        handler: function customClick(e) {
          e = e ? $.Event(event) : e;
          me.checkDirtyMarkupAndClose(e);
        }
      });
    },
    saveMarkupConfirmDialog: function() {
      var deferred = $.Deferred();
      var buttonOptions = {
        labelYes: lang.CompareSaveMarkupDialogButtonYes,
        showNo: false,
        showCancel: true
      };
      ModalAlert.confirmQuestion(function(result) {
        if (result === true) {
          deferred.resolve();
        }
        if (result === false) {
          deferred.reject();
        }
      }, lang.CompareSaveMarkupDialogBody, lang.SaveMarkupDialogHeader, {
        buttons: buttonOptions,
        modalClass: "d2-be-sm-dialog"
      });
      return deferred.promise();
    },
    checkDirtyMarkupAndClose: function(e) {
      var me = this;
      if (me.dirtyMarkupCount) {
        this.saveMarkupConfirmDialog().done(function() {
          me.viewer.closeMarkupFile({
            forceClose: true
          }).then(function() {
            me.viewer.closeMarkupFile1({
              forceClose: true
            }).then(function() {
              me.isAppliedMask() && me.trigger("remove:mask");
              me.dirtyMarkupCount = 0;
              me.doClose(e);
            });
          });
        });
      } else {
        me.doClose(e);
      }
    },
    doClose: function(e) {
      var me = this;
      if (this.isExpanded) {
        this.trigger("overlay:panel:collapse");
        this.isExpanded = false;
        this.expandMode();
      }
      this.closeViewer().done(function() {
        me.viewer = null;
        me.trigger("viewer:close", e);
        me.isAppliedMask() && me.trigger("remove:mask");
      }).fail(function() {
        me.trigger("viewer:close", e);
      });
    },
    _addCustomExpandCollapseButton: function(bravaApi) {
      var me = this;
      this._addCustomButton(bravaApi, {
        varName: "customExpandCollapseButton",
        tooltip: me.expandButtonTooltip,
        icon: me.isExpanded ? me.collapseIcon : me.expandIcon,
        placement: {
          toolbarRegion: "Start",
          buttonPosition: "First"
        },
        pinWidget: true,
        cssStyle: "margin-left: -15px;background-color: #3F4950;",
        handler: function customClick(e) {
          e = e ? $.Event(event) : e;
          if (!me.isExpanded) {
            me.trigger("overlay:panel:expand", e);
            me.isExpanded = true;
            me.expandMode();
          } else {
            me.trigger("overlay:panel:collapse");
            me.isExpanded = false;
            me.expandMode();
          }
        }
      });
    },
    _addCustomButton: function(bravaApi, options) {
      if (bravaApi[options.varName] === undefined) {
        var optionsCssStyle = options.cssStyle ? options.cssStyle : "";
        bravaApi[options.varName] = bravaApi.addCustomButton({
          type: "Button",
          showLabel: false,
          toolTip: options.tooltip,
          icon: options.icon,
          cssStyleAdjustments: optionsCssStyle + "background-position:center; background-size:24px 24px " + (options.applyRTLStyleForIcon === true && i18n.settings.rtl ? "; transform: scaleX(-1)" : ""),
          container: {
            name: "TaskBar",
            placement: options.placement ? options.placement : {
              toolbarRegion: "Start",
              index: options.position
            }
          },
          pinWidget: options.pinWidget === true,
          eventHandlers: {
            click: options.handler
          }
        });
      }
    },
    _onViewerApiError: function(error) {
      this.isAppliedMask() && this.trigger("remove:mask");
      this.trigger("viewer:error", error);
    },
    expandMode: function() {
      var me = this;
      this.viewer["customExpandCollapseButton"].then(function(buttonData) {
        var btnEl = $("#" + me.el.getAttribute("id") + " iframe").contents().find(".dijitButton[widgetId=" + buttonData.id + "]");
        var btnInnerEl = $("#" + me.el.getAttribute("id") + " iframe").contents().find("#" + buttonData.id);
        if (me.isExpanded) {
          btnEl.css({
            backgroundImage: 'url("' + me.collapseIcon + '")'
          });
          btnInnerEl.prop("title", me.collapseButtonTooltip);
        } else {
          btnEl.css({
            backgroundImage: 'url("' + me.expandIcon + '")'
          });
          btnInnerEl.prop("title", me.expandButtonTooltip);
        }
      });
    },
    _onViewerInit: function() {
      this.trigger("viewer:init");
    },
    reloadViewer: function() {
      this.fetchAndLoadViewer();
    },
    onDestroy: function() {
      this.isAppliedMask() && this.trigger("remove:mask");
    },
    closeViewer: function() {
      var dfd = $.Deferred();
      this.isAppliedMask() && this.trigger("remove:mask");
      if (this.viewer) {
        this.viewer.closeViewer({
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
      return dfd.promise();
    }
  });
  return BravaEnterpriseView;
});