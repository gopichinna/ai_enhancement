/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/utils/accessibility", "csui/utils/contexts/factories/node", "dctmw/utils/rest.resources", "nuc/utils/url", "d2/controls/behaviors/viewer.masking.behavior", "csui/dialogs/modal.alert/modal.alert", "d2/commands/open.plugins/impl/markup.migration/view", "d2/commands/open.plugins/impl/publish/publish.fields.constant", "i18n", "d2/commands/open.plugins/impl/bravaenterprise/viewer.utils", "d2/utils/format.utils", "i18n!d2/commands/open.plugins/nls/localized.strings", "d2/commands/open.plugins/impl/publish/publish.dialog", "d2/commands/open.plugins/impl/iviewer/utils", "d2/commands/download", "d2/utils/rest.linkrels", "css!d2/commands/open.plugins/impl/bravaenterpriseviewer" ], function(module, require, _, $, Marionette, Accessibility, NodeModelFactory, RestResources, Url, ViewerMaskingBehavior, ModalAlert, markupMigrationView, PublishFieldsConstant, i18n, ViewerUtils, FormatUtils, lang, PublishDialog, iViewerUtils, DownloadCommand, RestLinkrels) {
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
      this._connector = this.model.connector;
      this.isPreviewMode = options.isPreviewMode;
      this.isEmbeddedPreview = options.isEmbeddedPreview ? options.isEmbeddedPreview : false;
      this.isExpanded = false;
      this.expandButtonTooltip = lang.ButtonExpandViewer;
      this.collapseButtonTooltip = lang.ButtonCollapseViewer;
      this.isAccessibleMode = Accessibility.isAccessibleMode() ? true : false;
      this.closeButton = this.isAccessibleMode ? ViewerUtils.closeButtonAlly : ViewerUtils.closeButton;
      this.expandIcon = this.isAccessibleMode ? ViewerUtils.expandIconAlly : ViewerUtils.expandIcon;
      this.collapseIcon = this.isAccessibleMode ? ViewerUtils.collapseIconAlly : ViewerUtils.collapseIcon;
      this.popInButton = this.isAccessibleMode ? ViewerUtils.popInButtonAlly : ViewerUtils.popInButton;
      this.popOutButton = this.isAccessibleMode ? ViewerUtils.popOutButtonAlly : ViewerUtils.popOutButton;
      this.contentView = this.options["contentView"];
      if (!this._connector) {
        throw "Models must be created with a context in order to obtain a valid connection.";
      }
      this.listenTo(this.model, "sync", this.fetchAndLoadViewer);
      this.listenTo(this, "panel:expand", function() {
        this.isExpanded = true;
        this.expandMode();
      });
      this.listenTo(this, "panel:collapse", function() {
        this.isExpanded = false;
        this.expandMode();
      });
      this.isDirtyMarkup = false;
      this.listenTo(options.context, "sync change:perspective", function() {
        if (!this.isPreviewMode && !this.isEmbeddedPreview) {
          this.isAppliedMask() && this.trigger("remove:mask");
          this.closeViewer();
        }
      }.bind(this));
      this.exportCompleteCallBackBind = this.exportCompleteCallBack.bind(this);
      $(window).off("exportComplete", this.exportCompleteCallBackBind).on("exportComplete", this.exportCompleteCallBackBind);
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
      var me = this;
      if (this.isEmbeddedPreview) {
        DownloadCommand.prototype.fetchDownloadUrls.call(this, this.model, this.getDownloadLink(this.model)).done(function() {
          if (me.model.get("isPreviewProtected") === true) {
            me.destroy();
          } else {
            me.fetchAndLoadViewer();
          }
        }).fail(function() {
          me.destroy();
        });
      } else {
        me.fetchAndLoadViewer();
      }
    },
    fetchAndLoadViewer: function() {
      if (this.isPreviewMode ? !this.model.fetched || this.model.fetching : !this.model.get("id")) {
        return;
      }
      var me = this, currentRepo = RestResources.getCurrentRepository().get("name"), currentUser = RestResources.getCurrentUser().get("name"), documentId = me.model.get("id"), tzoffset = FormatUtils.getTimezoneOffset(), el = me.el, elId = el.getAttribute("id"), href = Url.combine(me._connector.connection.url, "repositories", currentRepo, "bravaenterprise", "getClientLoadData"), qParams = {
        repo: currentRepo,
        log: currentUser,
        docid: documentId,
        tzoffset: tzoffset
      };
      if (this.isPreviewMode || this.contentView) {
        qParams["mode"] = "preview";
      }
      if (this.options.isAnnotationDisable) {
        qParams["disable-annotation"] = "true";
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
          me._loadViewer(data);
        },
        error: function(error) {
          me.destroy();
          if (error.message) {
            require([ "d2/controls/globalmessage/globalmessage" ], function(GlobalMessage) {
              GlobalMessage.showMessage("error", error.message, undefined, {});
            });
          }
        }
      }));
    },
    _loadViewer: function(data) {
      var me = this, oldClientType = me.clientType;
      me.clientType = data.clientType;
      me.checkForMigration(me.model);
      if (me.clientType !== "2D") {
        data.htmlViewerConfigUrl = data.htmlViewerConfigUrl.replace(/(\&)?mode=preview/gi, "");
      }
      if (this.isAccessibleMode) {
        data.htmlViewerConfigUrl = data.htmlViewerConfigUrl + "&accessible=true";
      }
      if (me.viewer) {
        if (me.clientType === oldClientType) {
          me.viewer.loadConfiguration({
            clientType: data.clientType,
            signedConfigUrl: data.htmlViewerConfigUrl
          }).then(function() {
            if (me.clientType === "3D") {
              setTimeout(function() {
                me._onViewerInit();
              }, 1e3);
            }
          });
          return;
        } else {
          me.ignoreNextClientClosedEvent = true;
          me.closeViewer().always(me._loadViewer.bind(me, data));
        }
      }
      require([ "igc/HTML/html-clients" ], function loadScripts() {
        require([ "igc/HTML/" + data.htmlClientFactory ], function createContent() {
          var viewer = window.brava.htmlClients.create(data.htmlClientFactory, {
            path: moduleConfig.basePath + "/igc/HTML",
            container: me.el.getAttribute("id"),
            locale: i18n.settings.locale === "iw" ? "he" : i18n.settings.locale,
            clientType: data.clientType,
            logLevel: "all",
            isCrossOrigin: data.isCrossOrigin,
            corsServersEntries: data.corsServersEntries,
            height: "100%",
            width: "100%",
            nodeType: "iframe",
            signedConfigUrl: data.htmlViewerConfigUrl,
            xmlPostType: "text/xml",
            requestHeaders: me._getSharedHeaderParams(),
            onDocumentExport: "fire-event"
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
              if (me.clientType === "2D") {
                if (me.isPreviewMode === true) {
                  me._addCustomCloseButton(api);
                  if (me.isEmbeddedPreview) {
                    me._addCustomPopOutButton(api);
                  } else {
                    me._addCustomExpandCollapseButton(api);
                  }
                } else {
                  me.options.showCollapseButton && me._addCustomPopInButton(api);
                }
              }
            });
            api.on("NewDocumentVisible", function() {
              me._onViewerInit();
            });
            api.on("MarkupDirty", function() {
              if (me.isPreviewMode) {
                !me.isAppliedMask() && me.trigger("apply:mask");
              }
              me.isDirtyMarkup = true;
            });
            api.on("MarkupSaved", function() {
              me.isAppliedMask() && me.trigger("remove:mask");
              me.isDirtyMarkup = false;
            });
            api.on("MarkupEditClosed", function() {
              me.isAppliedMask() && me.trigger("remove:mask");
              me.isDirtyMarkup = false;
            });
            if (me.clientType === "3D") {
              setTimeout(function() {
                me._onViewerInit();
              }, 1e3);
            }
          });
        }, function() {
          me._onViewerApiError("HTML Client Factory load error");
        });
      }, function() {
        me._onViewerApiError("HTML Client file load failed");
      });
    },
    checkForMigration: function(node) {
      var me = this;
      iViewerUtils.getMarkupMigrationStatusByObjectIds(node.connector, [ node.get("id") ]).done(function(statusData) {
        if (statusData && statusData.markupMigration && statusData.markupMigration.length > 0) {
          me.displayMigrationBannerInfo("BRAVA_VIEWER");
        } else {
          me.hideMigrationStatusBar();
        }
      });
    },
    hideMigrationStatusBar: function() {
      $(this.el).find(this.ui.markupMigration).addClass("binf-hidden");
      $(this.el).find(this.ui.markupMigration).removeClass("with-migration-status");
    },
    displayMigrationBannerInfo: function(viewerType) {
      var region = new Marionette.Region({
        el: this.ui.markupMigration
      });
      var view = new markupMigrationView({
        viewerType: viewerType
      });
      this.showMigrationStatusBar();
      region.show(view);
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
        icon: me.closeButton,
        placement: {
          toolbarRegion: "End",
          buttonPosition: "Last"
        },
        pinWidget: true,
        cssStyle: me.isAccessibleMode ? "" : "background-color: transparent;",
        handler: function customClick(e) {
          e = e ? $.Event(event) : e;
          me.checkDirtyMarkupAndCloseOrPopOut(e, true);
        }
      });
    },
    _addCustomPopOutButton: function(bravaApi) {
      var me = this;
      this._addCustomButton(bravaApi, {
        varName: "customPopOutButton",
        tooltip: lang.ButtonExpandViewer,
        icon: me.popOutButton,
        placement: {
          toolbarRegion: "Start",
          buttonPosition: "First"
        },
        pinWidget: true,
        cssStyle: me.isAccessibleMode ? "" : "background-color: transparent;",
        handler: function customClick(e) {
          e = e ? $.Event(event) : e;
          me.checkDirtyMarkupAndCloseOrPopOut(e, false);
        }
      });
    },
    saveMarkupConfirmDialog: function() {
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
        modalClass: "d2-be-sm-dialog"
      });
      return deferred.promise();
    },
    _addCustomPopInButton: function(bravaApi) {
      var me = this;
      this._addCustomButton(bravaApi, {
        varName: "customPopInButton",
        tooltip: lang.ButtonCollapseViewer,
        icon: me.popInButton,
        placement: {
          toolbarRegion: "Start",
          buttonPosition: "First"
        },
        pinWidget: true,
        cssStyle: me.isAccessibleMode ? "" : "background-color: transparent;",
        handler: function customClick() {
          me.checkDirtyMarkupAndCloseOrPopOut(undefined, true);
        }
      });
    },
    checkDirtyMarkupAndCloseOrPopOut: function(e, close) {
      var me = this;
      if (this.isDirtyMarkup) {
        this.saveMarkupConfirmDialog().done(function() {
          me.viewer.saveMarkupFile({}).then(function(result) {
            if (result) {
              close ? me.doClose(e) : me.doPopOut(e);
            }
          });
        }).fail(function() {
          me.viewer.closeMarkupFile({
            forceClose: true
          }).then(function() {
            close ? me.doClose(e) : me.doPopOut(e);
          });
        });
      } else {
        close ? me.doClose(e) : me.doPopOut(e);
      }
    },
    doClose: function(e) {
      this.trigger("viewer:close", e);
      if (this.isExpanded) {
        this.trigger("overlay:panel:collapse");
        this.isExpanded = false;
        this.expandMode();
      }
      if (!e || !e.isDefaultPrevented()) {
        this.closeViewer();
      }
    },
    doPopOut: function(e) {
      this.trigger("viewer:expand", e);
    },
    _addCustomExpandCollapseButton: function(bravaApi) {
      var me = this;
      this._addCustomButton(bravaApi, {
        varName: "customExpandCollapseButton",
        tooltip: me.expandButtonTooltip,
        icon: me.expandIcon,
        placement: {
          toolbarRegion: "Start",
          buttonPosition: "First"
        },
        pinWidget: true,
        cssStyle: "margin-left: -15px;" + (!me.isAccessibleMode ? "background-color: #3F4950;" : ""),
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
      this.trigger("viewer:error", error);
    },
    expandMode: function() {
      var me = this, img;
      this.viewer["customExpandCollapseButton"].then(function(buttonData) {
        var btnEl = $("#" + me.el.getAttribute("id") + " iframe").contents().find(".dijitButton[widgetId=" + buttonData.id + "]");
        var btnInnerEl = $("#" + me.el.getAttribute("id") + " iframe").contents().find("#" + buttonData.id);
        if (me.isExpanded) {
          if (me.isAccessibleMode) {
            img = $(btnInnerEl).find("img");
            $(img).prop("src", me.collapseIcon);
          } else {
            btnEl.css({
              backgroundImage: 'url("' + me.collapseIcon + '")'
            });
          }
          btnInnerEl.prop("title", me.collapseButtonTooltip);
        } else {
          if (me.isAccessibleMode) {
            img = $(btnInnerEl).find("img");
            $(img).prop("src", me.expandIcon);
          } else {
            btnEl.css({
              backgroundImage: 'url("' + me.expandIcon + '")'
            });
          }
          btnInnerEl.prop("title", me.expandButtonTooltip);
        }
      });
    },
    exportCompleteCallBack: function(e) {
      this.showPublishDialog(e);
    },
    showPublishDialog: function(e) {
      var dialog = new PublishDialog({
        publishUrl: e.detail.url,
        type: e.detail.type,
        node: this.model,
        context: this.options.context,
        addExtraOptions: [ PublishFieldsConstant.publishOptions.CURRENT_LOCATION, PublishFieldsConstant.publishOptions.VERSION, PublishFieldsConstant.publishOptions.RENDITION ],
        defaultFileName: this.model.get("name")
      });
      dialog.show();
    },
    onDestroy: function() {
      $(window).off("exportComplete", this.exportCompleteCallBackBind);
    },
    _onViewerInit: function() {
      this.trigger("viewer:init");
    },
    reloadViewer: function() {
      this.fetchAndLoadViewer();
    },
    onBeforeDestroy: function() {
      this.viewer && this.viewer.closeViewer({
        allowCancel: false
      });
    },
    getDownloadLink: function(node) {
      var url = RestLinkrels.getLink(node.get("links"), RestLinkrels.PREVIEW_URLS);
      var qParams = {
        format: node.get("aContentType") || node.get("a_content_type")
      };
      url = Url.appendQuery(url, Url.combineQueryString(qParams));
      return url;
    },
    closeViewer: function() {
      var dfd = $.Deferred();
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