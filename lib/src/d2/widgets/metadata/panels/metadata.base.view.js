/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "d2/controls/globalmessage/globalmessage", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/toolbar/toolbar.view", "csui/controls/table/table.view", "csui/controls/tableactionbar/tableactionbar.view", "csui/controls/pagination/nodespagination.view", "csui/controls/table.rowselection.toolbar/table.rowselection.toolbar.view", "csui/controls/tabletoolbar/tabletoolbar.view", "csui/controls/toolbar/toolbar.command.controller", "nuc/models/nodes", "nuc/models/node/node.model", "d2/utils/constants", "d2/models/base.default.action.items", "d2/models/base.columns", "d2/utils/widgets.utils", "csui/utils/contexts/factories/widget.settings.collection.factory", "dctmw/utils/utils", "d2/utils/widget.constants", "i18n!d2/widgets/metadata/panels/impl/nls/lang", "hbs!d2/widgets/metadata/panels/impl/metadata.basepanel", "css!d2/widgets/metadata/panels/impl/metadata.basepanel" ], function(module, $, _, Backbone, Marionette, base, GlobalMessage, LayoutViewEventsPropagationMixin, ToolbarView, TableView, TableActionBarView, PaginationView, TableRowSelectionToolbarView, TableToolbarView, ToolbarCommandController, NodeCollection, NodeModel, constants, defaultActionItems, columns, WidgetUtils, WidgetSettingsCollectionFactory, utils, widgetConstants, lang, template) {
  "use strict";
  var SelectionCollection = Backbone.Collection.extend({
    modelId: function(attr) {
      return attr.id;
    }
  });
  var MetadataBaseTableView = Marionette.LayoutView.extend({
    className: "metadata-inner-wrapper",
    template: template,
    ui: {
      tableRowSelectionToolbarView: ".csui-metadata-basepanel-rowselection-toolbar-view",
      tableToolbarView: ".csui-table-tabletoolbar",
      tableView: ".csui-table-view",
      childContainer: ".csui-table-view",
      paginationView: ".csui-pagination-view"
    },
    regions: {
      tableRowSelectionToolbarRegion: "@ui.tableRowSelectionToolbarView",
      tableToolbarRegion: "@ui.tableToolbarView",
      tableRegion: "@ui.tableView",
      paginationRegion: "@ui.paginationView"
    },
    constructor: function MetadataBaseTableView(options) {
      this.commands = options.commands;
      this.context = options.context;
      _.defaults(options, {
        originatingView: options.originatingView || options.metadataView
      });
      this.collectionClass = options.collectionClass;
      MetadataBaseTableView.__super__.constructor.call(this, options);
      this.collection = new this.collectionClass(undefined, {
        node: this.options.node || this.options.model,
        autoreset: true,
        commands: this.commands.getAllSignatures(),
        onlyClientSideDefinedColumns: true,
        customCollectionOptions: options.customCollectionOptions
      });
      var allSelectedNodes = new SelectionCollection();
      if (this.collection.modelId) {
        allSelectedNodes.modelId = this.collection.modelId;
      }
      this.allSelectedNodes = options.allSelectedNodes || allSelectedNodes;
      this.options.allSelectedNodes = this.allSelectedNodes;
      this.commandController = new ToolbarCommandController({
        commands: this.commands
      });
      this.defaultActionItems = defaultActionItems;
      this.listenToOnce(this.collection, "reset", () => {
        this.setMetadataTableView();
      });
      this.collection.fetch();
      this.propagateEventsToRegions();
      this.listenTo(this.collection, "add", this._updateCollection).listenTo(this.collection, "remove", this._updateCollection);
      if (this.options.isRelationTable) {
        this.allSelectedNodes.model = this.allSelectedNodes.model.extend({
          idAttribute: "associate_id"
        });
      }
      this._activateWidget();
    },
    onPanelActivated: function() {
      this._activateWidget();
    },
    _activateWidget: function() {
      if (this.context) {
        this.context.trigger("d2.open:panel", {
          widgetView: this
        });
        this.context.viewStateModel.set({
          d2selectedNode: this.options.model
        }, {
          silent: true
        });
        this.context.viewStateModel.set({
          properties: false
        }, {
          silent: true
        });
      }
    },
    onRender: function() {
      this.collection.ensureFetched().done(() => {
        this.tableRowSelectionToolbarRegion.show(this._tableRowSelectionToolbarView);
        this.tableToolbarRegion.show(this._tableToolbarView);
        this.tableRegion.show(this.tableView);
        this.paginationRegion.show(this.paginationView);
        var resizeHandler = _.throttle(_.bind(this._onResize, this), 50);
        var resizeEventName = this._getQulaifiedNameForEvents("resize");
        var resizeTableViewEventName = this._getQulaifiedNameForEvents("resize", "tableview");
        $(window).off(resizeEventName).on(resizeEventName, {
          view: this
        }, resizeHandler);
        $(window).off(resizeTableViewEventName).on(resizeTableViewEventName, {
          view: this
        }, resizeHandler);
      });
    },
    setMetadataTableView: function() {
      this._setTableView();
      this._setTableViewSelectionEventsListeners(this.tableView);
      this._setTableRowSelectionToolbar({
        toolItemFactory: this.options.toolbarItems.tableHeaderToolbar,
        toolbarItemsMask: this.options.toolbarItemsMasks,
        commands: this.commands
      });
      this._setTableToolbar({
        toolItemFactory: this.options.toolbarItems,
        toolbarItemsMask: this.options.toolbarItemsMasks,
        commands: this.commands
      });
      this._setTableRowSelectionToolbarEventListeners();
      this._setPagination();
    },
    _updateCollection: function() {
      this.collection.fetch();
    },
    getTableModePref: function() {
      if (!this._currentTableMode) {
        let d2SvWidgetState = this.collection.columnPreference && this.collection.columnPreference.get("d2sv_widget_state");
        const widgetState = d2SvWidgetState || WidgetUtils.getDefaultWidgetState();
        this._currentTableMode = WidgetUtils.getClientWidgetSettings(widgetState).tableMode;
      }
      return this._currentTableMode === widgetConstants.TableModes.NOWRAP;
    },
    _setTableView: function() {
      this.options || (this.options = {});
      var args = _.extend({
        tableColumns: columns,
        connector: this.model.connector,
        collection: this.collection,
        columns: this.collection.columns,
        columnsWithSearch: [ "name" ],
        orderBy: "name asc",
        actionItems: defaultActionItems,
        commands: this.commands,
        originatingView: this.options.originatingView,
        focusView: "tableHeader",
        tableColumnsWrappingOff: this.getTableModePref(),
        inlineBar: {
          viewClass: TableActionBarView,
          options: _.extend({
            collection: this.options?.toolbarItems?.inlineActionbar,
            delayedActions: this.collection.delayedActions,
            container: this.container,
            containerCollection: this.collection
          }, this.options?.toolbarItems?.inlineActionbar?.options, {
            inlineBarStyle: this.options.inlineActionBarStyle,
            forceInlineBarOnClick: this.options.forceInlineActionBarOnClick,
            showInlineBarOnHover: this.options.showInlineActionBarOnHover
          })
        }
      }, this.options);
      if (!_.contains(this.options.ddItemsList, this.options.pageSize)) {
        this.options.ddItemsList.push(this.options.pageSize);
        this.options.ddItemsList.sort();
      }
      this.tableView = new TableView(args);
      if (this.collection.length === 0) {
        this.tableView.enableEmptyViewText();
      }
      this.listenTo(this.tableView, "execute:defaultAction", function(node) {
        var action = this.defaultActionItems.find(function(actionItem) {
          var type = actionItem.get("type");
          var decides = actionItem.get("decides");
          if (type && type === node.get("type") || decides && decides(node)) {
            return true;
          }
        }, this);
        if (!action) {
          return;
        }
        if (this.options.originatingView && this.options.originatingView.container && this.options.originatingView.container.get("id") === node.get("id")) {
          this.options.originatingView.triggerMethod("metadata:close");
        }
        var cmd = this.commands.get(action.get("signature"));
        var status = {
          nodes: new this.collectionClass([ node ])
        };
        var cmdOption = {
          context: this.options.context,
          originatingView: this
        };
        cmd.execute(status, cmdOption);
      });
      this.triggerMethod("table:view:initialized");
    },
    _setTableViewSelectionEventsListeners: function(tableView) {
      this.listenTo(tableView, "tableRowSelected", function(args) {
        this._addNodesToSelection(args.nodes);
      });
      this.listenTo(tableView, "tableRowUnselected", function(args) {
        this._removeNodesFromSelection(args.nodes);
      });
    },
    _addNodesToSelection: function(nodes) {
      if (nodes) {
        var selectedNodes = this.allSelectedNodes;
        var selectedModels = selectedNodes.models.slice(0);
        _.each(nodes, function(node) {
          if (node.get("id") !== undefined && (!selectedNodes.pluck("id").includes(nodes[0].get("id")) || !selectedNodes.get(node))) {
            selectedModels.push(node);
          }
        }, this);
        selectedNodes.reset(selectedModels);
      }
    },
    _removeNodesFromSelection: function(nodes) {
      if (nodes) {
        var selectedNodes = this.allSelectedNodes;
        _.each(nodes, function(node) {
          selectedNodes.remove(node, {
            silent: true
          });
        }, this);
        selectedNodes.reset(_.clone(selectedNodes.models));
      }
    },
    _setTableRowSelectionToolbar: function(options) {
      this._tableRowSelectionToolbarView = new TableRowSelectionToolbarView({
        toolItemFactory: options.toolItemFactory,
        toolbarItemsMask: options.toolbarItemsMask,
        toolbarCommandController: this.commandController,
        commands: this.commands,
        selectedChildren: this.allSelectedNodes,
        container: this.collection.node,
        context: this.options.context,
        originatingView: this.options.originatingView,
        collection: this.collection
      });
    },
    _setTableToolbar: function(options) {
      this._tableToolbarView = new TableToolbarView({
        toolbarItems: options.toolItemFactory,
        toolItemFactory: options.toolItemFactory,
        toolbarItemsMask: options.toolbarItemsMask,
        toolbarCommandController: this.commandController,
        commands: this.commands,
        selectedChildren: this.allSelectedNodes,
        container: this.collection.node,
        context: this.options.context,
        originatingView: this.options.originatingView,
        collection: this.collection
      });
      this.listenTo(this._tableToolbarView.collection, "sync", this.panelCheck);
    },
    _setTableRowSelectionToolbarEventListeners: function() {
      this.listenTo(this.allSelectedNodes, "reset update", function() {
        if (this.allSelectedNodes.length > 0) {
          this.tableToolbarRegion.$el.addClass("binf-hidden");
          this.tableRowSelectionToolbarRegion.$el.addClass("csui-metadata-basepanel-rowselection-toolbar-visible");
        } else {
          this.tableToolbarRegion.$el.removeClass("binf-hidden");
          this.tableRowSelectionToolbarRegion.$el.removeClass("csui-metadata-basepanel-rowselection-toolbar-visible");
        }
      });
    },
    _setPagination: function() {
      this.paginationView = new PaginationView({
        collection: this.collection,
        pageSize: this.options.pageSize,
        defaultDDList: this.options.ddItemsList,
        skipPaginationUpdateRequest: true
      });
    },
    getD2SelectedNodes: function() {
      return new NodeCollection(this.allSelectedNodes.models).models;
    },
    onDestroy: function() {
      if (this.context) {
        this.context.trigger("d2.close:panel", {
          widgetView: this
        });
        this.context.viewStateModel.unset("d2selectedNode", {
          silent: true
        });
        this.context.viewStateModel.unset("properties", {
          silent: true
        });
      }
    },
    onBeforeDestroy: function() {
      var resizeEventName = this._getQulaifiedNameForEvents("resize");
      var resizeTableViewEventName = this._getQulaifiedNameForEvents("resize", "tableview");
      $(window).off(resizeEventName);
      $(window).off(resizeTableViewEventName);
    },
    _onResize: function() {
      if (this.tableView && this.$el.closest('div[role="tabpanel"]').hasClass("binf-active")) {
        if (!utils.isAndroid()) {
          this.tableView.trigger("dom:refresh");
        }
      }
    },
    _getQulaifiedNameForEvents: function(eventName, uiSelector) {
      var baseQualifiedEventName = eventName + "." + this.cid;
      return uiSelector ? baseQualifiedEventName + "." + uiSelector : baseQualifiedEventName;
    },
    getAvailableTableModes: function() {
      return [ {
        key: widgetConstants.TableModes.WRAP,
        configKey: "table-list-limited-columns",
        label: lang.tableWrapMode
      }, {
        key: widgetConstants.TableModes.NOWRAP,
        configKey: "table-list-pinned-columns",
        label: lang.tableNoWrapMode
      } ];
    },
    setTableMode: function(tableMode) {
      if (!_.contains([ widgetConstants.TableModes.WRAP, widgetConstants.TableModes.NOWRAP ], tableMode)) {
        return;
      }
      if (!this.tableSettings) {
        this.getTableSettings();
      }
      this._currentTableMode = tableMode;
      this.setMetadataTableView();
      this.render();
      this.tableSettings.save({
        tableMode: tableMode
      }, {});
    },
    getPreference: function() {
      if (!this.tableSettings) {
        this.getTableSettings();
      }
      return this.tableSettings.get("tableMode");
    },
    getTableSettings: function() {
      const tableSettingsId = "csui/widgets/nodestable:" + this.getTableSettingsId();
      if (!this.tableSettings) {
        const widgetSettingsModel = this.context.getCollection(WidgetSettingsCollectionFactory);
        this.tableSettings = widgetSettingsModel.get(tableSettingsId);
        if (!this.tableSettings) {
          const idAttribute = widgetSettingsModel.model.prototype.idAttribute;
          this._nodesTableSettings = widgetSettingsModel.add({
            [idAttribute]: tableSettingsId
          });
        }
      }
    },
    getTableSettingsId: function() {
      if (this.collection && this.collection.columnPreference) {
        return this.collection.columnPreference.options.widgetType + "_" + this.collection.columnPreference.options.widgetName;
      } else {
        return this.widgetInfo.widgetType + "_" + this.widgetInfo.widgetName;
      }
    }
  }, {
    enabled: function(options) {
      return _.contains([ constants.Types.DOCUMENT, constants.Types.EMAIL, constants.Types.RENDITION ], options.node.get("type"));
    }
  });
  _.extend(MetadataBaseTableView.prototype, LayoutViewEventsPropagationMixin);
  return MetadataBaseTableView;
});