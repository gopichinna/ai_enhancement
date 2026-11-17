/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/utils/commands", "csui/utils/accessibility", "nuc/models/node/node.model", "csui/behaviors/table.rowselection.toolbar/table.rowselection.toolbar.behavior", "d2/controls/globalmessage/globalmessage", "csui/controls/tabletoolbar/tabletoolbar.view", "csui/controls/toolbar/toolitems.factory", "csui/widgets/nodestable/nodestable.view", "csui/widgets/nodestable/toolbaritems", "csui/widgets/nodestable/toolbaritems.masks", "csui/widgets/nodestable/headermenuitems.mask", "csui/utils/contexts/factories/widget.settings.collection.factory", "d2/dialogs/document.preview/document.preview.view", "d2/models/base.columns", "dctmw/controls/mixins/view.state/widget.view.state.mixin", "d2/widgets/table/table.inline.row.actions.mixin", "d2/widgets/widgettable/toolbaritems", "dctmw/utils/user.preference.storage", "d2/utils/contexts/factories/widget.view.state.factory", "dctmw/utils/utils", "d2/utils/widget.constants", "d2/utils/widgets.utils", "hbs!d2/widgets/widgettable/widgettable", "i18n!d2/widgets/widgettable/impl/nls/lang", "i18n!d2/commands/nls/localized.strings", "css!d2/widgets/widgettable/widgettable" ], function($, _, Backbone, Marionette, base, commands, Accessibility, NodeModel, TableRowSelectionToolbarBehavior, GlobalMessage, TableToolbarView, ToolItemsFactory, NodesTable, NodesTableToolbarItems, NodesTableToolbarItemsMasks, HeaderMenuItemsMask, WidgetSettingsCollectionFactory, DocumentPreview, D2TableColumns, WidgetViewStateMixin, TableInlineRowActionsMixin, WidgetTableToolbarItems, userPreference, WidgetViewStateModelFactory, utils, widgetConstants, widgetUtils, template, lang, commandLang) {
  "use strict";
  var accessibleTable = Accessibility.isAccessibleTable();
  var WidgetTableView = NodesTable.extend({
    template: template,
    className: "csui-nodestable d2-widget-table-view",
    regions: {
      tableToolbarRegion: ".csui-table-tabletoolbar",
      tableRowSelectionToolbarRegion: ".csui-table-rowselection-toolbar",
      tableRegion: ".d2-table-view",
      paginationRegion: ".d2-pagination-view",
      facetBarRegion: ".csui-table-facetbarview",
      facetRegion: ".csui-table-facetview",
      queryFormRegion: ".d2-table-queryformview",
      thumbnailRegion: ".cs-thumbnail-wrapper"
    },
    constructor: function WidgetTableView(options) {
      if (!options.d2collectionFactory && !options.collectionClass && !options.collection) {
        throw new Error("D2 Table Widget cannot be initiated without factory, collection or collectionClass");
      }
      if (!options.d2tableColumns) {
        options.d2tableColumns = D2TableColumns;
      }
      options.enableDragNDrop = false;
      options.showSelectionCounter = true;
      this.enableMetadataPerspective = true;
      this.toolbarItems = WidgetTableToolbarItems.clone();
      if (options.toolbarItems) {
        this.toolbarItems = options.toolbarItems;
      }
      if (!this.toolbarItems["inlineActionbar"]) {
        this.toolbarItems["inlineActionbar"] = NodesTableToolbarItems["inlineActionbar"];
      }
      if (!this.toolbarItems["tableHeaderToolbar"]) {
        this.toolbarItems["tableHeaderToolbar"] = NodesTableToolbarItems["tableHeaderToolbar"];
      }
      this.ui = _.extend(this.ui || {}, {
        queryFormView: ".d2-table-queryformview"
      });
      if (!options.headermenuItems) {
        options.headermenuItems = {
          headerMenuToolbar: new ToolItemsFactory({})
        };
      }
      this._isUrlParamsAdded = false;
      NodesTable.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
    },
    windowRefresh: function() {
      NodesTable.prototype.windowRefresh.apply(this, arguments);
      if (this.showQueryForm) {
        userPreference.saveLocalStorePreference(userPreference.StorageTypes.PRIMARY_PANE_WIDTH, widgetConstants.D2.WORKFLOWS, this.ui.queryFormView.width());
      }
      if (this.showFilter) {
        userPreference.saveLocalStorePreference(userPreference.StorageTypes.PRIMARY_PANE_WIDTH, widgetConstants.D2.TASKS, this.ui.facetView.width());
      }
      if (!utils.isAndroid()) {
        this.tableView && this.tableView.trigger("dom:refresh");
      }
    },
    behaviors: _.extend({
      TableRowSelectionToolbar: {
        behaviorClass: TableRowSelectionToolbarBehavior
      }
    }, NodesTable.prototype.behaviors),
    initialize: function(options) {
      if (this.enableViewState && !this._isUrlParamsAdded) {
        this._addUrlParametersSupport(options.context);
      }
      var widgetName = this.getViewStateWidgetName();
      var opts = {
        options: {
          expanded: true,
          widgetName: widgetName
        }
      };
      var widgetTableOption = {
        nodeListView: true,
        widgetName: widgetName
      };
      this.updateInitialDataInViewStateModel();
      this.collection = this.options.collection;
      if (!this.collection) {
        if (this.options.d2collectionFactory) {
          var collectionState = this._restoreCollectionOptionsFromViewState();
          var factoryOptions = {
            options: _.extend(this._restoreCollectionOptionsFromViewState(), opts, widgetTableOption),
            widget: opts
          };
          if (this.options.collectionAttributes) {
            _.extend(factoryOptions, {
              attributes: this.options.collectionAttributes
            });
          }
          this.collection = this.context.getCollection(this.options.d2collectionFactory, factoryOptions);
          if (collectionState.orderBy) {
            this.options.orderBy = collectionState.orderBy;
          }
          if (collectionState.filter) {
            this.collection.filters = collectionState.filter;
          }
        } else {
          if (this.options.collectionClass) {
            var collectionOptions = _.extend({
              connector: this.connector,
              expanded: true,
              commands: commands.getAllSignatures(),
              widgetName: this.getViewStateWidgetName(),
              autoreset: true
            }, this.getCollectionOptions());
            widgetName = collectionOptions.widgetName;
            this.collection = new this.options.collectionClass(null, collectionOptions);
          }
        }
      }
      this.collection.setFields = function() {};
      this.collection.setExpand && this.collection.setExpand("properties", [ "parent_id", "reserved_user_id" ]);
      this._allCommands = this.defaultActionController.actionItems.getAllCommandSignatures(commands);
      this.collection.setResourceScope && this.collection.setResourceScope(this.options.d2collectionFactory.getDefaultResourceScope(true));
      this.collection.setDefaultActionCommands && this.collection.setDefaultActionCommands(this._allCommands);
      this.collection.setEnabledDelayRestCommands && this.collection.setEnabledDelayRestCommands(true);
      if (this.facetFilters) {
        this.collection.searchFacets = this.facetFilters;
      }
      if (this.collection.delayedActions) {
        this.listenTo(this.collection.delayedActions, "error", function(collection, request) {
          var error = new base.Error(request);
          GlobalMessage.showMessage("error", error.message);
        });
      }
      this.columns = this.collection.columns || new this.options.d2tableColumns(undefined, {
        connector: this.connector
      });
      if (!this.options.toolbarItemsMasks) {
        this.options.toolbarItemsMasks = new NodesTableToolbarItemsMasks();
      }
      if (!this.options.headermenuItemsMask) {
        this.options.headermenuItemsMask = new HeaderMenuItemsMask();
      }
      _.defaults(this.options, {
        orderBy: this.options.orderBy,
        tableColumns: this.options.d2tableColumns,
        toolbarItems: this.toolbarItems,
        urlParamsList: []
      });
      this.options.toolbarItems = this.toolbarItems;
      this.initSelectionMixin(this.options, this.collection);
      var viewStateModel = this.context.viewStateModel;
      this.listenTo(this.collection, "filter:change filter:clear orderBy:change orderBy:clear paging:change limits:change", DocumentPreview.hide).listenTo(this.collection, "filter:clear", this._collectionFilterChanged).listenTo(viewStateModel, "change:state", this.onViewStateChanged).listenTo(this.collection, "paging:change", this._pagingChanged).listenTo(this.collection, "limits:change", this._pagingChanged).listenTo(this.collection, "sync", this._onCollectionSync);
      var widgetInfo = this.getWidgetDetails(), preferenceStorageId;
      if (widgetInfo) {
        preferenceStorageId = widgetUtils.getPreferenceStorageId(widgetInfo.widgetType, widgetInfo.widgetName);
      } else if (this.options.widgetStatePreferenceStorageId) {
        preferenceStorageId = widgetUtils.getPreferenceStorageId(this.options.widgetStatePreferenceStorageId);
      }
      if (preferenceStorageId) {
        var widgetSetting = this.context.getCollection(WidgetSettingsCollectionFactory).get(preferenceStorageId);
        if (!widgetSetting) {
          widgetUtils.prepareLocalWidgetSettingsInContext(preferenceStorageId);
        }
      }
      this._initPreferences();
      this.setViewStatePage(0, this.getPageSize(), {
        default: true
      });
      this._currentTableMode = this.getPreference("tableMode") || widgetConstants.TableModes.WRAP;
      this.setWidgetToolBar();
      this.setTableView();
      this._setTableRowSelectionToolbarEventListeners();
      this.setPagination();
      if (this.options.collection) {
        this.collection.fetched = false;
      }
      this.listenTo(this, "refresh:list:data", this.onRefreshList);
      this.context && this.context.trigger("d2.open:widget", {
        widgetView: this
      });
      if (this.options.showQueryFormPanelOnLoad) {
        this.listenTo(this.tableToolbarView.captionView.nameView, "render", this._updateTableForSearchResults);
      }
    },
    setTableView: function(options) {
      options = options || {};
      options = _.extend({
        orderBy: this.options.orderBy,
        filterBy: this.options.filterBy,
        selectRows: this.options.selectRows,
        nameEdit: false,
        haveDetailsRowExpandCollapseColumn: true,
        tableColumns: this.options.tableColumns,
        allSelectedNodes: this.getAllSelectedNodes(),
        tableTexts: {
          zeroRecords: this.getZeroRecordText()
        }
      }, options);
      NodesTable.prototype.setTableView.call(this, options);
      if (this.options.inlineRowActions) {
        this.createInlineRowAction(this.tableView, this.options);
      }
    },
    getCollectionOptions: function() {
      return {};
    },
    onRender: function() {
      this.tableRegion.show(this.tableView);
      this.paginationRegion.show(this.paginationView);
      this.tableToolbarRegion.show(this.tableToolbarView);
      if (this.tableRowSelectionToolbarRegion) {
        this.tableRowSelectionToolbarRegion.$el.find("ul").attr("aria-label", lang.selectedItemActionBarAria);
      }
      if (this.options.inlineRowActions) {
        this.createInlineRowAction(this.tableView, this.options);
      }
      if (this.options.showFacetPanelOnLoad) {
        this.filterToolItemModel = new Backbone.Model();
        this._setFilterActiveState(true);
        this._showFacetPanelView();
        this._setFacetBarView();
      }
      if (this.options.showQueryFormPanelOnLoad) {
        this.queryFormToolItemModel = new Backbone.Model();
        if (this.getPreference("isQueryFormOpen")) {
          this._showQueryFormView();
        }
        this._updateTableForSearchResults();
      }
      this.resizeLeftPanel();
    },
    resizeLeftPanel: function() {
      var leftPanelWidth;
      if (this.showQueryForm) {
        leftPanelWidth = userPreference.getLocalStorePreference(userPreference.StorageTypes.PRIMARY_PANE_WIDTH, widgetConstants.D2.WORKFLOWS);
        leftPanelWidth && this.ui.queryFormView.css("width", leftPanelWidth);
      }
      if (this.showFilter) {
        leftPanelWidth = userPreference.getLocalStorePreference(userPreference.StorageTypes.PRIMARY_PANE_WIDTH, widgetConstants.D2.TASKS);
        leftPanelWidth && this.ui.facetView.css("width", leftPanelWidth);
      }
    },
    onRefreshList: function() {
      if (this.collection.skipCount > 0 && (this.collection.filteredCount <= this.collection.skipCount || this.collection.filteredCount % this.collection.skipCount === 0)) {
        var pageNumber = this.collection.skipCount / this.collection.topCount - 1;
        this.paginationView.pageSize = this.paginationView.selectedPageSize;
        this.paginationView.changePage(pageNumber);
      }
    },
    setWidgetToolBar: function() {
      var node = this.getContainerNode();
      if (this.options.toolbarItems && this.options.toolbarItems.leftToolbar && this.options.toolbarItems.leftToolbar.collection.length > 1) {
        var model = this.options.toolbarItems.leftToolbar.collection.findWhere({
          signature: "D2-Back"
        });
        if (model) {
          var title = this.context.viewStateModel.getBackToTitle();
          model.set("title", title);
        }
      }
      this.tableToolbarView = new TableToolbarView({
        context: this.options.context,
        toolbarItems: this.options.toolbarItems,
        toolbarItemsMasks: this.options.toolbarItemsMasks,
        headermenuItems: this.options.headermenuItems,
        headermenuItemsMask: this.options.headermenuItemsMask,
        creationToolItemsMask: this.options.creationToolItemsMask,
        container: node,
        collection: this.collection,
        originatingView: this,
        blockingParentView: this.options.blockingParentView || this,
        addableTypes: this.addableTypes,
        toolbarCommandController: this.commandController
      });
      return true;
    },
    getContainerNode: function() {
      return new NodeModel(_.extend({
        id: this.getWidgetTypeId(),
        name: this.getTitle()
      }, this.getExtraIconConfig()), {
        connector: this.connector
      });
    },
    getExtraIconConfig: function() {
      return {};
    },
    getUrlParameters: function() {
      this._isUrlParamsAdded = true;
      return this.getInitialUrlParamsList();
    },
    getZeroRecordText: function() {
      return lang.emptyListText;
    },
    getDefaultUrlParameters: function() {
      return this.getInitialUrlParamsList();
    },
    updateInitialDataInViewStateModel: function() {
      var widgetViewStateModel = this.context.getObject(WidgetViewStateModelFactory);
      if (widgetViewStateModel) {
        var urlParams = this.getUrlParameters();
        if (urlParams && urlParams.length > 0) {
          _.each(urlParams, _.bind(function(urlParam) {
            if (widgetViewStateModel.has(urlParam)) {
              this.context.viewStateModel.setViewState(urlParam, widgetViewStateModel.get(urlParam), {
                encode: true,
                silent: true
              });
            }
          }, this));
        }
        widgetViewStateModel.clear();
      }
    },
    _onCollectionSync: function(collection, response, options) {
      var self = this;
      if (this.$el.hasClass("d2-search-table")) {
        this._updateSearchResultCountInHeader();
      }
      if (options && options.xhr && collection && collection.serverTotalCountUrl && collection.hasMoreRecords === true && !collection.totalFromServer) {
        $.ajax(this.connector.extendAjaxOptions({
          url: collection.serverTotalCountUrl,
          success: function(response) {
            collection.totalFromServer = response && !_.isUndefined(response.count) ? response.count : -1;
            delete collection.serverTotalCountUrl;
            self.paginationView.render();
          },
          error: function() {
            collection.totalFromServer = -1;
            delete collection.serverTotalCountUrl;
            self.paginationView.render();
          }
        }));
      }
    },
    _updateSearchResultCountInHeader: function() {
      var count = this._getTotalCount(), $searchHeaderCount = this.$el.find(".csui-tabletoolbar .csui-item-title .search-header-count");
      $searchHeaderCount.html(_.str.sformat(lang.searchResultsCount, count));
      if (count > 0) {
        $searchHeaderCount.removeClass("binf-hidden");
      } else {
        $searchHeaderCount.addClass("binf-hidden");
      }
    },
    _toolbarActionTriggered: function(args) {
      NodesTable.prototype._toolbarActionTriggered.apply(this, arguments);
      if (args.commandSignature === "D2-WidgetTableQueryForm") {
        this.queryFormToolItemModel = args.toolItem;
        this._completeQueryFormSearchCommand();
        this.queryFormToolItemModel.set("stateIsOn", this.showQueryForm);
      }
    },
    _completeFilterCommand: function() {
      NodesTable.prototype._completeFilterCommand.apply(this, arguments);
      this.showQueryForm && this._hideQueryFormView();
    },
    _setQueryFormActiveState: function(active, commandKey) {
      this.setPreference("isQueryFormOpen", active);
      var title = active ? commandLang.queryformCollapseTooltip : commandLang.queryformExpandTooltip;
      commandKey = commandKey || "d2-widgettablequeryform";
      this.$el.find('.csui-tabletoolbar li[data-csui-command="' + commandKey + '"] .csui-toolitem').attr({
        title: title,
        "aria-label": title
      });
      if (active) {
        this.$el.find('.csui-tabletoolbar li[data-csui-command="' + commandKey + '"] svg.csui-icon-v2').addClass("csui-icon-v2-on");
      } else {
        this.$el.find('.csui-tabletoolbar li[data-csui-command="' + commandKey + '"] svg.csui-icon-v2').removeClass("csui-icon-v2-on");
      }
    },
    _completeQueryFormSearchCommand: function() {
      this.showQueryForm = !this.showQueryForm;
      this.showFilter && this._hideFacetPanelView();
      if (this.showQueryForm) {
        this._showQueryFormView();
        this.ui.sidePanel.removeClass("csui-sidepanel-hidden");
      } else {
        this._hideQueryFormView();
        this.ui.sidePanel.addClass("csui-sidepanel-hidden");
      }
    },
    _ensureQueryFormViewDisplayed: function() {
      if (!this.queryFormView && this.options.queryForm && this.options.queryForm.viewClass && this.options.queryForm.viewOptions) {
        this.queryFormView = new this.options.queryForm.viewClass(this.options.queryForm.viewOptions);
        this.queryFormRegion.show(this.queryFormView);
        this.listenTo(this.queryFormView, "dom:refresh", _.bind(function() {
          $(window).trigger("resize.facetview");
        }, this));
      }
    },
    _updateTableForSearchResults: function() {
      if (!this.$el.hasClass("d2-search-table")) {
        this.$el.addClass("d2-search-table");
      }
      var searchHeader = _.str.sformat(lang.searchReultsHeader, this.getTitle()), $tableTitleEl = this.$el.find(".csui-tabletoolbar .csui-item-title .csui-item-title-name");
      $tableTitleEl.find(".csui-item-name .csui-item-name-readonly").attr("title", searchHeader);
      $tableTitleEl.find(".csui-item-name .csui-item-name-readonly .csui-item-name-block").html(searchHeader);
      $tableTitleEl.find(".search-header-count").remove();
      $tableTitleEl.append('<div class="search-header-count binf-hidden"></div>');
      if (this.tableView && this.tableView.options && this.tableView.options.tableTexts && this.tableView.options.tableTexts) {
        this.tableView.options.tableTexts.zeroRecords = lang.searchResultsZeroCount;
      }
      this._updateSearchResultCountInHeader();
    },
    _showQueryFormView: function() {
      this.showQueryForm = true;
      this._setQueryFormActiveState(true);
      this._setFilterActiveState(false);
      this._ensureQueryFormViewDisplayed();
      if (this.queryFormToolItemModel) {
        this.queryFormToolItemModel.set("toolItemAriaExpand", true);
        this.queryFormToolItemModel.set("title", commandLang.queryformCollapseTooltip);
      }
      this.ui.sidePanel.removeClass("csui-sidepanel-hidden");
      this.ui.queryFormView.removeClass("d2-queryformview-visibility");
      if (accessibleTable) {
        this.ui.queryFormView.removeClass("d2-queryformview-hidden");
        this.triggerMethod("dom:refresh");
      } else {
        this.ui.queryFormView.one(this._transitionEnd(), function() {
          this.triggerMethod("dom:refresh");
          this.thumbnailViewState ? this.thumbnail._adjustThumbnailWidth() : "";
        }.bind(this)).removeClass("d2-queryformview-hidden");
      }
    },
    _hideQueryFormView: function() {
      this.showQueryForm = false;
      this._setQueryFormActiveState(false);
      !this.showQueryForm && !this.showFilter && this.ui.sidePanel.addClass("csui-sidepanel-hidden");
      if (this.queryFormToolItemModel) {
        this.queryFormToolItemModel.set("toolItemAriaExpand", false);
        this.queryFormToolItemModel.set("title", commandLang.queryformExpandTooltip);
        this.queryFormToolItemModel.set("stateIsOn", this.showFilter);
      }
      if (accessibleTable) {
        this.ui.queryFormView.addClass("d2-queryformview-hidden");
        this.triggerMethod("dom:refresh");
        this.ui.queryFormView.hasClass("d2-queryformview-hidden") && this.ui.queryFormView.addClass("d2-queryformview-visibility");
        this._removeFacetPanelView();
      } else {
        this.ui.queryFormView.one(this._transitionEnd(), function() {
          this._removeFacetPanelView();
          this.triggerMethod("dom:refresh");
          this.ui.queryFormView.hasClass("d2-queryformview-hidden") && this.ui.queryFormView.addClass("d2-queryformview-visibility");
        }.bind(this)).addClass("d2-queryformview-hidden");
      }
    },
    _executeQueryFormSearch: function(data) {
      if (data && !_.isEmpty(data)) {
        var viewStateModel = this.options.context.viewStateModel, qformData = JSON.stringify(data);
        this.collection.setSkip(0, false);
        this.collection.clearFilter(false);
        viewStateModel.setViewState("page", "");
        viewStateModel.setViewState("filter", "");
        viewStateModel.setViewState("qform-param", qformData, {
          encode: true
        });
        this.collection.fetch(_.extend({}, this.options, {
          reload: true
        })).fail(function(error) {
          var msg = error.message || error;
          if (error && error.responseText) {
            msg = utils.parseAjaxErrorAsString(error);
          }
          if (msg) {
            GlobalMessage.showMessage("error", msg);
          }
        });
        this._updateTableForSearchResults();
      }
    },
    _refreshTargetView: function() {},
    _getTotalCount: function() {
      var totalCount = 0;
      if (this.collection) {
        totalCount = this.collection.filteredCount;
        if (totalCount == null) {
          totalCount = this.collection.totalCount;
        }
        if (totalCount == null) {
          totalCount = this.collection.length;
        }
      }
      return totalCount;
    },
    getContainerId: function() {
      var widgetName = this.getViewStateWidgetName(), widgetID = this.getWidgetTypeId() + "_" + widgetName;
      return widgetID;
    }
  });
  _.extend(WidgetTableView.prototype, WidgetViewStateMixin);
  _.extend(WidgetTableView.prototype, TableInlineRowActionsMixin);
  return WidgetTableView;
});