/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/models/node/node.model", "nuc/models/nodeancestors", "d2/utils/constants", "csui/controls/breadcrumbs/breadcrumbs.view", "csui/controls/table/cells/cell/cell.view", "csui/controls/table/cells/cell.registry", "nuc/models/nodes", "csui/utils/commands", "csui/utils/commandhelper", "i18n!csui/widgets/metadata/impl/nls/lang", "d2/utils/node.version.utils", "nuc/models/ancestor", "dctmw/utils/client.location", "csui/controls/form/pub.sub", "hbs!d2/controls/table/cells/url.segment/impl/url.segment.view", "css!d2/controls/table/cells/url.segment/impl/url.segment.view" ], function(_, Backbone, Marionette, NodeModel, NodeAncestorCollection, constants, BreadcrumbsView, CellView, cellViewRegistry, NodeCollection, commands, CommandHelper, csuiMetaPanelsLang, versionUtil, AncestorModel, clientLocation, PubSub, template) {
  "use strict";
  var D2UrlBreakableSegmentCellView = CellView.extend({
    template: template,
    className: "csui-nowrap",
    needsAriaLabel: true,
    ui: {},
    constructor: function D2UrlBreakableSegmentCellView() {
      CellView.prototype.constructor.apply(this, arguments);
      var model = this.model, containerNode = model.collection && model.collection.node;
      this.commandStatus = {
        collection: model.collection,
        container: containerNode && containerNode.get("container") === true ? containerNode : null,
        context: this.options.context,
        nodes: new NodeCollection([ model ]),
        selectedTab: new Backbone.Model({
          name: "locations"
        }),
        suppressSuccessMessage: true,
        suppressFailMessage: true
      };
      this.command = commands.get("Properties");
      this.isCommandActive = this.command && this.command.enabled(this.commandStatus);
    },
    setBreadcrumbs: function(options) {
      var container = options.model.parent, id = container ? container.get("id") : 0, name = container ? container.get("name") : 0, type = container ? container.get("type") : 0, cabinetId = container ? container.get("i_cabinet_id") : 0;
      if (!id || id === 0) {
        this.getAncestors(id, name, type, cabinetId);
        this.setBreadcrumbEvents();
        return;
      }
      this.getAncestors(id, name, type, cabinetId);
      if (options.ancestors) {
        this.resetBreadCrumbs(options.ancestors);
      }
      this.listenTo(this.breadcrumbs, "after:synchronized", this.onAfterBreadcrumbsSynchronized);
      this.setBreadcrumbEvents();
      return true;
    },
    onAfterBreadcrumbsSynchronized: function() {
      if (this.ui.breadcrumb) {
        this.ui.breadcrumb.show();
        if (this.breadcrumbs.collection.length === 1) {
          this.options.targetBrowseHistory = [];
        }
        this.windowRefresh();
      }
    },
    setBreadcrumbEvents: function() {
      this.listenTo(this.breadcrumbs, "before:defaultAction", function(args) {
        clientLocation.navigate(clientLocation.modularizeFragment(`#d2/nodes/${args.node.get("id")}`), {
          trigger: true,
          reload: true
        });
      });
    },
    resetBreadCrumbs: function(ancestors) {
      this.breadcrumbs.collection.reset(ancestors);
    },
    getAncestors: function(nodeId, nodeName, nodeType, nodeCabinetId) {
      var node = new NodeModel({
        id: nodeId,
        name: nodeName,
        type: nodeType,
        i_cabinet_id: nodeCabinetId
      }, {
        connector: this.model.connector
      }), ancestorOptions = {
        node: node,
        autofetch: true
      }, newAncestors = new NodeAncestorCollection(undefined, ancestorOptions);
      if (nodeId === constants.NodeId.REPOSITORY) {
        newAncestors = new NodeAncestorCollection(node, ancestorOptions);
      }
      newAncestors.add(this.model.get("ancestor_list"));
      this.breadcrumbs = new BreadcrumbsView({
        node: node,
        collection: newAncestors,
        context: this.options.context
      });
      this.breadcrumbs.listenTo(PubSub, "adjust:breadcrumb", this.breadcrumbs.refresh);
      this.breadcrumbs.synchronizeCollections();
      if (!this.breadcrumbNode) {
        this.breadcrumbNode = node;
      }
      const region = new Marionette.Region({
        el: this.ui.breadcrumb
      });
      if (this.breadcrumbs) {
        region.show(this.breadcrumbs);
      }
    },
    renderValue: function() {
      this.$el.append("<div class='w-locations-breadcrumbs'></div>");
      this.$el.append("<div class='csui-np-selectviews'></div>");
      this.ui["breadcrumb"] = this.$el.find(".w-locations-breadcrumbs");
      this.ui["selectViews"] = this.$el.find(".csui-np-selectviews");
      this.setBreadcrumbs(this.options);
    },
    getContentView: function() {
      return this;
    },
    windowRefresh: function() {
      if (this.breadcrumbs) {
        this.breadcrumbs.refresh();
      }
    }
  }, {
    hasFixedWidth: false,
    columnClassName: "d2-table-cell-url_segment"
  });
  cellViewRegistry.registerByColumnKey("d2_folder_path", D2UrlBreakableSegmentCellView);
  return D2UrlBreakableSegmentCellView;
});