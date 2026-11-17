/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/pages/start/perspective.router", "nuc/models/node/node.model", "i18n!csui/pages/start/nls/lang", "i18n!csui/pages/start/impl/nls/lang", "i18n!d2/pages/start/impl/nls/lang", "d2/utils/contexts/factories/virtual.document.factory" ], function(module, $, _, Backbone, PerspectiveRouter, NodeModel, publicLang, publicLang2, lang, VirtualDocumentFactory) {
  "use strict";
  var VDocPerspectiveRouter = PerspectiveRouter.extend({
    routes: {
      "nodes/:node_id/vdoc": "exploreVirtualDocument",
      "nodes/:node_id/vdoc(?*query_string)": "exploreVirtualDocument",
      "nodes/:node_id/editvdoc": "editVirtualDocument",
      "nodes/:node_id/editvdoc(?*query_string)": "editVirtualDocument"
    },
    name: "VirtualDocumentExplorer",
    constructor: function VDocPerspectiveRouter() {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);
      this.virtualDocument = this.context.getModel(VirtualDocumentFactory);
      this.listenTo(this.virtualDocument, "change:vd_info", this._updateUrl);
    },
    isViewStateModelSupported: function() {
      return true;
    },
    exploreVirtualDocument: function(id, query_string) {
      var vdInfo = this.virtualDocument.get("vd_info");
      var setId = !vdInfo || id && id !== vdInfo.id;
      this.initViewStateFromUrlParams(query_string, setId);
      this.activate(false);
      this.virtualDocument.set("vd_info", {
        id: id,
        isVdocFrom: "OpenVdoc"
      });
    },
    editVirtualDocument: function(id, query_string) {
      var vdInfo = this.virtualDocument.get("vd_info");
      var setId = !vdInfo || id && id !== vdInfo.id;
      this.initViewStateFromUrlParams(query_string, setId);
      this.activate(false);
      this.virtualDocument.set("vd_info", {
        id: id,
        isVdocFrom: "EditVdoc"
      });
    },
    onOtherRoute: function() {
      this.virtualDocument.clear({
        silent: true
      });
    },
    onViewStateChanged: function() {
      var vdInfo = this.virtualDocument.get("vd_info");
      if (vdInfo && vdInfo.id) {
        this._updateUrl();
      }
    },
    _updateUrl: function() {
      if (this !== this.getActiveRouter()) {
        this.activate(true);
      }
      var vdInfo = this.virtualDocument.get("vd_info"), id = vdInfo.id, uri = null;
      if (vdInfo.isVdocFrom !== "EditVdoc") {
        uri = "nodes/" + encodeURIComponent(id) + "/vdoc";
      } else {
        uri = "nodes/" + encodeURIComponent(id) + "/editvdoc";
      }
      this._updatePageTitle(vdInfo.model);
      this.navigate(uri, {
        replace: !!vdInfo.replaceLastUrl
      });
    },
    _updatePageTitle: function(node) {
      if (node) {
        document.title = !node.has("name") ? _.str.sformat(publicLang2.NodeLoadingTitle, node.get("id")) : _.str.sformat(lang.vdocPerspectivePageTitle, node.get("name"), publicLang.ProductName);
      }
    }
  });
  return VDocPerspectiveRouter;
});