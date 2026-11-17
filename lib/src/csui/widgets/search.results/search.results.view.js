/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/base", "csui/utils/url", "csui/utils/contexts/factories/search.query.factory", "csui/utils/contexts/factories/search.formquery.factory", "csui/utils/contexts/factories/search.results.factory", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/mixins/view.state/node.view.state.mixin", "csui/controls/mixins/view.state/node.selection.restore.mixin", "csui/controls/mixins/view.state/multi.node.fetch.mixin", "csui/widgets/search.results/impl/search.results.header.view", "csui/widgets/search.results/impl/standard/standard.search.results.view", "csui/widgets/search.results/impl/tabular/tabular.search.results.view", "csui/models/widget/search.results/search.metadata/search.columns", "csui/controls/table/table.view", "csui/models/nodechildrencolumn", "csui/controls/pagination/nodespagination.view", "csui/controls/progressblocker/blocker", "csui/widgets/search.results/toolbaritems", "csui/widgets/search.results/toolbaritems.masks", "csui/widgets/search.custom/impl/search.object.view", "csui/widgets/search.forms/search.form.view", "csui/utils/contexts/factories/search.settings.factory", "csui/controls/globalmessage/globalmessage", "i18n!csui/widgets/search.results/impl/nls/lang", "csui/controls/tableactionbar/tableactionbar.view", "csui/utils/contexts/factories/search.results.facets.factory", "csui/models/node/node.model", "csui/models/nodes", "csui/utils/commands/properties", "csui/utils/contexts/factories/user", "csui/behaviors/resizable/resizable.behavior", "csui/behaviors/default.action/default.action.behavior", "csui/utils/contexts/factories/search.metadata.factory", "csui/controls/toolbar/toolbar.command.controller", "hbs!csui/widgets/search.results/impl/search.results", "csui/utils/defaultactionitems", "csui/utils/commands", "csui/utils/namedlocalstorage", "csui/dialogs/modal.alert/modal.alert", "csui/controls/facet.panel/facet.panel.view", "csui/controls/facet.bar/facet.bar.view", "csui/utils/accessibility", "csui/controls/mixins/search.query/search.query.mixin", "csui/utils/contexts/factories/application.scope.factory", "csui/lib/handlebars.helpers.xif", "css!csui/widgets/search.results/impl/search.results", "csui/lib/jquery.mousehover", "csui/lib/jquery.redraw" ], function(module, _, $, Backbone, Marionette, base, Url, SearchQueryModelFactory, SearchFormQueryModelFactory, SearchResultsCollectionFactory, LayoutViewEventsPropagationMixin, NodeSelectionRestoreMixin, MultiNodeFetchMixin, NodeViewStateMixin, HeaderView, StandardSearchResultsView, TabularSearchResultsView, tableColumns, TableView, NodeChildrenColumnModel, PaginationView, BlockingView, toolbarItems, ToolbarItemsMasks, SearchObjectView, SearchFormView, SearchSettingsFactory, GlobalMessage, lang, TableActionBarView, SearchResultFacetCollectionFactory, NodeModel, NodeCollection, PropertiesCommand, UserModelFactory, ResizableBehavior, DefaultActionBehavior, SearchMetadataFactory, ToolbarCommandController, layoutTemplate, defaultActionItems, commands, NamedLocalStorage, ModalAlert, FacetPanelView, FacetBarView, Accessibility, SearchQueryMixin, ApplicationScopeModelFactory) {
  "use strict";
  var accessibleTable = Accessibility.isAccessibleTable(), STANDARD_VIEW = "StandardView", TABULAR_VIEW = "TabularView";
  var config = _.extend({
    enableFacetFilter: true,
    enableBreadcrumb: true,
    enableSearchSettings: true,
    showInlineActionBarOnHover: !accessibleTable,
    forceInlineActionBarOnClick: false,
    inlineActionBarStyle: "csui-table-actionbar-bubble",
    displayCount: "Always",
    csui: {
      fetchFacets: true
    },
    enableSaveSearchTools: true
  }, module.config());
  var defaultOptions = {
    showFacetPanel: true,
    urlParamsList: [ "order_by", "page", "filter", "cacheId" ]
  };
  var SearchResultsView = Marionette.LayoutView.extend({
    className: "csui-search-results binf-panel binf-panel-default initialLoading",
    template: layoutTemplate,
    templateHelpers: function() {
      var messages = {
        enableCustomSearch: this.enableCustomSearch,
        sidePanelHeader: lang.searchHeader
      };
      return {
        messages: messages,
        enableCustomSearch: this.enableCustomSearch,
        loadingMessage: this.loadingMessage,
        initialLoadMessage: this.initialLoadMessage,
        showFacetPanel: this.options.showFacetPanel !== false
      };
    },
    ui: {
      toolBarContainer: ".csui-search-tool-container",
      customSearchContainer: ".csui-search-results-custom",
      facetView: "#facetview",
      searchResultsContent: ".csui-search-results-content",
      searchResultsBody: ".csui-search-results-body",
      searchSidePanelHeader: ".csui-sidepanel-header",
      searchSidePanelHeading: ".csui-sidepanel-heading",
      searchSidePanel: ".csui-search-left-panel",
      loadingEle: ".csui-search-blocking",
      initialLoadingEle: ".csui-serch-reults-initial-load"
    },
    events: {
      "mouseup @ui.toggleDetails": "onToggleOrChangePageSize",
      "keypress @ui.toggleDetails": "onToggleOrChangePageSize",
      "mouseup .csui-paging-navbar > ul > li:not(.csui-overflow) > a": "onChangePage",
      "keypress .csui-paging-navbar > ul > li:not(.csui-overflow) > a": "onChangePage",
      "mouseup .csui-pagesize-menu ul.csui-dropdown-list a": "onToggleOrChangePageSize",
      "keypress .csui-pagesize-menu ul.csui-dropdown-list a": "onToggleOrChangePageSize"
    },
    regions: {
      headerRegion: "#header",
      resultsRegion: "#results",
      paginationRegion: "#pagination",
      standardHeaderRegion: "#csui-standard-header-view",
      customSearchRegion: "#csui-search-custom-container",
      facetBarRegion: "#facetbarview",
      facetRegion: "#facetview",
      tableRowSelectionToolbarRegion: ".csui-table-rowselection-toolbar"
    },
    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      ResizableBehavior: {
        behaviorClass: ResizableBehavior
      }
    },
    namedLocalStorage: new NamedLocalStorage("PrevSearchDisplayStyle"),
    getPageSize: function() {
      var pageSize = this.namedLocalStorage.get(this._createSearchDisplayStyleKey() + "_PrevSRPageSize");
      return pageSize || 10;
    },
    constructor: function SearchResultsView(options) {
      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
      options || (options = {});
      this.options = _.omit(_.defaults(options, options.basicSearchResultsView ? {
        enableSaveSearchTools: false,
        enableSearchSettings: false,
        enableBackButton: false,
        showFacetPanel: false,
        delayRestCommands: true,
        urlParamsList: [ "order_by", "page", "filter" ]
      } : defaultOptions), "basicSearchResultsView");
      this.options.disableSearch = this.applicationScope.get("id") === "search" ? true : false;
      this.context = options.context;
      options.pageSize = this.getPageSize();
      options.data || (options.data = {});
      this._addUrlParametersSupport(options.context);
      options.toolbarItems || (options.toolbarItems = toolbarItems);
      options.toolbarItemsMasks || (options.toolbarItemsMasks = new ToolbarItemsMasks());
      this.context = options.context;
      let searchQuery = this.context.getModel(SearchQueryModelFactory), searchFormQuery = this.context.getModel(SearchFormQueryModelFactory);
      this.showFacet = false;
      if (!options.query) {
        if (searchQuery && (searchQuery.get("query_id") || searchQuery.get("where")) || _.isEmpty(searchFormQuery?.attributes)) {
          options.query = searchQuery;
          searchQuery.isPerspectiveChange = false;
        } else {
          options.query = searchFormQuery;
          searchQuery.isPerspectiveChange = true;
        }
      }
      var storage = new NamedLocalStorage("search_bar_settings"), full_text = storage.get("full_text");
      if (!!full_text && (!options.query.get("modifier") || !options.query.get("lookfor"))) {
        options.query.set("modifier", full_text.modifier, {
          silent: true
        });
        options.query.set("lookfor", full_text.lookfor, {
          silent: true
        });
      }
      if (options.collection) {
        if (!options.collection.fetched) {
          this._originalScope = options.collection.getResourceScope();
        }
      } else {
        options.collection = this.context.getModel(SearchResultsCollectionFactory, options);
      }
      if (!options.collection.fetched) {
        options.collection.setResourceScope(SearchResultsCollectionFactory.getDefaultResourceScope());
        options.collection.setDefaultActionCommands(defaultActionItems.getAllCommandSignatures(commands));
        options.collection.setEnabledDelayRestCommands(true);
        if (options.collection.delayedActions) {
          this.listenTo(options.collection.delayedActions, "error", function(collection, request, options) {
            var error = new base.Error(request);
            GlobalMessage.showMessage("error", error.message);
          });
        }
      }
      options.collection.isSortOptionSelected = true;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      const collectionStateOptions = this.enableViewState ? this._restoreCollectionOptionsFromViewState() : {};
      collectionStateOptions.cacheId && this.collection.setCacheId(collectionStateOptions.cacheId);
      var doLoadSearchSettings = this.options.enableSearchSettings !== undefined ? this.options.enableSearchSettings : config.enableSearchSettings;
      if (doLoadSearchSettings) {
        var templateId = this.options.query ? this.options.query.get("query_id") : undefined;
        this.loadSearchSettings(templateId);
      }
      this.collection.selectedItems = new Backbone.Collection();
      this.initSelectionMixin(options);
      this.metadata = options.metadata || this.context.getCollection(SearchMetadataFactory, options);
      this.query = options.query;
      if (this.enableViewState && collectionStateOptions) {
        this.collection.setLimit(collectionStateOptions.top || 0, collectionStateOptions.skip || 10, false);
        collectionStateOptions.orderBy && this.collection.setOrder(collectionStateOptions.orderBy, false);
        collectionStateOptions.filter && this.collection.setFilter(collectionStateOptions.filter, false);
        this.query.viewStateCacheId = collectionStateOptions.cacheId;
      } else {
        this.collection.setLimit(0, options.pageSize, false);
      }
      this._toggleCustomSearch();
      this.commandController = new ToolbarCommandController({
        commands: commands
      });
      this.listenTo(this.commandController, "before:execute:command", this._beforeExecuteCommand);
      this.listenTo(this.commandController, "after:execute:command", this._toolbarCommandExecuted);
      var PrevSearchDisplayStyle = this.namedLocalStorage.get(this._createSearchDisplayStyleKey());
      this.collection.prevSearchDisplayStyle = PrevSearchDisplayStyle || STANDARD_VIEW;
      this.setSearchHeader();
      var self = this;
      this.listenTo(this.headerView, "go:back", function() {
        self.trigger("go:back");
      });
      this.tableColumns = options.tableColumns ? options.tableColumns : tableColumns.deepClone();
      this.listenTo(this.headerView, "toggle:filter", this._completeCommand);
      this.listenTo(this.headerView, "toggle:search", this._completeCommand);
      this.listenTo(this.headerView, "focus:filter", this._focusFilter);
      this.listenTo(this.headerView, "focus:search", this._focusSearchForm);
      this.listenTo(this.headerView, "open:facet:view", this.openFacetView);
      this.listenTo(this.headerView, "open:custom:view", this.openCustomView);
      this.listenTo(this.headerView, "correct:filter:aria", this.correctFilterAria);
      this.listenTo(this.headerView, "correct:search:aria", this.correctSearchFormAria);
      this.listenTo(this.headerView, "reload:searchForm", this._resetTargetView);
      this.listenTo(this.headerView, "readonly:filters", this._updateReadOnlyFilters);
      this.listenTo(this.headerView, "update:searchDefaults", this.updateSearchDefaults);
      this.listenTo(this.headerView, "export:status", function(isRunning) {
        if (isRunning) {
          this.blockActions();
        } else {
          this.unblockActions();
        }
      });
      this.listenTo(this.headerView, "render:table", _.bind(function() {
        this.columns = this.collection.searching && this.collection.searching.sortedColumns;
        this.getAdditionalColumns();
        this.trigger("update:table");
      }, this));
      this.listenTo(this.headerView, "toggle:description", function(args) {
        this.trigger("toggle:description", args.showDescriptions);
      });
      if (!options.collection.searchFacets) {
        options.collection.searchFacets = this.context.getModel(SearchResultFacetCollectionFactory, {
          options: {
            query: this.options.query,
            topCount: 1
          },
          detached: true
        });
      }
      this.facetFilters = options.collection.searchFacets;
      if (this.enableCustomSearch) {
        this.setCustomSearchView();
        this.listenTo(this.customSearchView, "change:title", this.updateHeaderTitle);
        this.listenTo(this.customSearchView, "model:updated", this.showHeaderSaveSearchTools);
      }
      this.loadingText = lang.loadingSearchResultMessage;
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      var perspective = this.context ? this.context.perspective : this.options && this.options.context ? this.options.context.perspective : undefined;
      if (perspective && _.isEmpty(perspective.get("options").left) && _.isEmpty(perspective.get("options").right)) {
        this.blockingView.showloadingWheel = true;
      }
      this.loadingMessage = this.blockingView.showloadingWheel ? lang.loadingSearchResultMessage : "";
      this.listenTo(this.settings, "sync", _.bind(function() {
        var isLocationColumnAvailable = false, selectedSettings = false;
        if (this.settings && this.settings.get("display")) {
          let selectedModelCollection = this.settings.get("selectedColumns")?.models;
          if (!selectedModelCollection && this.settings.get("display").display_regions && this.settings.get("display").display_regions.selected) {
            selectedModelCollection = this.settings.get("display").display_regions.selected.models;
          }
          isLocationColumnAvailable = _.findIndex(selectedModelCollection, function(column, index) {
            return column.get("key") === "OTLocation" || column.get("id") === "OTLocation";
          });
          selectedSettings = this.settings.get("display").summary_description && this.settings.get("display").summary_description.selected;
        }
        this.collection.isLocationColumnAvailable = isLocationColumnAvailable > -1;
        this.collection.selectedSettings = selectedSettings;
      }, this));
      this.listenTo(this.collection, "sync", function() {
        this.ui.loadingEle.addClass("binf-hidden");
        if (!this.enableCustomSearch) {
          this.$el.parents(".search-results-container").addClass("csui-global-search");
        }
      });
      this.listenToOnce(this.collection, "request", _.bind(function() {
        this.ui.initialLoadingEle.addClass("binf-hidden");
      }, this));
      this.listenTo(this.query, "change", function() {
        if (!this.headerView.enablePinnedColumns) {
          var ele = this.$el.find(".csui-search-right-header-container > .csui-search-header-action.csui-tabular-view");
          ele && ele.hasClass("csui-toggledView") && ele.removeClass("csui-toggledView");
        }
        this.previousSavedQuery = null;
        this.showFacet = false;
        if (this.enableViewState) {
          this.setViewStatePage(this.getPageSize(), 0);
          this.collection.setCacheId("");
          this.enableViewState && this.setViewStateCacheId("");
        }
        if (this.query.get("forcePerspectiveChange")) {
          this.facetBarView.collection.setFilter({
            facet: []
          });
          this.collection.setFilter({
            facet: []
          });
          return;
        }
        this.collection.isSortOptionSelected = true;
        this._updatePanels();
        if (doLoadSearchSettings) {
          var templateId = this.query ? this.query.get("query_id") : undefined;
          this.loadSearchSettings(templateId);
        }
        if (this.collection.isFetchable()) {
          var fetchFacets = config.csui && config.csui.fetchFacets;
          var removableFilters = _.filter(this.facetFilters.filters, function(filter) {
            return filter.readOnlyFilter === undefined;
          });
          if (this.facetFilters.removeFilter) {
            this.facetFilters.removeFilter(removableFilters, fetchFacets);
            this.facetFilters.fetched = false;
          } else {
            this.facetFilters.clearFilter(fetchFacets);
          }
          this.collection.fetch({
            error: _.bind(this.onSearchResultsFailed, this, options)
          });
          if (this.facetFilters.getStateFilterQueryValue) {
            const facetValues = this.facetFilters.getStateFilterQueryValue();
            this.collection.setFilter({
              facet: facetValues
            }, {
              fetch: false
            });
          }
          this.trigger("query:changed");
          this.trigger("queryTools:update");
          this.resetScrollToTop();
        }
        this.collection.selectedItems.reset([]);
        if (!this.enableCustomSearch) {
          this.stopListening(this.customSearchView, "change:title");
        }
      });
      this.listenTo(this.options.context, "request", this.blockActions).listenTo(this.options.context, "sync", this._persistState).listenTo(this.options.context, "error", this.unblockActions).listenTo(this.collection, "request", this.executePreProcess).listenTo(this.collection, "error", this.unblockActions).listenTo(this.collection, "destroy", this.unblockActions).listenTo(this.collection, "new:page", this.resetScrollToTop).listenTo(this.context.viewStateModel, "change:state", this.onViewStateChanged).listenTo(this.collection, "paging:change", this._pagingChanged).listenTo(this.collection, "limits:change", this._pagingChanged).listenTo(this.collection, "filter:change", this._collectionFilterChanged).listenTo(this.collection, "filter:clear", this._collectionFilterChanged).listenTo(this.collection, "orderBy:change", this._orderByChanged).listenTo(this.collection, "orderBy:clear", this._orderByChanged);
      var prevPageSize = this.namedLocalStorage && this.namedLocalStorage.get(this._createSearchDisplayStyleKey() + "_PrevSRPageSize");
      this.options.pageSize = prevPageSize ? prevPageSize : 10;
      this.setPagination();
      this.listenTo(this.collection, "sync", this.executeEndProcess);
      this.listenTo(this, "target:view:changed", this.executeEndProcess);
      this.listenTo(this, "properties:view:destroyed", this.onPropertiesViewDestroyed);
      this.listenTo(this, "permissions:view:destroyed", this.onPropertiesViewDestroyed);
      !base.isMozilla() && this.propagateEventsToRegions();
      this.onWinRefresh = _.bind(this.windowRefresh, this);
      $(window).on("resize.app", this.onWinRefresh);
      if (this.enableCustomSearch) {
        this.showSearch = true;
        this.showFacet = false;
        this.headerView.searchinit = true;
        this.headerView.filterinit = false;
        this.listenToOnce(this, "dom:refresh", _.bind(function() {
          if (this.$el.width() > 1023) {
            this.ui.searchSidePanel.addClass("csui-is-visible");
            this.ui.searchResultsBody.addClass("csui-search-results-body-right");
          } else {
            this.ui.searchSidePanel.addClass("search-side-panel-overlay");
            this.ui.searchSidePanel.addClass("search-side-panel-auto");
          }
        }, this));
      }
      this.listenTo(this, "doc:preview:generic:actions", this._highlightRow);
      this.listenToOnce(this.collection, "sync", function() {
        this.$el.removeClass("initialLoading");
      });
      this.initialLoadMessage = options.initialLoadMessage || lang.initialLoadMessage;
    },
    _initialize: function() {
      const initialFacetFilter = this.collection.filters && this.collection.filters.facet ? this.collection.filters.facet : undefined;
      initialFacetFilter && this.facetFilters.setFilter(initialFacetFilter, true);
      if (!_.isEmpty(initialFacetFilter) && !this.headerView.filterinit && !this.enableCustomSearch) {
        this.headerView.filterinit = true;
        this._completeCommand(this, true);
      }
    },
    _highlightRow: function(targetNode, HIGHLIGHT_CLASS_NAME) {
      $("." + HIGHLIGHT_CLASS_NAME).removeClass(HIGHLIGHT_CLASS_NAME);
      var rowIndex = _.findIndex(this.collection.models, function(node) {
        return node.get("id") === targetNode.get("id");
      });
      if (rowIndex !== -1) {
        var view = this.tableView || this.targetView, table = view && view.table ? view.table : undefined, targetRow = table === undefined ? table : $(table.row(rowIndex).node());
        targetRow && targetRow.addClass(HIGHLIGHT_CLASS_NAME);
      }
    },
    executePreProcess: function() {
      if (this.$el.is(":visible")) {
        var completeArea = this.el, resultsArea = completeArea.getElementsByClassName("csui-result-list")[0];
        if (resultsArea.getBoundingClientRect().left !== completeArea.getBoundingClientRect().left) {
          this.ui.loadingEle.addClass("csui-side-panel-exists");
        }
      }
      this.blockActions();
    },
    executeEndProcess: function() {
      if (!this.targetView) {
        this.setTargetView();
        this.paginationRegion.show(this.paginationView);
        this.targetView.trigger("set:inline:actionbar:events");
        this._setFacetBarView();
        if (this.collection.searching.facets && this.collection.searching.facets.selected) {
          if (this.facetBarView.collection.filters?.length < this.collection.searching.facets.selected.length) {
            var selectedFacets = this.collection.searching.facets.selected;
            for (var i = 0; i < selectedFacets.length; i++) {
              var facets = selectedFacets[i];
              var filters = [];
              _.each(facets.facet_items, function(item) {
                if (item) {
                  filters.push({
                    id: item.value
                  });
                }
              });
              var existingFilter = {
                id: facets.name,
                values: filters,
                readOnlyFilter: true
              };
              this.facetFilters.addFilter(existingFilter, false);
            }
            const readOnly = [], remaining = [];
            this.facetFilters.filters.forEach(function(filter) {
              if (filter.readOnlyFilter) {
                readOnly.push(filter);
              } else {
                remaining.push(filter);
              }
            });
            readOnly.length > 0 && (this.facetFilters.filters = readOnly.concat(remaining));
            this.facetFilters.ensureFetched();
          }
        }
        if (this.facetBarView && this.options.showFacetPanel !== false) {
          this.facetBarRegion.show(this.facetBarView);
          $(window).trigger("resize.facetview");
        }
        this.correctSearchFormAria(this);
      }
      if (this.collection.length) {
        this.columns = this.collection.searching && this.collection.searching.sortedColumns;
        this.getAdditionalColumns();
        this.enableViewState && this.setViewStateCacheId(this.collection.searching.cache_id);
        if ((!!this.collection.settings_changed || this.collection.columns.length !== this.collection.searching.sortedColumns.length) && (this.collection.prevSearchDisplayStyle === "TabularView" || this.collection.prevSearchDisplayStyle === "AllColumnsView")) {
          this.collection.columns = this.collection.searching.sortedColumns;
          this.trigger("update:table");
          this.collection.settings_changed = false;
        }
      }
      var self = this;
      this.listenTo(this.targetView, "column:customized", function(columnModel) {
        self._storeChangesIntoColumnCustomizations(self.columnCustomizings, columnModel);
        self.namedLocalStorage.set(this._createColumnStyleKey(), self.columnCustomizings);
      });
      this.updateActionToolBar();
      this.unblockSearchResultsActions();
    },
    _createColumnStyleKey: function() {
      var context = this.context || this.options && this.options.context, userID = context && context.getModel(UserModelFactory).get("id");
      return `columnCustomizing:${userID}`;
    },
    _mergeColumnCustomizations: function() {
      let columnCustomizings = this.columnCustomizings = this.namedLocalStorage.get(this._createColumnStyleKey());
      if (!this.columnCustomizings) {
        this.columnCustomizings = {};
        return;
      }
      if (!columnCustomizings) {
        columnCustomizings = {};
      }
      const columnKeys = Object.keys(columnCustomizings);
      this.columns.each(function(columnModel) {
        const columnKey = columnModel.get("column_key");
        const columnKeyOfCustomizing = _.indexOf(columnKeys, columnKey);
        if (columnKeyOfCustomizing >= 0) {
          const columnCustomizing = columnCustomizings[columnKey];
          _.each(TableView.columnCustomizationKeys, function(key) {
            const modelAttributeName = "customization_" + key;
            if (columnCustomizing[key]) {
              const value = {};
              value[modelAttributeName] = columnCustomizing[key];
              columnModel.set(value, {
                silent: true
              });
            }
          }, this);
        }
      });
    },
    _storeChangesIntoColumnCustomizations: function(columnCustomizings, columnModel) {
      if (columnCustomizings) {
        var changed = columnModel.changed;
        var columnKey = columnModel.get("column_key");
        if (!columnCustomizings[columnKey]) {
          columnCustomizings[columnKey] = {};
        }
        var columnCustomizing = columnCustomizings[columnKey];
        _.each(TableView.columnCustomizationKeys, function(key) {
          var modelAttributeName = "customization_" + key;
          if (changed.hasOwnProperty(modelAttributeName)) {
            if (changed[modelAttributeName]) {
              columnCustomizing[key] = changed[modelAttributeName];
            } else {
              delete columnCustomizing[key];
            }
          }
        }, this);
        if (Object.keys(columnCustomizing).length === 0) {
          delete columnCustomizings[columnKey];
        }
      }
    },
    unblockSearchResultsActions: function() {
      this.ui.loadingEle.removeClass("csui-side-panel-exists");
      this.ui.loadingEle.addClass("binf-hidden");
      this.unblockActions();
    },
    collectionEvents: {
      reset: "updateLayoutView"
    },
    updateLayoutView: function() {
      var prevPageSize = this.namedLocalStorage && this.namedLocalStorage.get(this._createSearchDisplayStyleKey() + "_PrevSRPageSize");
      prevPageSize = prevPageSize ? prevPageSize : 10;
      this.paginationView.options.pageSize = prevPageSize;
      this.paginationView.selectedPageSize = prevPageSize;
    },
    setPagination: function() {
      this.paginationView = new PaginationView({
        collection: this.collection,
        pageSize: this.options.pageSize,
        pageNumber: this.options.pageNumber,
        defaultDDList: [ 10, 25, 50, 100 ]
      });
      this.listenTo(this.paginationView, "pagesize:updated", function(paginationView) {
        this.paginationView.pageSize = paginationView.pageSize;
        this.namedLocalStorage.set(this._createSearchDisplayStyleKey() + "_PrevSRPageSize", this.paginationView.pageSize);
      });
      return true;
    },
    onToggleOrChangePageSize: function(event) {
      if (event.type === "keypress" && (event.keyCode === 13 || event.keyCode === 32) || event.type === "mouseup") {
        this.collection.isSortOptionSelected = true;
      }
    },
    onChangePage: function(event) {
      var targetPageTab = $(event.currentTarget), pageNum = parseInt(targetPageTab.attr("data-pageid"), 10);
      if (pageNum + 1 !== this.paginationView.currentPageNum) {
        this.onToggleOrChangePageSize(event);
      }
    },
    _persistState: function() {
      this.unblockActions();
    },
    loadSearchSettings: function(templateId) {
      this.options.templateId = templateId;
      if (this.settings && this.settings.options) {
        this.settings.options.templateId = templateId;
      }
      this.settings = this.options.settings || this.context.getCollection(SearchSettingsFactory, this.options);
      this.settings.fetch();
    },
    _createSearchDisplayStyleKey: function() {
      var context = this.context || this.options && this.options.context, srcUrl = new Url().getAbsolute(), userID = context && context.getModel(UserModelFactory).get("id"), hostname;
      if (srcUrl == "undefined" || srcUrl == "null") {
        hostname = !!srcUrl && !!userID ? srcUrl + userID : "defaultSearchDisplayStyle";
      } else {
        hostname = srcUrl && srcUrl.split("//")[1] && srcUrl.split("//")[1].split("/")[0].split(":")[0] + userID;
      }
      return hostname;
    },
    setTargetView: function() {
      var currentTemplate = accessibleTable ? "AllColumnsView" : this.collection.prevSearchDisplayStyle;
      if (currentTemplate === "AllColumnsView" && !this.headerView.enablePinnedColumns) {
        this.collection.enablePinnedColumnsView = false;
        currentTemplate = "TabularView";
      } else {
        this.collection.enablePinnedColumnsView = currentTemplate === "AllColumnsView";
      }
      this.columns = this.collection.searching && this.collection.searching.sortedColumns;
      if (accessibleTable) {
        this.getAdditionalColumns();
      }
      this.collection.columns = this.columns ? this.columns : this.tableColumns;
      if (this.settings && this.settings.get("display")) {
        var selectedSummary = this.settings.get("display").summary_description.selected;
        this.showSummaryOnly = selectedSummary === "SO" ? true : false;
      }
      if (currentTemplate === TABULAR_VIEW || currentTemplate === "AllColumnsView") {
        this.ui.toolBarContainer.addClass("binf-hidden");
        this.targetView = this.setTabularSearchView();
        this.targetView.trigger("set:tablerow:assets");
        this.tableView = this.targetView;
      } else {
        this.ui.toolBarContainer.removeClass("binf-hidden");
        this.targetView = this.setStandardSearchView();
        this.tableView = undefined;
      }
      if (currentTemplate === "AllColumnsView") {
        this.targetView.$el.addClass("csui-not-in-flex-container");
      }
      this.resultsRegion.show(this.targetView, this);
      if (currentTemplate === STANDARD_VIEW) {
        this.standardHeaderRegion.show(this.targetView.standardHeaderView);
        this.targetView.standardHeaderView._removeAllSelections();
      } else {
        this.trigger("toggle:description", this.headerView.showDescription);
      }
    },
    updateSearchDefaults: function() {
      if (this.customSearchView) {
        let templateId = this.customSearchView.defaultFormValues.templateId;
        this.customSearchView.defaultFormValues = _.extend(structuredClone(this.customSearchView.model.get("data")), templateId);
      }
    },
    _updateReadOnlyFilters: function() {
      _.each(this.facetFilters.filters, function(filter) {
        filter.readOnlyFilter = true;
      });
      this.facetFilters.trigger("set:readonly");
    },
    _resetTargetView: function() {
      this.targetView.trigger("destroy:header:view");
      this.targetView.destroy();
      this.targetView = undefined;
      this.resultsRegion.empty();
      this.setTargetView();
      this.executeEndProcess();
      this.resetScrollToTop();
    },
    setStandardSearchView: function() {
      var args = _.extend(this.options, {
        collection: this.collection,
        originatingView: this,
        headerEle: this.ui.toolBarContainer,
        context: this.context,
        metadata: this.metadata
      });
      return new StandardSearchResultsView(args);
    },
    setTabularSearchView: function() {
      var args = _.extend(this.options, {
        collection: this.collection,
        columns: this.columns,
        tableColumns: this.tableColumns,
        originatingView: this,
        container: this.container,
        defaultActionController: this.defaultActionController,
        config: config,
        customLabels: {
          emptyTableText: lang.noSearchResultMessage
        }
      });
      return new TabularSearchResultsView(args);
    },
    _focusFilter: function(view) {
      !!view && view.headerView.ui.filter.trigger("focus");
      this.correctFilterAria(view);
      var tabElements = this.facetView && this.facetView.$(".csui-facet");
      if (tabElements && tabElements.length > 0) {
        tabElements.prop("tabindex", 0);
      }
      view.headerView.ui.filter.attr({
        tabindex: 0
      });
    },
    _focusSearchForm: function(view) {
      !!view && view.headerView.ui.search.trigger("focus");
      this.correctSearchFormAria(view);
      var tabElements = this.customSearchView && this.customSearchView.$(".csui-saved-search-form");
      if (tabElements && tabElements.length > 0) {
        tabElements.prop("tabindex", 0);
      }
      view.headerView.ui.search.attr({
        tabindex: 0
      });
    },
    correctFilterAria: function(view) {
      if (!!view && !!view.headerView) {
        if (this.ui.searchSidePanel.hasClass("csui-is-visible") && !this.showSearch) {
          view.headerView.ui.filter.attr({
            title: lang.filterCollapseTooltip,
            arialabel: lang.filterCollapseAria,
            tabindex: 0
          });
        } else {
          view.headerView.ui.filter.attr({
            title: lang.filterExpandTooltip,
            arialabel: lang.filterExpandAria
          });
        }
      }
    },
    correctSearchFormAria: function(view) {
      if (!!view && !!view.headerView) {
        if (this.ui.searchSidePanel.hasClass("csui-is-visible") && !this.showFacet) {
          view.headerView.ui.search.attr({
            title: lang.searchFormCollapseTooltip,
            arialabel: lang.searchFormCollapseAria,
            tabindex: 0
          });
        } else {
          view.headerView.ui.search.attr({
            title: lang.searchFormExpandTooltip,
            arialabel: lang.searchFormExpandAria
          });
        }
      }
    },
    onSearchResultsFailed: function(model, request, message) {
      var error = new base.RequestErrorMessage(message);
      ModalAlert.showError(error.toString());
    },
    resetScrollToTop: function() {
      var scrollContainer = this.$("#results");
      scrollContainer.scrollTop(0);
    },
    updateActionToolBar: function() {
      if (this.collection.length === 0) {
        this.ui.toolBarContainer.addClass("binf-hidden");
        if (!this.enableCustomSearch) {
          this.ui.customSearchContainer.addClass("binf-hidden");
        }
      } else if (this.collection.prevSearchDisplayStyle === "StandardView") {
        this.ui.toolBarContainer.removeClass("binf-hidden");
        if (this.ui.customSearchContainer && this.ui.customSearchContainer.hasClass("binf-active")) {
          this.ui.customSearchContainer.removeClass("binf-hidden");
        }
      }
    },
    openVersionHistory: function(args) {
      var nodes = new NodeCollection();
      nodes.push(args.model);
      var status = {
        nodes: nodes,
        container: args.model.collection.node,
        collection: args.model.collection,
        selectedTab: new Backbone.Model({
          title: "Versions"
        })
      };
      status = _.extend(status, {
        originatingView: this
      });
      var propertiesCmd = new PropertiesCommand();
      propertiesCmd.execute(status, this.options).always(function(args) {});
    },
    onPropertiesViewDestroyed: function() {
      this.onMetadataNavigationViewDestroyed();
      this.headerView.updateHeader();
      var showDescription = this.namedLocalStorage.get(this._createSearchDisplayStyleKey() + "_showDescription");
      if (this.collection.prevSearchDisplayStyle === TABULAR_VIEW) {
        this.headerView.updateToggleDescription();
        this.tableView && this.tableView.render();
      }
      this.paginationView && this.paginationView.collectionChange();
    },
    onPermissionViewDestroyed: function() {
      this.onPropertiesViewDestroyed();
    },
    onMetadataNavigationViewDestroyed: function() {
      if (!!this.collection.inMetadataNavigationView && this.isTabularView) {
        this.collection.inMetadataNavigationView = false;
      }
    },
    _toggleCustomSearch: function() {
      this.enableCustomSearch = !!this.options.customSearchViewModel || !!this.options.customSearchView || !!this.query.get("query_id");
      if (this.enableCustomSearch) {
        this.$el.find("#csui-search-custom-container").addClass("csui-search-custom-container");
        this.$el.find("#csui-search-custom-results").addClass("csui-search-custom-results");
        this.$el.find(".csui-search-custom-tab").addClass("binf-active");
        this.$el.find(".csui-search-custom-tab > a").attr("aria-selected", "true");
        var tabElements = this.customSearchView && this.customSearchView.$(".csui-saved-search-form");
        if (tabElements && tabElements.length > 0) {
          tabElements.prop("tabindex", -1);
        }
        this.headerView && this.headerView.ui.search.attr({
          tabindex: 0
        });
      } else {
        if (this.customSearchView && this.query.get("where")) {
          this.customSearchRegion.empty();
          this.$el.find("#csui-search-custom-container").removeClass("csui-search-custom-container");
          this.$el.find("#csui-search-custom-results").removeClass("csui-search-custom-results");
        }
      }
    },
    _updatePanels: function() {
      this._toggleCustomSearch();
      if (!this.enableCustomSearch) {
        this.headerView._filterStateIsOn = false;
        if (this.ui.searchSidePanel.hasClass("csui-is-visible")) {
          var view = this;
          this.ui.searchSidePanel.one(this._transitionEnd(), function() {
            view.$el.find(".csui-search-results-custom").addClass("binf-hidden");
            view.$el.find(".csui-search-left-panel-tabs").addClass("binf-hidden");
            if (!view.ui.searchSidePanel.hasClass("csui-is-visible")) {
              view.ui.loadingEle.removeClass("csui-side-panel-exists");
              view.ui.searchSidePanel.addClass("csui-is-hidden");
            }
            view.ui.facetView.removeClass("binf-hidden");
          });
          this.ui.searchResultsBody.removeClass("csui-search-results-body-right");
          this.ui.searchSidePanel.removeClass("csui-is-visible");
        } else {
          this.$el.find(".csui-search-results-custom").addClass("binf-hidden");
          this.$el.find(".csui-search-left-panel-tabs").addClass("binf-hidden");
          this.ui.facetView.removeClass("binf-hidden");
        }
      } else {
        this.headerView._filterStateIsOn = false;
        this.headerView._searchStateIsOn = true;
        this.$el.find(".csui-search-results-custom").removeClass("binf-hidden");
        this.$el.find(".csui-search-left-panel-tabs").removeClass("binf-hidden");
        this.ui.searchResultsBody.addClass("csui-search-results-body-right");
      }
      if (this.headerView) {
        this.headerView.options.useCustomTitle = this.enableCustomSearch;
      }
      if (this.facetView) {
        this.facetView.options.data.showTitle = !this.enableCustomSearch;
        this.facetView.render();
      }
    },
    openCustomView: function(e) {
      if (this.enableCustomSearch) {
        this.ui.facetView.addClass("binf-hidden");
        this.$el.find(".csui-search-results-custom").removeClass("binf-hidden");
        this.$el.find(".csui-search-facet-tab").removeClass("binf-active");
        this.$el.find(".csui-search-facet-tab > a").removeAttr("aria-selected");
        this.$el.find(".csui-search-custom-tab").addClass("binf-active");
        this.$el.find(".csui-search-custom-tab > a").attr("aria-selected", "true");
      }
    },
    openFacetView: function(e) {
      if (this.enableCustomSearch) {
        this.facetFilters.ensureFetched();
        this._ensureFacetPanelViewDisplayed();
        this.$el.find(".csui-search-results-custom").addClass("binf-hidden");
        this.ui.facetView.removeClass("binf-hidden");
        this.$el.find(".csui-search-custom-tab").removeClass("binf-active");
        this.$el.find(".csui-search-custom-tab > a").removeAttr("aria-selected");
        this.$el.find(".csui-search-facet-tab").addClass("binf-active");
        this.$el.find(".csui-search-facet-tab > a").attr("aria-selected", "true");
        this.facetView.triggerMethod("dom:refresh");
      }
    },
    onDestroy: function() {
      $(window).off("resize.app", this.onWinRefresh);
      if (this._originalScope) {
        this.options.collection.setResourceScope(this._originalScope);
      }
      this.tableView && this.tableView.destroy();
    },
    windowRefresh: function() {
      this.facetView && this.facetView.triggerMethod("dom:refresh");
      this.targetView && this.targetView.triggerMethod("dom:refresh");
      var panelPosition = this.ui.searchSidePanel.css("position");
      if (panelPosition != "absolute") {
        if (this.$el.width() > 1023 && this.ui.searchSidePanel.hasClass("search-side-panel-overlay")) {
          this.ui.searchSidePanel.removeClass("search-side-panel-overlay");
          if (this.ui.searchSidePanel.hasClass("search-side-panel-auto")) {
            this.ui.searchSidePanel.removeClass("search-side-panel-auto");
            this._completeCommand(this, true);
          }
        }
      } else if (!this.ui.searchSidePanel.hasClass("search-side-panel-auto") && !this.ui.searchSidePanel.hasClass("search-side-panel-overlay")) {
        this.ui.searchSidePanel.addClass("search-side-panel-overlay");
        if (this.ui.searchSidePanel.hasClass("csui-is-visible")) {
          this.ui.searchSidePanel.addClass("search-side-panel-auto");
          this._completeCommand(this, true);
        }
      }
    },
    setSearchHeader: function() {
      var showSearchSettingsButton = this.options.enableSearchSettings !== undefined ? this.options.enableSearchSettings : config.enableSearchSettings, saveSearchTools = this.options.enableSaveSearchTools !== undefined ? this.options.enableSaveSearchTools : config.enableSaveSearchTools;
      this.headerView = new HeaderView({
        collection: this.collection,
        filter: this.options.searchString,
        context: this.options.context,
        enableBackButton: this.options.enableBackButton,
        backButtonToolTip: this.options.backButtonToolTip,
        enableFacetFilter: config.enableFacetFilter && this.options.showFacetPanel,
        useCustomTitle: this.enableCustomSearch,
        commands: commands,
        originatingView: this,
        titleView: this.options.titleView,
        localStorage: this.namedLocalStorage,
        enableSearchSettings: showSearchSettingsButton,
        settings: !!this.settings ? this.settings : false,
        saveSearchTools: saveSearchTools
      });
      return true;
    },
    getSettings: function() {
      return this.settings;
    },
    setCustomSearchView: function() {
      if (!this.query.get("enableSearchForm")) {
        this.customSearchView = this.options.customSearchView || new SearchObjectView({
          context: this.options.context,
          savedSearchQueryId: this.query.get("query_id"),
          customValues: this.query,
          parentView: this,
          query: this.query,
          model: this.options.customSearchViewModel,
          disableSearch: this.options.disableSearch,
          showResetButton: this.options.hasOwnProperty("showResetButton") ? this.options.showResetButton : true
        });
      } else {
        this.customSearchView = this.options.customSearchView || new SearchFormView({
          context: this.options.context,
          searchFormId: this.query.get("query_id"),
          customValues: this.query,
          parentView: this,
          query: this.query,
          model: this.options.customSearchViewModel,
          disableSearch: this.options.disableSearch,
          showResetButton: this.options.hasOwnProperty("showResetButton") ? this.options.showResetButton : true
        });
      }
      return true;
    },
    getAdditionalColumns: function() {
      if (accessibleTable) {
        var selectedSettings = this.headerView && this.headerView.selectedSettings;
        selectedSettings = selectedSettings ? selectedSettings : this.settings && this.settings.get("display").summary_description.selected;
        switch (selectedSettings) {
         case "SD":
         case "SP":
         case "DP":
          {
            if (this.tableView && !this.tableView.columns.findWhere({
              column_key: "search_description"
            }) || !this.columns.findWhere({
              column_key: "search_description"
            })) {
              this.getDescriptionColumn();
            }
            if (this.tableView && !this.tableView.columns.findWhere({
              column_key: "summary"
            }) || !this.columns.findWhere({
              column_key: "summary"
            })) {
              this.getSummaryColumn();
            }
            break;
          }

         case "SO":
          {
            this.removeDescriptionColumn();
            if (this.tableView && !this.tableView.columns.findWhere({
              column_key: "summary"
            }) || !this.columns.findWhere({
              column_key: "summary"
            })) {
              this.getSummaryColumn();
            }
            break;
          }

         case "DO":
          {
            this.removeSummaryColumn();
            if (this.tableView && !this.tableView.columns.findWhere({
              column_key: "search_description"
            }) || !this.columns.findWhere({
              column_key: "search_description"
            })) {
              this.getDescriptionColumn();
            }
            break;
          }

         case "NONE":
          {
            this.removeSummaryColumn();
            this.removeDescriptionColumn();
          }
        }
      }
    },
    getDescriptionColumn: function() {
      this.columns.push(new NodeChildrenColumnModel({
        column_key: "search_description",
        name: lang.descriptionColumnTitle,
        sortable: false,
        permanentColumn: true,
        type: -1,
        definitions_order: 505
      }));
    },
    getSummaryColumn: function() {
      this.columns.push(new NodeChildrenColumnModel({
        column_key: "summary",
        name: lang.summaryColumnTitle,
        sortable: false,
        permanentColumn: true,
        type: -1,
        definitions_order: 506
      }));
    },
    removeDescriptionColumn: function() {
      if (this.tableView && this.tableView.columns.findWhere({
        column_key: "search_description"
      })) {
        this.tableView.columns.findWhere({
          column_key: "search_description"
        }).destroy();
      }
    },
    removeSummaryColumn: function() {
      if (this.tableView && this.tableView.columns.findWhere({
        column_key: "summary"
      })) {
        this.tableView.columns.findWhere({
          column_key: "summary"
        }).destroy();
      }
    },
    _beforeExecuteCommand: function(args) {
      !!this.collection.selectedItems && this.collection.selectedItems.each(function(model) {
        model.collection = args.status.collection;
      });
    },
    _toolbarCommandExecuted: function(context) {
      if (context && context.commandSignature) {
        this.targetView && this.targetView.trigger("update:tool:items");
        if (!!context.command && !!context.command.allowCollectionRefetch && this.collection.totalCount > this.collection.topCount) {
          this.collection.fetch();
        }
        switch (context.commandSignature) {
         case "Move":
         case "RemoveCollectedItems":
         case "Delete":
          this.collection.selectedItems.remove(this.collection.selectedItems.models, {
            silent: true
          });
          var collectionData = this.collection;
          if (collectionData.skipCount !== 0 && collectionData.totalCount === collectionData.skipCount) {
            this.collection.setLimit(collectionData.skipCount - collectionData.topCount, this.collection.topCount, false);
            this.collection.fetch();
          } else if (collectionData.totalCount < collectionData.topCount) {
            this.collection.sync();
          }
          break;
        }
      }
    },
    _updateToolbarActions: function() {
      this.targetView && this.targetView.trigger("set:tablerow:assets");
    },
    _showInlineActionBar: function(args) {
      if (!!args) {
        this._savedHoverEnterArgs = null;
        var parentId = args.node.get("parent_id");
        if (parentId instanceof Object) {
          parentId = args.node.get("parent_id").id;
        }
        var parentNode = new NodeModel({
          id: parentId
        }, {
          connector: args.node.connector
        });
        this.inlineToolbarView = new TableActionBarView(_.extend({
          context: this.options.context,
          commands: commands,
          delayedActions: this.collection.delayedActions,
          collection: this.options.toolbarItems.inlineToolbar || [],
          toolItemsMask: this.options.toolbarItemsMasks.toolbars.inlineToolbar,
          container: parentNode,
          containerCollection: this.collection,
          model: args.node,
          originatingView: this,
          notOccupiedSpace: 0
        }, this.options.toolbarItems.inlineToolbar && this.options.toolbarItems.inlineToolbar.options));
        this.listenTo(this.inlineToolbarView, "after:execute:command", this._toolbarCommandExecuted);
        this.inlineToolbarView.render();
        this.listenTo(this.inlineToolbarView, "destroy", function() {
          this.inlineToolbarView = undefined;
          if (this._savedHoverEnterArgs) {
            this._showInlineActionBarWithDelay(this._savedHoverEnterArgs);
          }
        }, this);
        $(args.target).append(this.inlineToolbarView.$el);
        this.inlineToolbarView.triggerMethod("show");
      }
    },
    _showInlineActionBarWithDelay: function(_view, args) {
      if (this._showInlineActionbarTimeout) {
        clearTimeout(this._showInlineActionbarTimeout);
      }
      var self = this;
      this._showInlineActionbarTimeout = setTimeout(function() {
        self._showInlineActionbarTimeout = undefined;
        self._showInlineActionBar.call(self, args);
      }, 200);
    },
    _actionBarShouldDestroy: function(_view, args) {
      if (this._showInlineActionbarTimeout) {
        clearTimeout(this._showInlineActionbarTimeout);
        this._showInlineActionbarTimeout = undefined;
      }
      if (this.inlineToolbarView) {
        this.inlineToolbarView.destroy();
      }
    },
    _destroyInlineActionBar: function() {
      if (this.inlineToolbarView) {
        this.inlineToolbarView.destroy();
        this.inlineToolbarView = undefined;
      }
    },
    _getQueryPermissions: function(queryId) {
      var qId = queryId, self = this;
      this.searchQueryAction(qId).done(function(res) {
        self.hasEditPermsForSearchQuery = res.results?.[qId]?.data?.updatesearchbroker !== undefined;
      }).fail(function() {
        self.hasEditPermsForSearchQuery = false;
      });
    },
    onRender: function() {
      var self = this;
      this.headerRegion.show(this.headerView);
      this.options.query.get("query_id") && !this.options.query.get("enableSearchForm") && this._getQueryPermissions(this.options.query.get("query_id"));
      if (this.enableCustomSearch) {
        this.headerView._filterStateIsOn = false;
        this.headerView._searchStateIsOn = true;
        this.customSearchRegion.show(this.customSearchView);
        this.ui.facetView.addClass("binf-hidden");
        this.ui.searchSidePanel.removeClass("csui-is-hidden");
        this.ui.searchSidePanelHeader.removeClass("binf-hidden");
        this.ui.searchSidePanel.addClass("csui-is-visible");
        this.correctSearchFormAria(this);
      } else {
        this.headerView._filterStateIsOn = false;
        this.ui.searchSidePanel.removeClass("csui-is-visible");
        this.ui.searchSidePanelHeader.addClass("binf-hidden");
        var view = this;
        this.ui.searchSidePanel.one(this._transitionEnd(), function() {
          if (!view.ui.searchSidePanel.hasClass("csui-is-visible")) {
            view.ui.searchSidePanel.addClass("csui-is-hidden");
          }
        });
      }
      this._toggleCustomSearch();
      this.triggerMethod("dynamicDomLoaded", self.ui.searchSidePanel, this);
      this._initialize();
    },
    _ensureFacetPanelViewDisplayed: function() {
      if (this.facetView === undefined && this.options.showFacetPanel !== false) {
        this._setFacetPanelView();
        this.facetRegion.show(this.facetView);
      }
    },
    _setFacetPanelView: function() {
      this.facetView = new FacetPanelView({
        collection: this.facetFilters,
        blockingLocal: true,
        showTitle: !this.enableCustomSearch,
        displayCountProps: this._getDisplayCountProps()
      });
      this.listenTo(this.facetView, "remove:filter", this._removeFacetFilter).listenTo(this.facetView, "remove:all", this._removeAll).listenTo(this.facetView, "apply:filter", this._checkSelectionAndApplyFilter);
    },
    _getDisplayCountProps: function() {
      let displayCountProps = {
        showCount: true
      }, userHasSystemAdminRights = this.options.context?._user?.get("privilege_system_admin_rights");
      if (!userHasSystemAdminRights) {
        switch (config.displayCount) {
         case "Never":
          {
            displayCountProps.showCount = false;
            break;
          }

         default:
          {
            let displayCount = config.displayCount.split(">")[1];
            !!displayCount && parseInt(displayCount) && (displayCountProps.threshold = parseInt(displayCount));
          }
        }
      }
      return displayCountProps;
    },
    _removeFacetPanelView: function() {
      this.facetRegion.empty();
      this.facetView = undefined;
    },
    _setFacetBarView: function() {
      this.facetBarView = new FacetBarView({
        collection: this.facetFilters,
        showSaveFilter: false
      });
      this.listenTo(this.facetBarView, "remove:filter", this._removeFacetFilter).listenTo(this.facetBarView, "remove:all", this._removeAll).listenTo(this.facetBarView, "facet:bar:visible", this._handleFacetBarVisible).listenTo(this.facetBarView, "facet:bar:hidden", this._handleFacetBarHidden);
    },
    _checkSelectionAndApplyFilter: function(filter) {
      if (this.collection.selectedItems.length) {
        ModalAlert.confirmQuestion(_.str.sformat(lang.dialogTemplate, lang.dialogTitle), lang.dialogTitle, {}).done(_.bind(function() {
          this.collection.selectedItems.reset([]);
          this._addToFacetFilter(filter);
        }, this));
      } else {
        this._addToFacetFilter(filter);
      }
    },
    _collectionFilterChanged: function() {
      if (this.facetBarView.collection.filters?.length) {
        let selectedFilters = this.facetBarView.collection.filters.filter(function(filter) {
          return !filter.readOnlyFilter;
        });
        this.enableViewState && this.setViewStateFilter({
          facet: selectedFilters
        });
      } else this.enableViewState && this.setViewStateFilter(this.collection.getFilterAsObject());
    },
    _addToFacetFilter: function(filter) {
      this.facetFilters.addFilter(filter, false);
      const facetValues = this.facetFilters.getStateFilterQueryValue();
      this.collection.setFilter({
        facet: facetValues
      }, {
        fetch: false
      });
      this.collection.setDefaultPageNum();
      this.collection.trigger("paging:change");
      this._fetchCollectionAfterFilterUpdate();
      this.resetScrollToTop();
    },
    _removeFacetFilter: function(filter) {
      this.facetFilters.removeFilter(filter, false);
      const facetValues = this.facetFilters.getStateFilterQueryValue();
      this.collection.setFilter({
        facet: facetValues
      }, {
        fetch: false
      });
      this.collection.setDefaultPageNum();
      this.collection.trigger("paging:change");
      this._fetchCollectionAfterFilterUpdate();
      this.resetScrollToTop();
    },
    _removeAll: function() {
      this.facetFilters.clearFilter(false);
      const facetValues = this.facetFilters.getStateFilterQueryValue();
      this.collection.setFilter({
        facet: facetValues
      }, {
        fetch: false
      });
      this.collection.setDefaultPageNum();
      this.collection.trigger("paging:change");
      this._fetchCollectionAfterFilterUpdate();
      this.resetScrollToTop();
    },
    _fetchCollectionAfterFilterUpdate: function() {
      this.collection.fetch({
        fetchFacets: true,
        success: _.bind(function() {
          this.trigger("queryTools:update");
        }, this)
      });
    },
    _completeCommand: function(view, flag) {
      var panelPosition = view.ui.searchSidePanel.css("position"), self = this;
      if (panelPosition === "absolute" && flag === undefined) {
        view.ui.searchSidePanel.removeClass("search-side-panel-auto");
        view.ui.searchSidePanel.addClass("search-side-panel-overlay");
      }
      view.showSidePanel = !view.ui.searchSidePanel.hasClass("csui-is-visible");
      this.showSearch = this.headerView.searchinit && !this.showSearch;
      this.showFacet = this.headerView.filterinit && !this.showFacet;
      if (this.showSearch || this.showFacet || view.showSidePanel) {
        view.facetFilters.ensureFetched();
        view._ensureFacetPanelViewDisplayed();
        view.ui.searchSidePanel.removeClass("csui-is-hidden");
        this.ui.searchSidePanelHeading.text(this.showSearch ? lang.searchHeader : lang.filterHeader);
        this.facetView?.trigger("data:synced");
        view.ui.searchSidePanel.one(view._transitionEnd(), function() {
          if (base.isMSBrowser()) {
            if (view.ui.searchSidePanel.hasClass("csui-is-visible")) {
              view.ui.searchResultsBody.addClass("csui-search-results-body-right");
            }
          }
          view.triggerMethod("dom:refresh");
          if (view.paginationView) {
            view.paginationView.triggerMethod("dom:refresh");
          }
          self.targetView && self.targetView.triggerMethod("dom:refresh");
          view.facetView && view.facetView.triggerMethod("dom:refresh");
          self.targetView && self.targetView.trigger("facet:opened", true);
        }).addClass("csui-is-visible");
        if (!base.isMSBrowser()) {
          if (view.ui.searchSidePanel.hasClass("csui-is-visible")) {
            view.ui.searchResultsBody.addClass("csui-search-results-body-right");
          }
        }
        self.headerView.setFacetOpened(this.showFacet);
        self.headerView.setSearchOpened(this.showSearch);
      } else {
        this.showFacet = false;
        this.showSearch = false;
        view.ui.searchSidePanel.one(view._transitionEnd(), function() {
          if (!view.ui.searchSidePanel.hasClass("csui-is-visible")) {
            view.ui.searchSidePanel.addClass("csui-is-hidden");
          }
          view.triggerMethod("dom:refresh");
          view._removeFacetPanelView();
          if (view.paginationView) {
            view.paginationView.triggerMethod("dom:refresh");
          }
          self.targetView && self.targetView.triggerMethod("dom:refresh");
          self.headerView.currentlyFocusedElement();
          self.headerView.setFacetOpened(this.showFacet);
          self.headerView.setSearchOpened(this.showSearch);
          self.headerView.trigger(self.headerView.searchinit ? "focus:search" : "focus:filter", self);
          self.targetView && self.targetView.trigger("facet:opened", false);
        }).removeClass("csui-is-visible");
        view.ui.searchResultsBody.removeClass("csui-search-results-body-right");
      }
      this.ui.searchSidePanelHeader[this.enableCustomSearch ? "removeClass" : "addClass"]("binf-hidden");
      this.facetView && this.facetView.triggerMethod("dom:refresh");
      this.listenTo(this.facetView, "dom:refresh", function() {
        this.headerView.currentlyFocusedElement();
        this.headerView.trigger(this.headerView.searchinit ? "focus:search" : "focus:filter", this);
      });
      if (!!this.facetView && !!this.facetView.facets) {
        this.listenTo(this.facetView.facets, "sync", function() {
          this.headerView.trigger(this.headerView.searchinit ? "focus:search" : "focus:filter", this);
        });
      }
    },
    _transitionEnd: _.once(function() {
      var transitions = {
        transition: "transitionend",
        WebkitTransition: "webkitTransitionEnd",
        MozTransition: "transitionend",
        OTransition: "oTransitionEnd otransitionend"
      }, element = document.createElement("div"), transition;
      for (transition in transitions) {
        if (typeof element.style[transition] !== "undefined") {
          return transitions[transition];
        }
      }
    }),
    updateHeaderTitle: function() {
      this.headerView.setCustomSearchTitle(this.options.title);
    },
    showHeaderSaveSearchTools: function() {
      this.headerView.toggleSaveSearchTools(true);
    },
    _handleFacetBarVisible: function() {
      this.ui.searchResultsContent.addClass("csui-facetbarviewOpened");
      this.ui.searchResultsContent.find(".csui-facet-list-bar .csui-facet-item:last a").trigger("focus");
      if (this.$el.find(".csui-table-rowselection-toolbar-visible").length > 0) {
        this.$(".csui-selected-counter-region button").attr("tabindex", 0);
      }
    },
    _handleFacetBarHidden: function() {
      this.ui.searchResultsContent.removeClass("csui-facetbarviewOpened");
      this.headerView.trigger("refresh:tabindexes");
      if (this.$el.find(".csui-table-rowselection-toolbar-visible").length > 0) {
        this.$(".csui-selected-counter-region button").attr("tabindex", 0);
      }
    },
    onViewStateChanged: function() {
      if (!this.enableViewState) {
        return;
      }
      var viewStateModel = this.context.viewStateModel;
      if (viewStateModel.getCurrentRouterName() === "Search") {
        var pageInfo = this.getViewStatePage() || this.getDefaultViewStatePage();
        if (pageInfo) {
          if (pageInfo.top !== undefined && pageInfo.skip !== undefined && (pageInfo.top !== this.collection.topCount || pageInfo.skip !== this.collection.skipCount)) {
            this.collection.setLimit(pageInfo.skip, pageInfo.top);
          }
        } else {
          this.collection.setLimit(0, this.getPageSize());
        }
      }
    },
    _pagingChanged: function() {
      if (this.enableViewState && this.collection.topCount !== undefined && this.collection.skipCount !== undefined) {
        return this.setViewStatePage(this.collection.topCount, this.collection.skipCount, {
          default: this.collection.skipCount === 0
        });
      }
    },
    _orderByChanged: function() {
      this.enableViewState && this.setViewStateOrderBy([ this.collection.orderBy ]);
    },
    _addUrlParametersSupport: function(context) {
      var viewStateModel = context && context.viewStateModel, urlParamsList = this.getUrlParameters();
      this.enableViewState = viewStateModel && urlParamsList && viewStateModel.addUrlParameters(urlParamsList, context);
    },
    getDefaultUrlParameters: function() {
      return this.options.urlParamsList;
    },
    getUrlParameters: function() {
      return this.getDefaultUrlParameters();
    }
  }, {
    SelectedRows: "selected"
  });
  _.extend(SearchResultsView.prototype, LayoutViewEventsPropagationMixin);
  _.extend(SearchResultsView.prototype, NodeViewStateMixin);
  _.extend(SearchResultsView.prototype, NodeSelectionRestoreMixin);
  _.extend(SearchResultsView.prototype, MultiNodeFetchMixin);
  SearchQueryMixin.mixin(SearchResultsView.prototype);
  return SearchResultsView;
});