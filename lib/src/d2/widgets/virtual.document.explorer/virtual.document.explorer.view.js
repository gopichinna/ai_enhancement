/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/progressblocker/blocker", "csui/controls/toolbar/toolbar.command.controller", "csui/controls/table.rowselection.toolbar/table.rowselection.toolbar.view", "nuc/models/nodes", "csui/utils/commands", "csui/utils/contexts/factories/node", "csui/utils/contexts/factories/ancestors", "csui/utils/contexts/factories/connector", "d2/controls/button.toolbar/button.toolbar.view", "d2/controls/inline.menu/customized.wrap.toolbar.view", "d2/utils/contexts/factories/virtual.document.children.factory", "d2/utils/commands/vdoc.default.actions", "d2/utils/vdoc.default.actionitems", "d2/utils/vdoc.toolbaritems", "d2/utils/vdoc.toolbaritems.mask", "d2/utils/vdoc.utils", "d2/utils/constants", "d2/utils/widget.constants", "d2/utils/server.query.utils", "dctmw/utils/rest.resources", "d2/widgets/virtual.document.explorer/virtual.document.structure.view", "d2/widgets/virtual.document.explorer/impl/vdoc.command.controller.mixin", "d2/widgets/virtual.document.explorer/virtual.document.table.view", "i18n!d2/widgets/virtual.document.explorer/impl/nls/lang", "hbs!d2/widgets/virtual.document.explorer/impl/virtual.document.explorer", "css!d2/widgets/virtual.document.explorer/impl/virtual.document.explorer" ], function(_, $, Backbone, Marionette, LayoutViewEventsPropagationMixin, BlockingView, ToolbarCommandController, TableRowSelectionToolbarView, NodeCollection, commands, NodeModelFactory, AncestorCollectionFactory, ConnectionFactory, ButtonToolbarView, CustomWrapToolbarView, VDocChildrenFactory, vDocDefaultActionCommands, vDocDefaultActionItems, vDocToolItems, VDocToolItemsMask, vdUtil, constants, widgetConstants, ServerQueryUtils, RestResources, VDocStructureView, VDocCommandControllerMixin, VDocTableView, lang, template) {
  "use strict";
  var CustomTableRowSelectionToolbar = TableRowSelectionToolbarView.extend({
    initialize: function(options) {
      options = options || {};
      var retVal = TableRowSelectionToolbarView.prototype.initialize.call(this, options);
      if (!options.collection.delayedActions) {
        this.stopListening(this._toolbarView);
        var toolbarViewOptions = _.extend({
          originatingView: options.originatingView,
          collection: this._filteredToolItemsCollection,
          toolbarName: "tableHeader"
        }, options.toolItemFactory.options, {
          role: "menubar"
        });
        this._toolbarView = new CustomWrapToolbarView(toolbarViewOptions);
        this.listenTo(this._toolbarView, "childview:toolitem:action", this._toolbarItemClicked);
        this.listenTo(this._toolbarView, "render render:lazy:actions", function() {
          this._updateCounts();
          if (this._focusableElements.length) {
            this._focusedToolbarItemIndex = 0;
            this._moveTabindexToFocusedElement();
          }
        });
      }
      return retVal;
    }
  });
  var VDocExplorerView = Marionette.LayoutView.extend({
    className: "d2-vd-explorer",
    template: template,
    regions: {
      rgnToolbarMain: ".d2-toolbar-vd-main",
      rgnToolbarNode: ".d2-toolbar-vd-node",
      rgnVDStructure: ".d2-vd-structure-wrapper"
    },
    constructor: function VDocExplorerView(options) {
      options = options || {};
      this.options = options;
      options.toolbarItems = options.toolbarItems || vDocToolItems;
      options.defaultActionItems = options.defaultActionItems || vDocDefaultActionItems;
      options.defaultActionCommands = options.defaultActionCommands || vDocDefaultActionCommands;
      this.context = options.context;
      this.connector = options.connector || this.context && this.context.getObject("connector");
      this.commands = options.commands || commands;
      this.commandController = new ToolbarCommandController({
        commands: this.commands
      });
      if (!this.options.toolbarItemsMask) {
        this.options.toolbarItemsMask = new VDocToolItemsMask(this.options);
      }
      this.showBackButton = _.isBoolean(options.showBackButton) ? options.showBackButton : true;
      this.selectedNodes = options.selectedNodes instanceof Backbone.Collection ? options.selectedNodes : new NodeCollection();
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      if (options.blockingParentView) {
        BlockingView.delegate(this, options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.context && this.listenTo(this.context, "sync", this._onContextSync).listenToOnce(this.context, "sync", this._renderChildrenViews);
      this.listenTo(this, "activate:fallback:vdm", this._onActivateFallbackVDM);
      this.setupMainToolbarView();
      this.setupNodeToolbarView();
      this.setupVDStructureView();
    },
    initialize: function(options) {
      this.model = options.model || this.context.getModel(NodeModelFactory);
      this.isVDocSnapshot = vdUtil.isVDSnapshot(this.model);
      this.collection = options.collection || this.context.getCollection(VDocChildrenFactory, {
        options: {
          node: this.model,
          exploreAsSnapshot: this.isVDocSnapshot
        }
      });
      this.container = options.container || this.model.clone();
      var ancestorCollectionFactory = this.context.getFactory(AncestorCollectionFactory);
      ancestorCollectionFactory.stopListening(ancestorCollectionFactory.property.node, "change:name");
    },
    setupMainToolbarView: function() {
      var buttonsConfig = {
        left: [],
        right: [ {
          id: "collapseAll",
          tooltip: lang.labelToolbarCollapse,
          disabled: true,
          iconName: "d2_action_collapse_all",
          clickHandler: function(e) {
            this._onToggleExpandCollapse(e, false);
          }.bind(this)
        }, {
          id: "expandAll",
          tooltip: lang.labelToolbarExpand,
          disabled: true,
          iconName: "d2_action_expand_all",
          clickHandler: function(e) {
            this._onToggleExpandCollapse(e, true);
          }.bind(this)
        }, {
          id: "versionToggle",
          className: "icon icon-vd-version-toggle round-button",
          type: "toggle",
          tooltip: lang.labelToolbarShowVersion,
          tooltipSelected: lang.labelToolbarHideVersion,
          disabled: true,
          iconName: "d2_action_version_control",
          toggleHandler: this._onToggleVersion.bind(this)
        }, {
          id: "showExpandedView",
          className: "icon-vd-show-expanded-view",
          tooltip: lang.labelToolbarShowExpandedView,
          disabled: true,
          iconName: "d2_action_panel_open",
          clickHandler: this._onShowExpandedViewClick.bind(this)
        } ]
      };
      if (this.showBackButton) {
        buttonsConfig.left.splice(0, 0, {
          id: "navigateBack",
          className: "icon icon-vd-go-back",
          tooltip: lang.labelToolbarBack,
          iconName: "csui_action_back32",
          clickHandler: this._onClickGoBack.bind(this)
        });
      }
      this.mainToolbarView = new ButtonToolbarView(buttonsConfig);
    },
    setupNodeToolbarView: function() {
      this.nodeToolbarView = new CustomTableRowSelectionToolbar(_.defaults({
        context: this.context,
        connector: this.connector,
        collection: this.collection,
        toolItemFactory: this.options.toolbarItems.headerToolbar,
        toolbarCommandController: this.commandController,
        commands: this.commands,
        selectedChildren: this.selectedNodes
      }, _.omit(this.options, "toolbarItems"), {
        originatingView: this,
        container: this.container
      }));
      this.listenTo(this.nodeToolbarView._commandController, "before:execute:command", this.beforeExecuteCommand).listenTo(this.nodeToolbarView._commandController, "after:execute:command", this.afterExecuteCommand);
    },
    setupVDStructureView: function() {
      var args = _.defaults({
        context: this.context,
        connector: this.connector,
        collection: this.collection,
        snapshotView: this.isVDocSnapshot,
        blockingParentView: this.options.blockingParentView || this,
        parentView: this,
        commands: this.commands,
        toolItemFactory: this.options.toolbarItems,
        selectedNodes: this.selectedNodes
      }, _.omit(this.options, "toolbarItems"), {
        originatingView: this,
        container: this.container
      });
      this.vdStructureView = new VDocStructureView(args);
      this.listenToOnce(this.vdStructureView, "render:complete", this._onVDTreeRenderComplete);
    },
    onRender: function() {
      if (!this.context) {
        this._renderChildrenViews();
      }
    },
    onResolutionChange: function(resolutionData) {
      if (resolutionData.showSideBar === false) {
        return true;
      } else {
        return false;
      }
    },
    _onContextSync: function() {
      this.collection.perspectiveNode = this.context.getModel(NodeModelFactory).clone();
      this.container.set(_.omit(this.collection.perspectiveNode.attributes, "columns"));
    },
    _renderChildrenViews: function() {
      if (this.mainToolbarView) {
        this.rgnToolbarMain.show(this.mainToolbarView);
      }
      if (this.nodeToolbarView) {
        this.rgnToolbarNode.show(this.nodeToolbarView);
      }
      if (this.vdStructureView) {
        this.rgnVDStructure.show(this.vdStructureView);
      }
    },
    _onVDTreeRenderComplete: function() {
      _.each([ "expandAll", "collapseAll", "versionToggle", "showExpandedView" ], function(btnId) {
        var btn = this.mainToolbarView.getButtonById(btnId);
        btn && btn.set("disabled", false);
      }.bind(this));
    },
    _onClickGoBack: function(e) {
      this.trigger("vdoc:navigation:back", e);
      if (!e.isDefaultPrevented()) {
        window.history.back();
      }
    },
    _onToggleExpandCollapse: function(e, isSelected) {
      this.vdStructureView && this.vdStructureView.triggerMethod("change:expand:collapse", isSelected);
    },
    _onToggleVersion: function(e, isSelected) {
      this.vdStructureView && this.vdStructureView.triggerMethod("change:versions:display", isSelected);
    },
    _onShowExpandedViewClick: function() {
      var columnPreferenceOptions = this._getColumnPreferenceOptions();
      ServerQueryUtils.fetchColumnPreferences(columnPreferenceOptions).always(() => {
        this.vdExpandedView = VDocTableView.show({
          context: this.context,
          model: this.container,
          vdTreeCollection: this.collection
        });
        this.vdExpandedView.once("destroy", function() {
          delete this.vdExpandedView;
        }.bind(this));
        this.vdExpandedView.on("navigate:to:container:parent", function() {
          this.options.originatingView && this.options.originatingView.trigger("navigate:to:container:parent");
        }.bind(this));
      });
    },
    _getColumnPreferenceOptions: function() {
      var userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), widgetName = userDefaultWidgets[widgetConstants.DEFAULT.VDOC], connectionObject = this.context.getObject(ConnectionFactory);
      return {
        widgetName: widgetName,
        widgetType: widgetConstants.D2.VDOC,
        defaultType: constants.DocumentLinkType.VD,
        connector: connectionObject
      };
    },
    _onActivateFallbackVDM: function(vdmNumber) {
      this.vdStructureView && this.vdStructureView.triggerMethod("set:fallback:active:node", vdmNumber);
    },
    beforeExecuteCommand: function(commandArgs) {
      var status = commandArgs.status;
      if (status) {
        var toolbarContainer = status.container;
        status.container = this.container;
        status.toolbarContainer = toolbarContainer;
      }
      this._beforeExecuteCommand.apply(this, arguments);
    },
    afterExecuteCommand: function(commandArgs) {
      var status = commandArgs.status;
      if (status) {
        status.container = status.toolbarContainer;
        delete status.toolbarContainer;
      }
      this._afterExecuteCommand.call(this, commandArgs, {
        silent: false
      });
    },
    onBeforeDestroy: function() {
      this.vdExpandedView && this.vdExpandedView.destroy();
    },
    getWidgetTypeId: function() {
      return constants.WidgetId.VIRTUAL_DOCUMENTS;
    }
  });
  _.extend(VDocExplorerView.prototype, LayoutViewEventsPropagationMixin);
  VDocCommandControllerMixin.mixin(VDocExplorerView.prototype);
  return VDocExplorerView;
});