/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/progressblocker/blocker", "d2/commands/open", "d2/commands/open.plugins/impl/csrviewer.plugin", "d2/commands/open.plugins/impl/csrviewer.view", "d2/commands/open.plugins/impl/markup.migration/view", "i18n!d2/commands/open.plugins/nls/localized.strings" ], function(_, $, BlockingView, CommandOpen, csrViewerPlugin, CSRViewer, markupMigrationView, lang) {
  "use strict";
  var CSRPreviewView = CSRViewer.extend({
    constructor: function CSRPreviewView(options) {
      options = options || {};
      options.showExpandButton = _.isBoolean(options.showExpandButton) ? options.showExpandButton : true;
      this.options = options;
      this.cmdOpen = new CommandOpen();
      CSRViewer.prototype.constructor.call(this, options);
      this.stopListening(this.model, "change");
      if (options.blockingParentView) {
        BlockingView.delegate(this, options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.listenTo(this, "update:viewer:node", this.onChangeViewerNode);
    },
    initialize: function() {
      CSRViewer.prototype.initialize.apply(this, arguments);
      this.disableAnnotationsForcefully = true;
    },
    _getDefaultViewerConfig: function() {
      var defaultViewerConfig = CSRViewer.prototype._getDefaultViewerConfig.apply(this, arguments);
      var widgetsToHide = defaultViewerConfig.hide && defaultViewerConfig.hide.widget || [];
      widgetsToHide.push("titleSpan");
      defaultViewerConfig.hide = {
        widget: widgetsToHide
      };
      _.extend(defaultViewerConfig, {
        hideStartupCloseButton: true,
        show: {
          widget: [ "fullScreenButton" ]
        }
      });
      return defaultViewerConfig;
    },
    _onBravaInstanceCreate: function() {
      CSRViewer.prototype._onBravaInstanceCreate.apply(this, arguments);
      this.bravaApi.on("DocumentVisible", function() {
        if (this.options.showExpandButton === true) {
          this._addExpandButton(this.bravaApi);
        }
      }.bind(this));
      this.bravaApi.on("NewDocumentVisible", this._onViewerInit.bind(this));
    },
    onChangeViewerNode: function(model) {
      this.model = model;
      this.reloadViewer();
    },
    reloadViewer: function() {
      var me = this;
      var modelObject = me.model;
      var documentId = modelObject.attributes.i_chronicle_id;
      var view = new markupMigrationView({
        viewerType: "CSR_VIEWER"
      });
      view.checkAndDisplayMigrationBanner(me.model.connector, [ documentId ], me.ui.markupMigration, view);
      this.blockActions();
      if (this.bravaApi) {
        this._prepareDocument().done(function() {
          this.bravaApi.loadConfiguration({
            clientType: "2D",
            viewerConfig: this._getDefaultViewerConfig()
          }).then(function() {
            me.$el.find("iframe").css("visibility", "visible");
          }, this._onViewerApiError.bind(this));
        }.bind(this)).always(function() {
          me.unblockActions();
        });
      } else {
        this.onAttach();
      }
    },
    onAttach: function() {
      this._prepareDocument().done(CSRViewer.prototype.onAttach.bind(this));
    },
    _prepareDocument: function() {
      var me = this, cmdOpen = me.cmdOpen, node = me.model, downloadLink = cmdOpen.getDownloadLink(node), dfd = $.Deferred();
      this.blockActions();
      cmdOpen.fetchDownloadUrls(node, downloadLink).always(this.unblockActions.bind(this)).done(function(downloadUrls, pageServingUrls, bravacsrSearchInfoUrl, bravacsrSearchInfoFallbackUrl, formats, pageCount) {
        node["_download_urls_"] = downloadUrls;
        node["_page_serving_urls_"] = pageServingUrls;
        node["_bravacsr_searchinfo_url_"] = bravacsrSearchInfoUrl;
        node["_bravacsr_searchInfo_fallback_url_"] = bravacsrSearchInfoFallbackUrl;
        node["_download_formats_"] = formats;
        node["_page_count_"] = pageCount;
        if (me.model.get("isPreviewProtected") === true) {
          me.destroy();
          dfd.reject();
        }
        if (csrViewerPlugin.isSupported(node)) {
          dfd.resolve();
        } else {
          me._onViewerApiError();
          dfd.reject();
        }
      }).fail(function() {
        me._onViewerApiError();
        dfd.reject();
      });
      return dfd.promise();
    },
    _onViewerInit: function() {
      this.trigger("viewer:init");
    },
    _addExpandButton: function(bravaApi) {
      var me = this;
      this._addCustomButton(bravaApi, {
        varName: "viewerExpandButton",
        tooltip: lang.ButtonExpandViewer,
        icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE2LjEyNSA0TDIwIDRMMjAgMTkuNzE0M0MyMCAxOS44NTQ4IDE5Ljk1NzcgMTkuOTUyMyAxOS45MjQ1IDIwTDQgMjBMNCAxNi4xMjVDNCAxNS41NzI3IDMuNTUyMjggMTUuMTI1IDMgMTUuMTI1QzIuNDQ3NzIgMTUuMTI1IDIgMTUuNTcyNyAyIDE2LjEyNUwyIDIwLjM1NzFDMiAyMS4wMTU4IDIuNDUyMzkgMjIgMy41IDIyTDIwIDIyQzIxLjMyMzYgMjIgMjIgMjAuNzI3OCAyMiAxOS43MTQzTDIyIDMuNjQyODZDMjIgMi45ODQxNiAyMS41NDc2IDIgMjAuNSAyTDE2LjEyNSAyQzE1LjU3MjcgMiAxNS4xMjUgMi40NDc3MiAxNS4xMjUgM0MxNS4xMjUgMy41NTIyOCAxNS41NzI3IDQgMTYuMTI1IDRaTTEyLjI5MjkgMTMuNzA3MUw0IDUuNDE0MjJMNCAxMEM0IDEwLjU1MjMgMy41NTIyOSAxMSAzIDExQzIuNDQ3NzIgMTEgMiAxMC41NTIzIDIgMTBMMiAyTDEwIDJDMTAuNTUyMyAyIDExIDIuNDQ3NzEgMTEgM0MxMSAzLjU1MjI4IDEwLjU1MjMgNCAxMCA0TDUuNDE0MjEgNEwxMy43MDcxIDEyLjI5MjlDMTQuMDk3NiAxMi42ODM0IDE0LjA5NzYgMTMuMzE2NiAxMy43MDcxIDEzLjcwNzFDMTMuMzE2NiAxNC4wOTc2IDEyLjY4MzQgMTQuMDk3NiAxMi4yOTI5IDEzLjcwNzFaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg",
        hoverIcon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE2LjEyNSA0TDIwIDRMMjAgMTkuNzE0M0MyMCAxOS44NTQ4IDE5Ljk1NzcgMTkuOTUyMyAxOS45MjQ1IDIwTDQgMjBMNCAxNi4xMjVDNCAxNS41NzI3IDMuNTUyMjggMTUuMTI1IDMgMTUuMTI1QzIuNDQ3NzIgMTUuMTI1IDIgMTUuNTcyNyAyIDE2LjEyNUwyIDIwLjM1NzFDMiAyMS4wMTU4IDIuNDUyMzkgMjIgMy41IDIyTDIwIDIyQzIxLjMyMzYgMjIgMjIgMjAuNzI3OCAyMiAxOS43MTQzTDIyIDMuNjQyODZDMjIgMi45ODQxNiAyMS41NDc2IDIgMjAuNSAyTDE2LjEyNSAyQzE1LjU3MjcgMiAxNS4xMjUgMi40NDc3MiAxNS4xMjUgM0MxNS4xMjUgMy41NTIyOCAxNS41NzI3IDQgMTYuMTI1IDRaTTEyLjI5MjkgMTMuNzA3MUw0IDUuNDE0MjJMNCAxMEM0IDEwLjU1MjMgMy41NTIyOSAxMSAzIDExQzIuNDQ3NzIgMTEgMiAxMC41NTIzIDIgMTBMMiAyTDEwIDJDMTAuNTUyMyAyIDExIDIuNDQ3NzEgMTEgM0MxMSAzLjU1MjI4IDEwLjU1MjMgNCAxMCA0TDUuNDE0MjEgNEwxMy43MDcxIDEyLjI5MjlDMTQuMDk3NiAxMi42ODM0IDE0LjA5NzYgMTMuMzE2NiAxMy43MDcxIDEzLjcwNzFDMTMuMzE2NiAxNC4wOTc2IDEyLjY4MzQgMTQuMDk3NiAxMi4yOTI5IDEzLjcwNzFaIiBmaWxsPSIjNjI3NzgzIi8+PC9zdmc+",
        activeIcon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE2LjEyNSA0TDIwIDRMMjAgMTkuNzE0M0MyMCAxOS44NTQ4IDE5Ljk1NzcgMTkuOTUyMyAxOS45MjQ1IDIwTDQgMjBMNCAxNi4xMjVDNCAxNS41NzI3IDMuNTUyMjggMTUuMTI1IDMgMTUuMTI1QzIuNDQ3NzIgMTUuMTI1IDIgMTUuNTcyNyAyIDE2LjEyNUwyIDIwLjM1NzFDMiAyMS4wMTU4IDIuNDUyMzkgMjIgMy41IDIyTDIwIDIyQzIxLjMyMzYgMjIgMjIgMjAuNzI3OCAyMiAxOS43MTQzTDIyIDMuNjQyODZDMjIgMi45ODQxNiAyMS41NDc2IDIgMjAuNSAyTDE2LjEyNSAyQzE1LjU3MjcgMiAxNS4xMjUgMi40NDc3MiAxNS4xMjUgM0MxNS4xMjUgMy41NTIyOCAxNS41NzI3IDQgMTYuMTI1IDRaTTEyLjI5MjkgMTMuNzA3MUw0IDUuNDE0MjJMNCAxMEM0IDEwLjU1MjMgMy41NTIyOSAxMSAzIDExQzIuNDQ3NzIgMTEgMiAxMC41NTIzIDIgMTBMMiAyTDEwIDJDMTAuNTUyMyAyIDExIDIuNDQ3NzEgMTEgM0MxMSAzLjU1MjI4IDEwLjU1MjMgNCAxMCA0TDUuNDE0MjEgNEwxMy43MDcxIDEyLjI5MjlDMTQuMDk3NiAxMi42ODM0IDE0LjA5NzYgMTMuMzE2NiAxMy43MDcxIDEzLjcwNzFDMTMuMzE2NiAxNC4wOTc2IDEyLjY4MzQgMTQuMDk3NiAxMi4yOTI5IDEzLjcwNzFaIiBmaWxsPSIjNjI3NzgzIi8+PC9zdmc+",
        placement: {
          toolbarRegion: "Start",
          buttonPosition: "First"
        },
        pinWidget: true,
        applyRTLStyleForIcon: true,
        handler: function customClick(e) {
          e = e ? $.Event(event) : e;
          me.exitFullScreen();
          me.trigger("viewer:expand", e);
        }
      });
    }
  });
  return CSRPreviewView;
});