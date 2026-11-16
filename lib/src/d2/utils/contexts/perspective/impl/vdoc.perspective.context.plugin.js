/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/contexts/factories/node", "csui/utils/contexts/perspective/perspective.context.plugin", "d2/utils/contexts/context.controller", "d2/utils/contexts/factories/virtual.document.factory", "d2/utils/contexts/perspective/virtual.document.perspectives", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "d2/utils/widget.constants", "d2/utils/vdoc.utils", "i18n!d2/utils/contexts/perspective/impl/nls/lang" ], function(module, _, $, Backbone, ApplicationScopeModelFactory, NodeModelFactory, PerspectiveContextPlugin, D2ContextController, VirtualDocumentFactory, vDocPerspsectives, RestResources, serverQueryUtil, widgetConstants, vdUtil, lang) {
  "use strict";
  var nodeOptions = {
    includeResources: [ "metadata", "perspective" ]
  };
  var VDocPerspectiveContextPlugin = PerspectiveContextPlugin.extend({
    constructor: function VDocPerspectiveContextPlugin() {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.virtualDocument = this.context.getModel(VirtualDocumentFactory, {
        permanent: true,
        detached: true
      });
      this.listenTo(this.virtualDocument, "change:vd_info", this._fetchVDocPerspective).listenTo(this.context, "retain:perspective", this.onRetainPerspective).listenTo(this.context, "request:perspective", this.onRequestPerspective);
    },
    isFetchable: function(factory) {
      return factory.property !== this.node;
    },
    onClear: function() {
      if (this.applicationScope.get("id") !== "vdoc") {
        this.node = this._getNodeFromFactory();
        this.virtualDocument.clear({
          silent: true
        });
      } else {
        this.node = this._getNodeFromFactory.apply(this, this.rejectedPerspective ? undefined : [ this.virtualDocument.get("vd_info").model, true ]);
        this._setContextWidget();
      }
    },
    onRefresh: function() {
      if (this.applicationScope.get("id") === "vdoc") {
        if (this.rejectedPerspective) {
          this.node.clear();
          return;
        }
        this._syncVDToSharedContextNode();
      }
    },
    onRetainPerspective: function() {
      if (this.applicationScope.get("id") === "vdoc") {
        this._syncVDToSharedContextNode();
        this._setContextWidget();
      }
    },
    onRequestPerspective: function() {
      var widgetInfo = D2ContextController.getWidgetInfo();
      if (widgetInfo && widgetInfo.type === widgetConstants.D2.VDOC) {
        this._clearContextWidget();
      }
    },
    _setContextWidget: function() {
      var userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), defaultVDWidget = userDefaultWidgets[widgetConstants.DEFAULT.VDOC];
      if (defaultVDWidget) {
        D2ContextController.setWidgetInfo(undefined, {
          name: defaultVDWidget,
          type: widgetConstants.D2.VDOC
        });
      }
    },
    _clearContextWidget: function() {
      D2ContextController.removeWidgetInfo();
    },
    _getNodeFromFactory: function(sourceNode, forceCopy) {
      var factory = this.context.getFactory(NodeModelFactory, {
        options: nodeOptions,
        node: sourceNode
      });
      if (!!sourceNode && forceCopy === true && factory.property !== sourceNode) {
        factory.property = sourceNode;
      }
      return factory.property;
    },
    _syncVDToSharedContextNode: function() {
      this.node = this._getNodeFromFactory();
      var vdInfo = this.virtualDocument.get("vd_info");
      if (vdInfo.model === this.node || vdInfo.model.get("id") === this.node.get("id")) {
        return;
      }
      this.node.clear({
        silent: true
      });
      this.node.set(vdInfo.model.attributes);
    },
    _fetchVDocPerspective: function() {
      var vdInfo = this.virtualDocument.get("vd_info"), node, userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), defaultVDocWidgetName = userDefaultWidgets[widgetConstants.DEFAULT.VDOC], userHasDefaultVDWidget = !!defaultVDocWidgetName;
      if (vdInfo.model) {
        if (this.node && this.node === vdInfo.model && this.applicationScope.get("id") === "vdoc") {
          return;
        }
        node = vdInfo.model;
      } else {
        node = this.context.getModel(NodeModelFactory, {
          attributes: {
            id: vdInfo.id
          },
          options: nodeOptions,
          temporary: true
        });
      }
      this.rejectedPerspective = false;
      this.context.triggerMethod("request:perspective", this.context);
      this.applicationScope.set("id", "vdoc");
      if (userHasDefaultVDWidget) {
        this._contextWidgetConfig = serverQueryUtil.getWidgetConfig(widgetConstants.D2.VDOC, defaultVDocWidgetName);
        node.ensureFetched().done(function() {
          delete node.attributes.perspective;
          this.node = node;
          if (vdInfo.model) {
            vdInfo.model = node;
          } else {
            this.virtualDocument.set("vd_info", _.extend({}, vdInfo, {
              model: node
            }));
          }
          this._verifyVDocModelAndDecidePerspective(node, {
            editVirtualDocumentView: vdInfo.isVdocFrom === "EditVdoc"
          });
        }.bind(this)).fail(function(error) {
          this._doRejectPerspective(node, error);
        }.bind(this));
      } else {
        delete this._contextWidgetConfig;
        this._doRejectPerspective(node, new Error(lang.ErrorMissingVDWidgetConfig));
      }
    },
    _verifyVDocModelAndDecidePerspective: function(node, addlPerspectiveMatcherProperties) {
      if (vdUtil.isVirtualDoc(node) || vdUtil.isVDSnapshot(node)) {
        this._contextWidgetConfig.is_client_side_usage_snapshot = vdUtil.isVDSnapshot(node) === true;
        this._changePerspective(node, addlPerspectiveMatcherProperties);
      } else {
        this._doRejectPerspective(node, new Error(lang.ErrorNotAVirtualDocumentOrSnapshot));
      }
    },
    _doRejectPerspective: function(node, error) {
      this.rejectedPerspective = true;
      this.context.rejectPerspective(node, error);
    },
    _changePerspective: function(sourceModel, addlPerspectiveMatcherProperties) {
      var perspectiveModule, perspective = vDocPerspsectives.findByNode(addlPerspectiveMatcherProperties ? new Backbone.Model(_.defaults(addlPerspectiveMatcherProperties, sourceModel.attributes)) : sourceModel);
      if (_.isEmpty(sourceModel.get("perspective")) || perspective.get("important")) {
        perspectiveModule = perspective.get("module");
      }
      if (perspectiveModule) {
        return this.context.overridePerspective(sourceModel, perspectiveModule);
      }
      this.context.applyPerspective(sourceModel);
    }
  });
  return VDocPerspectiveContextPlugin;
});