/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/utils/contexts/factories/node", "dctmw/utils/rest.resources", "nuc/utils/url", "d2/controls/behaviors/viewer.masking.behavior", "csui/controls/progressblocker/blocker", "i18n!d2/commands/open.plugins/nls/localized.strings", "css!d2/commands/open.plugins/impl/bravaenterprise/textcompare" ], function(module, require, _, $, Marionette, NodeModelFactory, RestResources, Url, ViewerMaskingBehavior, BlockingView, lang) {
  "use strict";
  var moduleConfig = _.defaults(module.config(), {
    basePath: window.sv.config.releaseLocation + window.sv.config.otherBundlesLocation
  });
  var BravaEnterpriseTextCompareView = Marionette.ItemView.extend({
    className: "d2-bravaenterprise-textcompare-viewer",
    template: _.template('<div id="bravaTextCompareRoot"></div>'),
    behaviors: {
      MaskingBehavior: {
        behaviorClass: ViewerMaskingBehavior
      }
    },
    constructor: function BravaEnterpriseTextCompareView(options) {
      options.data || (options.data = {});
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
      this.nodes = options.previewNodes;
      this.isPreviewMode = options.isPreviewMode;
      this.isEmbeddedPreview = options.isEmbeddedPreview ? options.isEmbeddedPreview : false;
      this.isExpandCollapseButtonAdded = false;
      this.expandCollapseButton = $('<button class="custom-button">');
      this.viewer = null;
      this.isExpanded = false;
      if (!this._connector) {
        throw "Models must be created with a context in order to obtain a valid connection.";
      }
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.listenTo(this, "panel:expand", function() {
        this.isExpanded = true;
        this.expandMode();
      });
      this.listenTo(this, "panel:collapse", function() {
        this.isExpanded = false;
        this.expandMode();
      });
      this.bravaTextCompareReadyEventCallBackBind = this.bravaTextCompareReadyEventCallBack.bind(this);
      $(window).off("bravaTextCompareReady", this.bravaTextCompareReadyEventCallBackBind).on("bravaTextCompareReady", this.bravaTextCompareReadyEventCallBackBind);
      $(window).on("bravaTextCompareClose", function() {
        if (this.isExpanded) {
          this.trigger("overlay:panel:collapse");
          this.isExpanded = false;
          this.expandMode();
        }
        this.trigger("viewer:close");
        $(window).off("bravaTextCompareReady", this.bravaTextCompareReadyEventCallBackBind);
        this.destroy();
      }.bind(this));
      if (this.isPreviewMode) {
        !this.isAppliedMask() && this.trigger("apply:mask");
      }
    },
    bravaTextCompareReadyEventCallBack: function(e) {
      this.apiName = e.detail;
      this.viewer = window[this.apiName];
      this.fetchAndSetComposition();
    },
    fetchAndSetComposition: function() {
      var me = this;
      var docId = this.nodes.at(0).get("id");
      var compareDocId = this.nodes.at(1).get("id");
      this.blockActions();
      this.getComposition(docId, compareDocId).done(function(response) {
        var responseJson = JSON.parse(response);
        var leftDocument = responseJson.textcomparecomposition[0];
        var rightDocument = responseJson.textcomparecomposition[1];
        var bravaServerUrl = responseJson.bravaserverurl;
        me.setDocumentCompositionIds(bravaServerUrl, leftDocument, rightDocument);
        me._onViewerInit();
        me._addExpandCollapseButton();
        me.unblockActions();
      }).fail(function() {
        me._onViewerApiError("Failed to load viewer");
      });
    },
    _addExpandCollapseButton: function() {
      if (this.isExpandCollapseButtonAdded) {
        return;
      }
      var me = this;
      $(this.expandCollapseButton).on("click", function() {
        if (me.isExpanded) {
          me.isExpanded = false;
          me.trigger("overlay:panel:collapse");
          me.expandMode();
        } else {
          me.isExpanded = true;
          me.trigger("overlay:panel:expand");
          me.expandMode();
        }
      });
      $(this.el).find(".ot-ViewerToolbar-left").prepend(this.expandCollapseButton);
      this.expandMode();
      this.isExpandCollapseButtonAdded = true;
    },
    expandMode: function() {
      if (this.isExpanded) {
        $(this.expandCollapseButton).removeClass("expand-viewer-button").addClass("collapse-viewer-button");
        $(this.expandCollapseButton).attr("title", lang.ButtonCollapseViewer);
      } else {
        $(this.expandCollapseButton).removeClass("collapse-viewer-button").addClass("expand-viewer-button");
        $(this.expandCollapseButton).attr("title", lang.ButtonExpandViewer);
      }
    },
    getComposition: function(docId, compareDocId) {
      var me = this, currentRepo = RestResources.getCurrentRepository().get("name"), href = Url.combine(me._connector.connection.url, "repositories", currentRepo, "bravaenterprise", "compare", "text"), qParams = {
        docId: docId,
        compareDocId: compareDocId
      };
      href = Url.appendQuery(href, Url.combineQueryString(qParams));
      return $.ajax(me._connector.extendAjaxOptions({
        url: href,
        type: "GET"
      }));
    },
    setDocumentCompositionIds: function(bravaServerURL, leftDocument, rightDocument) {
      this.viewer.setDocumentCid(bravaServerURL, leftDocument["documentUrl"], leftDocument["compositionid"], leftDocument["filename"], leftDocument["position"]);
      this.viewer.setDocumentCid(bravaServerURL, rightDocument["documentUrl"], rightDocument["compositionid"], rightDocument["filename"], rightDocument["position"]);
    },
    onShow: function() {
      this._loadViewer();
    },
    _loadViewer: function() {
      var me = this;
      require([ "css!igc/html-text-compare/main" ], function loadScripts() {
        var viewerScript = moduleConfig.basePath + "/igc/html-text-compare/main.js", scriptElement = document.createElement("script");
        scriptElement.type = "text/javascript";
        scriptElement.src = viewerScript;
        scriptElement.id = "Brava-Text-Compare-Script";
        $(me.el).append(scriptElement);
      }, function() {
        this._onViewerApiError("HTML Client file load failed");
      });
    },
    _onViewerApiError: function(error) {
      this.trigger("viewer:error", error);
    },
    _onViewerInit: function() {
      this.trigger("viewer:init");
    },
    reloadViewer: function() {
      this.fetchAndSetComposition();
    },
    onDestroy: function() {
      $(window).off("bravaTextCompareReady", this.bravaTextCompareReadyEventCallBackBind);
      this.isAppliedMask() && this.trigger("remove:mask");
    },
    closeViewer: function() {
      var dfd = $.Deferred();
      this.isAppliedMask() && this.trigger("remove:mask");
      if (this.viewer) {
        this.destroy();
        dfd.resolve();
      } else {
        dfd.reject();
      }
      return dfd.promise();
    }
  });
  return BravaEnterpriseTextCompareView;
});