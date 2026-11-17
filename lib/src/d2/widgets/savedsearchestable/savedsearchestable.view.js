/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/progressblocker/blocker", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitems.mask", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/utils/commands", "nuc/utils/log", "dctmw/controls/split.panel/split.panel.view", "d2/models/savedsearch/savedsearches", "d2/models/savedsearch/savedsearch.model", "d2/widgets/widgettable/widgettable.view", "d2/utils/constants", "d2/utils/contexts/factories/savedsearch.factory", "d2/utils/search.utils", "d2/widgets/savedsearchestable/impl/contentView/savedsearches.content.view", "d2/widgets/savedsearchestable/impl/explorer/explorer.view", "d2/widgets/savedsearchestable/impl/savedsearch.toolbaritems", "hbs!d2/widgets/savedsearchestable/impl/savedsearches.view", "i18n!d2/widgets/savedsearchestable/impl/nls/lang", "css!d2/widgets/savedsearchestable/impl/savedsearch.view" ], function(_, $, Backbone, Marionette, BlockingView, ToolItemsFactory, ToolItemsMask, LayoutViewEventsPropagationMixin, commands, log, SplitPanelView, SavedSearchCollection, SavedSearchModel, D2WidgetTable, constants, SavedSearchCollectionFactory, searchUtils, SavedSearchContentView, SavedSearchExplorerView, toolbarItems, template, lang) {
  "use strict";
  var SavedSearchView = Marionette.LayoutView.extend({
    className: "d2-savedsearch-widget-container",
    template: template,
    regions: {
      rgnPanelContainer: ".d2-savedsearch-widget"
    },
    constructor: function SavedSearchView(options) {
      this.context = options.context;
      this.connector = options.connector || this.context && this.context.getObject("connector");
      options.commands = commands;
      var node = this._createSavedSearchGroupNode();
      this._initializeParams(node);
      this.savedSearchCollection = options.context.getCollection(SavedSearchCollectionFactory, {
        node: node
      });
      this.savedSearchCollection.isSavedSearchCollection = true;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.listenTo(node, "request", this.blockActions).listenTo(node, "sync error", this.unblockActions);
    },
    initialize: function() {
      var me = this, node = this.savedSearchCollection.node;
      this._loadSearchConfig(node);
      this._setupExplorerView();
      this._setupContentView();
      this.listenTo(node, "change:id", _.bind(this.fetchCollection, this, false)).listenTo(this.savedSearchCollection, "sync", _.bind(this._toggleZeroStateContainer, this, true)).listenTo(this.savedSearchCollection, "error", function(collection, xhr) {
        if (collection instanceof SavedSearchCollection) {
          me._handleError(xhr);
        }
      });
      this.context && this.listenTo(this.context, "sync", this._onContextSync);
      if (node.get("id")) {
        node.fetch().done(this._updateColumnsCollection.bind(this)).fail(_.bind(this._handleError, this));
      } else {
        this._updateColumnsCollection();
      }
    },
    onRender: function() {
      if (!this.splitPanel) {
        this.splitPanel = new SplitPanelView({
          type: SplitPanelView.TYPES.TWO_WAY
        });
        this.rgnPanelContainer.show(this.splitPanel);
      }
      this._renderChildrenViews();
    },
    _renderChildrenViews: function() {
      if (this.splitPanel) {
        this.splitPanel.showPanelViews(this.explorerView, this.contentView);
      }
    },
    _setupExplorerView: function() {
      if (!this.explorerView) {
        this.explorerView = new SavedSearchExplorerView(_.defaults({
          context: this.context,
          connector: this.connector,
          container: this.container,
          blockingParentView: this,
          showBackButton: true,
          originatingView: this,
          savedSearchCollection: this.savedSearchCollection,
          tooltipBackButton: this._getBackButtonToolTip()
        }, this.options));
        this.listenTo(this.explorerView, "refresh:collection", this.refreshCollection).listenTo(this.explorerView, "navigation:back", this._onNavigationBack);
      }
    },
    _setupContentView: function() {
      this.contentView = new SavedSearchContentView(_.defaults({
        collection: this.savedSearchCollection,
        blockingParentView: this
      }, this.options));
      this.listenTo(this.contentView.tableView, "before:refresh:list:data", this.onBeforeListRefresh);
    },
    _updateColumnsCollection: function() {
      var node = this.savedSearchCollection.node;
      this.savedSearchCollection.updateTableColumns(node.isAvailablePublic());
    },
    onBeforeListRefresh: function() {
      var container = this.savedSearchCollection.node;
      if (container.get("id")) {
        container.fetch().fail(function() {
          log.error("failed to fetch the container model") && console.log(log.last);
        });
      }
      this.refreshTreeData();
    },
    refreshTreeData: function() {
      this.contentView.tableView.cancelTitleEdit();
      this.explorerView.refreshTreeData();
    },
    refreshCollection: function() {
      this.fetchCollection(true);
    },
    fetchCollection: function(refresh) {
      if (!refresh) {
        this.contentView.tableView.clearAllSelectedNodes();
      }
      this._refreshCurrentViewState();
      this.contentView.tableView.cancelTitleEdit();
      this.savedSearchCollection.fetch({
        reload: true,
        skipSWCache: refresh
      });
    },
    _initializeParams: function(node) {
      var private_category = constants.AdvancedSearch.CATEGORY_PRIVATE, widgetParams = this.getWidgetParamViewState();
      if (!widgetParams["group-id"]) {
        widgetParams["group-id"] = private_category;
        this.setWidgetParamViewState(widgetParams);
      }
      var id = widgetParams["group-id"], name = widgetParams["name"], data = {
        id: id,
        name: name
      };
      if (this._isRootCategoryGroupId(id)) {
        var hasPublicAccess = id !== private_category;
        name = hasPublicAccess ? lang.publicSearchLabel : lang.privateSearchLabel;
        data = {
          id: "",
          name: name,
          "search-category": id
        };
      }
      node.set(data);
    },
    _refreshCurrentViewState: function() {
      var node = this.savedSearchCollection.node, id = node.get("id") || node.get("search-category"), state = {
        "group-id": id
      };
      if (!this._isRootCategoryGroupId(id)) {
        state.name = node.get("name");
      }
      this.setWidgetParamViewState(state, node.get("id"));
    },
    _isRootCategoryGroupId: function(id) {
      return _.contains([ constants.AdvancedSearch.CATEGORY_PRIVATE, constants.AdvancedSearch.CATEGORY_PUBLIC ], id);
    },
    _getBackButtonToolTip: function() {
      return this.context.viewStateModel.getBackToTitle();
    },
    _createSavedSearchGroupNode: function() {
      var model = new SavedSearchModel({
        _is_saved_search_container: true,
        r_object_type: "d2c_query_category"
      }, {
        autofetch: true
      });
      model.connector = this.connector;
      return model;
    },
    _loadSearchConfig: function(node) {
      searchUtils.getSearchConfiguration({
        connector: this.connector
      }).done(function(searchConfig) {
        node.searchConfig = searchConfig;
      }).always(function() {
        if (!node.searchConfig) {
          log.error("search config either doesn't exist or failed to load") && console.log(log.last);
        }
      });
    },
    _handleError: function(request) {
      var errorCode = request.responseJSON && request.responseJSON.code;
      var statusCode = request.status;
      if (statusCode >= 400 && !_.contains([ "E_SEARCH_CATEGORY_EXISTS" ], errorCode)) {
        this.refreshTreeData();
        this._toggleZeroStateContainer(false);
      }
    },
    _toggleZeroStateContainer: function(show) {
      this.contentView.toggleZeroStateView(show);
    },
    getWidgetParamViewState: function() {
      var widgetParamMap = {}, widgetParam = this.context.viewStateModel.getViewState("widget_param");
      if (!widgetParam) {
        return {};
      }
      try {
        widgetParamMap = JSON.parse(widgetParam);
      } catch (err) {
        log.error("Error while getting widget_param from view state model", err) && console.log(log.last);
      }
      return widgetParamMap;
    },
    setWidgetParamViewState: function(data, containerId) {
      var viewStateModel = this.context.viewStateModel;
      viewStateModel.setViewState("widget_param", JSON.stringify(data), {
        encode: true
      });
      var sessionState = _.extend({}, viewStateModel.get(viewStateModel.CONSTANTS.SESSION_STATE));
      _.extend(sessionState, {
        id: containerId || ""
      });
      viewStateModel.unset(viewStateModel.CONSTANTS.SESSION_STATE, {
        silent: true
      });
      viewStateModel.set(viewStateModel.CONSTANTS.SESSION_STATE, sessionState);
    },
    _onContextSync: function() {
      var viewStateModel = this.context && this.context.viewStateModel;
      if (!this.viewStateModelHistoryIndex) {
        this.viewStateModelHistoryIndex = -1;
        var perspectiveHistory = viewStateModel.getHistory();
        if (perspectiveHistory && perspectiveHistory.length > 0) {
          this.viewStateModelHistoryIndex = perspectiveHistory.length - 1;
        }
      }
    },
    _onNavigationBack: function(e) {
      e && e.preventDefault();
      var cmdGoBack = commands.get("D2-Back");
      cmdGoBack && cmdGoBack.execute({
        context: this.context,
        restoreLastFragment: true,
        restoryHistoryIndex: this.viewStateModelHistoryIndex
      });
    }
  });
  _.extend(SavedSearchView.prototype, LayoutViewEventsPropagationMixin);
  return SavedSearchView;
});