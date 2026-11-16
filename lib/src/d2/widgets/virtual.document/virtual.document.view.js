/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/log", "d2/widgets/splitview.widgets/splitview.doclist.view", "d2/widgets/splitview.widgets/vd.structure.edit.view", "smart/utils/accessibility", "csui/controls/progressblocker/blocker", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitems.mask", "csui/utils/commands", "nuc/models/node/node.model", "csui/utils/contexts/factories/node", "csui/utils/contexts/factories/next.node", "d2/widgets/virtual.document/impl/virtual.document.metadata.view", "dctmw/controls/split.panel/split.panel.view", "d2/utils/vdoc.toolbaritems", "d2/utils/vdoc.toolbaritems.mask", "d2/utils/vdoc.utils", "d2/widgets/virtual.document.explorer/virtual.document.explorer.view", "d2/widgets/miniviewer/miniviewer.view", "i18n!d2/widgets/metadata/impl/nls/lang", "hbs!d2/widgets/virtual.document/impl/virtual.document", "css!d2/widgets/virtual.document/impl/virtual.document" ], function(module, require, _, $, Backbone, Marionette, log, TargetBrowseViewWidget, VdStructureEditView, Accessibility, BlockingView, LayoutViewEventsPropagationMixin, ToolItemsFactory, ToolItemsMask, commands, NodeModel, NodeModelFactory, NextNodeModelFactory, MetadataView, SplitPanelView, vDocToolItems, VDocToolItemsMask, vdUtil, VDExplorerView, Miniviewer, lang, template) {
  "use strict";
  log = log(module.id);
  var VirtualDocumentView = Marionette.LayoutView.extend({
    className: Accessibility.isAccessibleMode() ? "d2-vdoc-accessibility d2-vdoc-widget-container" : "d2-vdoc-widget-container",
    template: template,
    regions: {
      rgnPanelContainer: ".d2-vdoc-widget"
    },
    constructor: function VirtualDocumentView(options) {
      options = options || {};
      this.context = options.context;
      this.connector = options.connector || this.context && this.context.getObject("connector");
      this.nextNodeModel = this.context && this.context.getModel(NextNodeModelFactory);
      this.logPrefix = "VDView";
      if (this.context.viewStateModel.get("activeRouterInstance").virtualDocument.get("vd_info").isVdocFrom === "EditVdoc") {
        this.isEditVD = true;
      }
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.context && this.listenTo(this.context, "request:perspective", this._breakOffNodeEventBackPropagationLink).listenTo(this.context, "sync", this._onContextSync).listenToOnce(this.context, "sync", this._renderChildrenViews);
      this.listenTo(this.model, "sync", this._onContextNodeSync).listenTo(this, "navigate:to:container:parent", this._onNavigateToContainerParent).listenTo(this, "activate:fallback:vdm", this._onActivateFallbackVDM);
      this._setupToolItems();
      this._setupExplorerView();
    },
    initialize: function(options) {
      if (options.container) {
        this.container = options.container;
      } else if (options.data.containerId) {
        this.container = this.context.getModel(NodeModelFactory, {
          node: {
            attributes: {
              id: this.options.data.containerId
            }
          }
        });
      }
      if (!this.model) {
        this.model = this.context.getModel(NodeModelFactory, {
          attributes: options.data.id && {
            id: options.data.id
          },
          temporary: true
        });
        options.model = this.model;
      }
      if (!this.container) {
        this.container = options.model.clone();
      }
      options.container = this.container;
    },
    _setupToolItems: function() {
      this.options.commands = commands;
      this.options.toolbarItems = _.extend({}, vDocToolItems, {
        dropdownMenuListInProperties: vDocToolItems.metadataDropdown
      });
      this.options.toolbarItemsMask = new VDocToolItemsMask(this.options);
    },
    _setupExplorerView: function() {
      if (!this.explorerView) {
        this.explorerView = new VDExplorerView(_.defaults({
          context: this.context,
          connector: this.connector,
          model: this.model,
          container: this.container,
          blockingParentView: this,
          showBackButton: true,
          originatingView: this
        }, this.options));
        this.explorerView.collection.commands = this.options.commands;
        this.listenTo(this.explorerView, "vdoc:navigation:back", this._onNavigationBack).listenTo(this.explorerView.collection, "change", this._onExplorersModelChange);
      }
    },
    getMetadataRightbarClassName: function() {
      return "d2-vd-metadata-rightbar-active";
    },
    onRender: function() {
      if (!this.splitPanel) {
        this.splitPanel = new SplitPanelView({
          type: SplitPanelView.TYPES.THREE_WAY
        });
        this.rgnPanelContainer.show(this.splitPanel);
      }
      if (!this.context) {
        this._renderChildrenViews();
      }
    },
    _renderChildrenViews: function() {
      this.splitPanel.showPanelViews(this.explorerView, this.metadataView);
      $(".csui-perspective-breadcrumb").show();
      this.metadataView?.metadataHeaderView?.rightbarView?.toolbarView?.updateForSelectedChildren(this.model);
      $(".cs-perspective-with-breadcrumb-view").addClass("csui-breadcrumbs-visible");
    },
    _onExplorersModelChange: function(model) {
      if (this.metadataView) {
        var metaModel = this.metadataView.model;
        if (metaModel && metaModel.origNode === model) {
          this._breakOffNodeEventBackPropagationLink();
          log.debug("{0} forward attrib propagation from explorer - {1} - to metadata - {2}", this.logPrefix, vdUtil.getLogPrintableDetails(model), vdUtil.getLogPrintableDetails(metaModel)) && console.log(log.last);
          metaModel[vdUtil.MEM_TSTAMP] = model[vdUtil.MEM_TSTAMP];
          metaModel.set(_.omit(model.attributes, "actions"));
          this._setupNodeEventBackPropagationLink(metaModel);
        }
      }
    },
    _onContextSync: function() {
      this.container.set(_.omit(this.context.getModel(NodeModelFactory).attributes, "columns"));
      var viewStateModel = this.context && this.context.viewStateModel;
      if (!this.viewStateModelHistoryIndex) {
        this.viewStateModelHistoryIndex = -1;
        var perspectiveHistory = viewStateModel.getHistory();
        if (perspectiveHistory && perspectiveHistory.length > 0) {
          this.viewStateModelHistoryIndex = perspectiveHistory.length - 1;
        }
      }
    },
    _onContextNodeSync: function() {
      if (this.context.viewStateModel.get("activeRouterInstance").virtualDocument.get("vd_info").isVdocFrom !== "EditVdoc") {
        if (this.model.origNode) {
          var node = this.model.clone();
          node.collection = this.model.collection;
          node.origNode = this.model.origNode;
          node[vdUtil.MEM_TSTAMP] = this.model.origNode[vdUtil.MEM_TSTAMP];
          this._createAndRenderMetadataView(node);
        }
      }
    },
    _onNavigateToContainerParent: function() {
      if (this.nextNodeModel && this.container) {
        var parentId = this.container.parent && this.container.parent.get("id");
        if (!parentId) {
          parentId = this.container.get("parent_id");
        }
        this.nextNodeModel.set({
          id: parentId
        });
      }
    },
    _onActivateFallbackVDM: function(vdmNumber) {
      this.explorerView && this.explorerView.trigger("activate:fallback:vdm", vdmNumber);
    },
    _onNavigationBack: function(e) {
      e && e.preventDefault();
      var cmdGoBack = commands.get("D2-Back");
      cmdGoBack && cmdGoBack.execute({
        context: this.context,
        restoreLastFragment: true,
        restoryHistoryIndex: this.viewStateModelHistoryIndex
      });
    },
    onMetadataClose: function() {
      this._onNavigationBack();
    },
    _createAndRenderMetadataView: function(node) {
      var selectedTab, activeTab, me = this;
      if (this.metadataView) {
        selectedTab = this.metadataView.metadataTabView.tabLinks ? this.metadataView.metadataTabView.tabLinks.selected : this.metadataView.options.selectedTab ? this.metadataView.options.selectedTab : "";
        activeTab = this.metadataView.metadataTabView.options.activeTab ? this.metadataView.metadataTabView.options.activeTab : this.metadataView.options.activeTab ? this.metadataView.options.activeTab : "";
        this._breakOffNodeEventBackPropagationLink();
        this.metadataView.destroy();
      }
      log.debug("{0} - creating metadata for - {1} backed by {2}", this.logPrefix, vdUtil.getLogPrintableDetails(node), vdUtil.getLogPrintableDetails(node.origNode)) && console.log(log.last);
      this.metadataView = new MetadataView(_.defaults({
        model: node,
        selectedTab: selectedTab,
        activeTab: activeTab,
        originatingView: this,
        collection: this.explorerView && this.explorerView.collection,
        container: this.container,
        toolbarItems: _.extend({}, this.options.toolbarItems, {
          rightToolbar: new ToolItemsFactory({
            main: [ {
              signature: "D2-EditVDoc",
              name: lang.editIconTooltip,
              enabled: true,
              iconName: "csui_action_edit32"
            } ]
          }, {
            maxItemsShown: 3
          })
        }),
        toolbarItemsMasks: this.options.metadataHeaderToolitemMasks
      }, this.options));
      this.metadataView.internal = true;
      BlockingView.delegate(this.metadataView, this);
      this.metadataView.listenTo(this.metadataView, "d2:metadata:edit", function(editMode) {
        editMode ? me.$el.addClass("vdoc-metadata-edit") : me.$el.removeClass("vdoc-metadata-edit");
      });
      this.metadataView.on("change:miniviewer:visibiity", this._showHideMiniviewer.bind(this));
      this._setupNodeEventBackPropagationLink(node);
      this._renderChildrenViews();
    },
    _showHideMiniviewer: function(isShown) {
      if (isShown) {
        this.$el.find(".d2-split-panel-content.tertiary-pane").removeClass("binf-hidden");
      } else {
        this.$el.find(".d2-split-panel-content.tertiary-pane").addClass("binf-hidden");
      }
    },
    _setupNodeEventBackPropagationLink: function(node) {
      node && node.origNode && node.origNode.listenTo(node, "change", function(metaModel) {
        log.debug("{0} backward attrib propagation from metadata - {1} - to explorer - {2}", this.logPrefix, vdUtil.getLogPrintableDetails(metaModel), vdUtil.getLogPrintableDetails(metaModel.origNode)) && console.log(log.last);
        vdUtil.syncToOriginalVDNode(metaModel);
      }.bind(this));
    },
    _breakOffNodeEventBackPropagationLink: function() {
      this.metadataView && this.metadataView.model && this.metadataView.model.origNode && this.metadataView.model.origNode.stopListening(this.metadataView.model);
    },
    onBeforeDestroy: function() {
      this.miniviewerView && this.miniviewerView.destroy();
    }
  });
  _.extend(VirtualDocumentView.prototype, LayoutViewEventsPropagationMixin);
  return VirtualDocumentView;
});