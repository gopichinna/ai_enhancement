/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/base", "csui/utils/contexts/factories/connector", "csui/widgets/search.results/search.results.view", "csui/controls/table/table.columns", "csui/controls/pagination/nodespagination.view", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/accessibility", "nuc/models/nodes", "d2/models/savedsearch/savedsearch.model", "d2/commands/go.back", "d2/controls/query.form/query.form.view", "d2/controls/saved.search/saved.search.form.view", "d2/dialogs/document.preview/document.preview.view", "dctmw/utils/user.preference.storage", "d2/utils/search.utils", "i18n!d2/widgets/search.results/nls/lang", "css!d2/overrides/csui/widgets/search.results/impl/search.results.view" ], function(Marionette, _, $, base, ConnectorFactory, SearchResultsView, tableColumns, PaginationView, ApplicationScopeModelFactory, Accessibility, NodeCollection, SavedSearchModel, CmdGoBack, QueryFormView, SavedSearchFormView, DocumentPreview, userPreference, searchUtils, lang) {
  "use strict";
  var isAccessibiliyModeEnabled = Accessibility.isAccessibleTable();
  var proto = SearchResultsView.prototype, oldSetFacetPanelView = proto._setFacetPanelView, oldRemoveFacetPanelView = proto._removeFacetPanelView, oldInitialize = proto.initialize, oldCompleteCommand = proto._completeCommand, oldSetSearchHeader = proto.setSearchHeader, oldOnRender = proto.onRender, oldOnDestroy = proto.onDestroy, facetPanelToggleIconSelector = ".csui-search-header .csui-search-filter svg.csui-icon-v2", facetPanelToggleIconActiveStateClassName = "csui-icon-v2-on", FILTER_PANEL_VISIBILITY_STATE_STORAGE_KEY = "SearchResults", cmdGoBack = new CmdGoBack(), STANDARD_VIEW = "StandardView", TABULAR_VIEW = "TabularView", LEFT_PANEL_MODE = {
    SEARCH_FORM: "search_form",
    FACET: "facet"
  }, LAST_SEARCH_NAME = "lastSearch";
  _.extend(proto, {
    onRender: function() {
      oldOnRender.apply(this, arguments);
      if (this.collection.prevSearchDisplayStyle === STANDARD_VIEW) {
        this.collection.prevSearchDisplayStyle = TABULAR_VIEW;
      }
      var filterElement = this.$el.find(".csui-search-header .csui-search-facet-filter-parent");
      filterElement.addClass("binf-hidden");
      this.$el.find(".headerCount").empty();
    },
    initialize: function(options) {
      options = options || {};
      options.enableBackButton = true;
      options.backButtonToolTip = options.backButtonToolTip || options.context && options.context.viewStateModel && options.context.viewStateModel.get("enabled") && options.context.viewStateModel.getBackToTitle() || lang.defaultBackButtonTooltip;
      oldInitialize.apply(this, arguments);
      if (options.attachBackButtonListener !== false) {
        this.listenTo(this, "go:back", function() {
          cmdGoBack.execute({
            context: this.context,
            restoreLastFragment: true
          });
        }.bind(this));
      }
      this.listenTo(this.collection, "filter:change filter:clear orderBy:change orderBy:clear paging:change limits:change", DocumentPreview.hide);
      this.listenTo(this.collection, "request", function() {
        var filterElement = this.$el.find(".csui-search-header .csui-search-facet-filter-parent");
        filterElement.addClass("binf-hidden");
      });
      this.listenTo(this.collection, "error", function() {
        var filterElement = this.$el.find(".csui-search-header .csui-search-facet-filter-parent");
        if (!filterElement.hasClass("binf-hidden")) {
          filterElement.addClass("binf-hidden");
        }
        var resultTitle = this.collection.searching && this.collection.searching.result_title || lang.searchResults;
        this.$el.find(".csui-results-title").text(resultTitle);
        this.$el.find(".headerCount").empty();
      });
      this.listenTo(this.collection, "sync", function(model, request, message) {
        var filterVisible = userPreference.getLocalStorePreference(userPreference.StorageTypes.FACET_PANEL_VISIBILITY, FILTER_PANEL_VISIBILITY_STATE_STORAGE_KEY);
        this.keepselection = message && message.keepselection;
        var filterElement = this.$el.find(".csui-search-header .csui-search-facet-filter-parent");
        var filterIconElement = this.$el.find(".csui-search-header .csui-search-filter");
        var retainSearchForm = !!(this.leftPanelMode !== LEFT_PANEL_MODE.FACET && (this.savedSearchModel && (this.savedSearchModel.get("r_object_type") === "d2c_query_wizard" || this.savedSearchModel.get("name") === LAST_SEARCH_NAME) || message && message.addnlOptions && message.addnlOptions.retainSavedSearchForm === true));
        this._updateHeaderButtonTabIndex();
        this._checkAndCreateSearchHeaderButton();
        if (this.collection.searchFacets && this.collection.searchFacets.length) {
          filterElement.removeClass("binf-hidden");
          filterIconElement.removeClass("binf-hidden");
          if (filterVisible === true && !retainSearchForm) {
            this.headerView.filterinit = true;
            this.showFacet = false;
            this.headerView._filterStateIsOn = true;
            this._completeCommand(this, true);
          }
        } else {
          filterElement.addClass("binf-hidden");
        }
        var $headerCount = $(".headerCount");
        $headerCount.text(_.str.sformat(lang.aboutNHits, this.collection.totalCount));
        $headerCount.attr("title", _.str.sformat(lang.aboutNHits, this.collection.totalCount));
        if (this.collection.hasMoreRecords === true) {
          var title = _.str.sformat(lang.totalItemNotification, this.collection.totalCount, this.collection.totalCount + "+"), div = '<div role="button" class="d2-total-notification-icon" aria-label="' + title + '" title="' + title + '"><span class="icon d2-totalItem-icon-notification"></span> </div>';
          $headerCount.siblings(".d2-total-notification-icon").remove();
          $headerCount.after(div);
          $(".csui-search-header-title > div").css("vertical-align", "middle");
          $(".csui-search-header-title").css("top", "0px");
        }
        if (this.collection.fromLandingPage && (filterVisible !== true || !this.collection.searchFacets || !this.collection.searchFacets.length || retainSearchForm)) {
          this._completeQueryFormCommand(false, retainSearchForm);
          delete this.collection.fromLandingPage;
        }
        this.tableColumns = tableColumns;
        if (this.collection.length === 0) {
          var resultTitle = this.collection.searching && this.collection.searching.result_title || lang.searchResults;
          this.$el.find(".csui-results-title").text(resultTitle);
          this.$el.find(".headerCount").empty();
        }
      });
      if (this.options.metadata) {
        var that = this;
        this.listenTo(this.options.metadata, "request", function() {
          that.blockActions();
        });
        this.listenTo(this.options.metadata, "sync", function() {
          that.unblockActions();
        });
        this.listenTo(this.options.metadata, "error", function() {
          that.unblockActions();
        });
      }
      this.options.enableSearchSettings = !isAccessibiliyModeEnabled;
      this.context && this.context.trigger("d2.open:widget", {
        widgetView: this
      });
    },
    setDefaultTableMode: function() {
      if (this.collection.prevSearchDisplayStyle === STANDARD_VIEW) {
        this.collection.prevSearchDisplayStyle = TABULAR_VIEW;
      }
    },
    resetFacetToggle: function() {
      if (this.isFacetDisplayed === true) {
        return;
      }
      this.$(facetPanelToggleIconSelector).removeClass(facetPanelToggleIconActiveStateClassName);
    },
    _checkAndCreateSearchHeaderButton: function() {
      if (this.searchMetadataObj && (this.searchMetadataObj.isQueryFormSearch || this.searchMetadataObj.isSavedSearch) && !this.$el.find(".d2-query-form-search-span").length) {
        var $facetFilterButtonParentEl = this.$el.find(".csui-search-facet-filter-parent");
        $($facetFilterButtonParentEl).after('<span id="queryFormSearch" tabindex="0" class="d2-query-form-search-span"><span class="cs-search-icon icon icon-query-form-search"></span></span>');
        var that = this;
        $("#queryFormSearch").on("click", function() {
          that._completeQueryFormCommand(true);
        }).on("keypress", function(event) {
          var keyCode = event.keyCode || event.charCode;
          if (!(event.ctrlKey || event.metaKey) && (keyCode === 32 || keyCode === 13)) {
            that._completeQueryFormCommand(true);
          }
        });
      }
    },
    setSearchHeader: function() {
      oldSetSearchHeader.apply(this, arguments);
      this.headerView.enablePinnedColumns = true;
    },
    _completeCommandInternal: function(view) {
      view.facetFilters.fetched = true;
      oldCompleteCommand.apply(this, arguments);
    },
    _completeCommand: function() {
      var sidePanelVisible = this.ui.searchSidePanel.hasClass("csui-is-visible");
      var isQueryFormVisible = this.searchMetadataObj && this.searchMetadataObj.isSavedSearch === true ? this.leftPanelMode === LEFT_PANEL_MODE.SEARCH_FORM : this.$el.find(".queryformview").length > 0;
      this.$el.find("#facetview").removeClass("binf-hidden");
      if (sidePanelVisible) {
        if (isQueryFormVisible) {
          var width = this.$el.find(".d2-query-form-main-view").width();
          this._removeQueryFormView();
          this.$(".csui-search-header .icon-query-form-search").removeClass("active");
          this._ensureFacetPanelViewDisplayed();
          this.isFacetDisplayed = true;
          this.$(facetPanelToggleIconSelector).addClass(facetPanelToggleIconActiveStateClassName);
          if (width > 0) {
            this.$el.find("#facetview").css("width", width);
          }
        } else {
          if (this.leftPanelMode !== LEFT_PANEL_MODE.FACET) {
            this.isFacetDisplayed = false;
            this.$(facetPanelToggleIconSelector).toggleClass(facetPanelToggleIconActiveStateClassName);
          }
          this._completeCommandInternal.apply(this, arguments);
        }
      } else {
        this.isFacetDisplayed = true;
        this.ui.searchSidePanel.removeClass("csui-is-visible");
        this.$(facetPanelToggleIconSelector).toggleClass(facetPanelToggleIconActiveStateClassName);
        this._completeCommandInternal.apply(this, arguments);
      }
      this.isQueryFormDisplayed = false;
      this.leftPanelMode = LEFT_PANEL_MODE.FACET;
      this._updateHeaderButtonTabIndex();
    },
    _updateHeaderButtonTabIndex: function() {
      setTimeout(function() {
        this.headerView.$el.find(".csui-search-arrow-back-parent .arrow_back, .csui-search-facet-filter-parent .csui-search-filter, .d2-query-form-search-span").attr("tabindex", 0);
      }.bind(this), 500);
    },
    _setFacetPanelView: function() {
      oldSetFacetPanelView.apply(this, arguments);
      this.listenTo(this.facetView, "modify:filters", SearchResultsView.prototype._modifyFacetFilter);
      userPreference.saveLocalStorePreference(userPreference.StorageTypes.FACET_PANEL_VISIBILITY, FILTER_PANEL_VISIBILITY_STATE_STORAGE_KEY, true);
    },
    _removeFacetPanelView: function(skipSavingState) {
      oldRemoveFacetPanelView.apply(this, arguments);
      if (skipSavingState !== true) {
        userPreference.saveLocalStorePreference(userPreference.StorageTypes.FACET_PANEL_VISIBILITY, FILTER_PANEL_VISIBILITY_STATE_STORAGE_KEY, false);
      }
    },
    _modifyFacetFilter: function(addfilters, removefilters) {
      var that = this;
      _.each(addfilters, function(filter) {
        that.facetFilters.addFilter(filter, false);
      });
      _.each(removefilters, function(filter) {
        that.facetFilters.removeFilter(filter, false);
      });
      this.collection.setDefaultPageNum();
      var options = {};
      options.filterChanged = true;
      this.collection.fetch(options);
      this.resetScrollToTop();
    },
    _removeFacetFilter: function(filter) {
      this.facetFilters.removeFilter(filter, false);
      this.collection.setDefaultPageNum();
      var options = {};
      options.filterChanged = true;
      this.collection.fetch(options);
      this.resetScrollToTop();
    },
    _removeAll: function() {
      this.facetFilters.clearFilter(false);
      this.collection.setDefaultPageNum();
      var options = {};
      options.filterChanged = true;
      this.collection.fetch(options);
      this.resetScrollToTop();
    },
    _removeAllSelections: function() {
      if (!this.keepselection) {
        this._rowStates.set(SearchResultsView.RowStatesSelectedRows, []);
      }
      delete this.keepselection;
    },
    _showQueryForm: function(show) {
      var that = this;
      if (show) {
        this._ensureQueryPanelViewDisplayed();
        this.ui.searchSidePanel.removeClass("csui-is-hidden");
        this.ui.searchSidePanel.one(this._transitionEnd(), function() {
          if (base.isMSBrowser()) {
            if (that.ui.searchSidePanel.hasClass("csui-is-visible")) {
              that.ui.searchResultsBody.addClass("csui-search-results-body-right");
            }
          }
          that.triggerMethod("dom:refresh");
          if (that.paginationView) {
            that.paginationView.triggerMethod("dom:refresh");
          }
          that.collection.showTabularSearchView && that.targetView && that.targetView.triggerMethod("dom:refresh");
          that._addQueryFormCommandAria();
        }).addClass("csui-is-visible");
        if (!base.isMSBrowser()) {
          if (this.ui.searchSidePanel.hasClass("csui-is-visible")) {
            this.ui.searchResultsBody.addClass("csui-search-results-body-right");
          }
        }
      } else {
        this.ui.searchSidePanel.one(this._transitionEnd(), function() {
          if (!that.ui.searchSidePanel.hasClass("csui-is-visible")) {
            that.ui.searchSidePanel.addClass("csui-is-hidden");
          }
          that.triggerMethod("dom:refresh");
          that._removeQueryFormView();
          if (that.paginationView) {
            that.paginationView.triggerMethod("dom:refresh");
          }
          that.targetView && that.targetView.triggerMethod("dom:refresh");
          that._addQueryFormCommandAria();
        }).removeClass("csui-is-visible");
        this.ui.searchResultsBody.removeClass("csui-search-results-body-right");
      }
      this.queryFormView && this.queryFormView.triggerMethod("dom:refresh");
    },
    _completeQueryFormCommand: function(forceComplete, retainSearchForm) {
      var sidePanelVisible = this.ui.searchSidePanel.hasClass("csui-is-visible");
      var isFacetPanelVisible = this.$el.find(".csui-facet-panel").length > 0;
      this.$el.find("#facetview").addClass("binf-hidden");
      if (sidePanelVisible) {
        if (isFacetPanelVisible || retainSearchForm) {
          this.$(facetPanelToggleIconSelector).removeClass(facetPanelToggleIconActiveStateClassName);
          var width = this.$el.find("#facetview").width();
          this._removeFacetPanelView(true);
          this._ensureQueryPanelViewDisplayed();
          this.isQueryFormDisplayed = true;
          this.$(".csui-search-header .icon-query-form-search").addClass("active");
          if (width > 360 || width > this.$el.find(".d2-query-form-main-view").width()) {
            this.$el.find(".d2-query-form-main-view").css("width", width);
          } else {
            this.ui.searchSidePanel.css("width", this.$el.find(".d2-query-form-main-view").width());
          }
        } else {
          this.isQueryFormDisplayed = false;
          this._showQueryForm(false);
          this.$(".csui-search-header .icon-query-form-search").removeClass("active");
        }
      } else {
        var showQueryForm = true;
        if (!forceComplete) {
          showQueryForm = !(this.savedSearchModel && this.savedSearchModel.get("r_object_type") === "d2c_query" && this.savedSearchModel.get("name") !== LAST_SEARCH_NAME);
        }
        if (showQueryForm) {
          this.isQueryFormDisplayed = showQueryForm;
          this._showQueryForm(showQueryForm);
          this.$(".csui-search-header .icon-query-form-search").addClass("active");
        } else {
          this._addQueryFormCommandAria();
          this.$(".csui-search-header .icon-query-form-search").removeClass("active");
        }
      }
      this.isFacetDisplayed = false;
      this.leftPanelMode = LEFT_PANEL_MODE.SEARCH_FORM;
      this._updateHeaderButtonTabIndex();
    },
    _refreshTargetView: function() {
      this.collection.showTabularSearchView && this.targetView && this.targetView.triggerMethod("dom:refresh");
    },
    _ensureQueryPanelViewDisplayed: function() {
      if (this.queryFormView === undefined) {
        var qfmainview = this.$el.find(".d2-query-form-main-view");
        if (qfmainview.length) {
          qfmainview.removeClass("binf-hidden");
        }
        this._setQueryFormPanelView();
        this.queryFormRegion.show(this.queryFormView);
        this.queryFormView.triggerMethod("dom:refresh");
      } else {
        this.queryFormView && this.queryFormView.trigger("show:query:panel");
      }
    },
    _setQueryFormPanelView: function() {
      if (!this.$el.find(".d2-query-form-main-view").length) {
        $(".csui-search-left-panel-content").append("<div class='d2-query-form-view d2-query-form-main-view'></div>");
      }
      this.queryFormRegion = new Marionette.Region({
        el: this.$el.find(".d2-query-form-main-view")
      });
      if (this.searchMetadataObj.isSavedSearch === true) {
        this.queryFormView = new SavedSearchFormView({
          searchConfig: this.searchConfig,
          savedSearchModel: this.savedSearchModel,
          savedSearchName: this.collection.searching ? this.collection.searching.title : this.collection.title,
          context: this.options.context,
          connector: this.collection.connector,
          refresh: _.bind(this._refreshTargetView, this),
          searchResultsView: this
        });
        this.queryFormView.options.savedSearchId = this.query.get("by-id");
      } else {
        this.queryFormView = new QueryFormView({
          savedSearchName: this.collection.searching ? this.collection.searching.title : this.collection.title,
          search: _.bind(this._executeQueryFormSearch, this),
          refresh: _.bind(this._refreshTargetView, this),
          data: this.queryFormModel,
          context: this.options.context,
          connector: this.collection.connector,
          initFooter: true
        });
        this.queryFormView.options.savedSearchId = this.options.metadata.advSearchId;
      }
      this.queryFormView.options.fromSearchResults = true;
      this.listenTo(this.collection.searchMetadataObj, "sync", function() {
        this.collection.resetLimit();
      }.bind(this));
    },
    _executeQueryFormSearch: function(data) {
      !this.options.context.queryformdata && (this.options.context.queryformdata = {});
      this.options.context.queryformdata[this.query.get("queryform")] = data;
      this.collection.searchMetadataObj.queryformdata = data;
      this.collection.searchMetadataObj.fetch();
    },
    _removeQueryFormView: function() {
      if (this.searchMetadataObj.isSavedSearch === true) {
        return;
      }
      if (this.queryFormView) {
        this.options.context.queryform = this.queryFormView.formview.getForm();
      }
      if (this.queryFormRegion) {
        this.queryFormRegion.empty();
      }
      if (this.queryFormView) {
        this.queryFormView = undefined;
      }
      this.$el.find(".d2-query-form-main-view").addClass("binf-hidden");
    },
    _addQueryFormCommandAria: function() {
      var qfview = this.$el.find(".queryformheaderview");
      var queryformSearchIcon = this.$el.find(".d2-query-form-search-span");
      if (qfview.length) {
        queryformSearchIcon.attr("aria-label", this.metadata.isSavedSearch ? lang.savedSearchFormCollapseAria : lang.queryformCollapseAria);
        queryformSearchIcon.attr("title", this.metadata.isSavedSearch ? lang.savedSearchFormCollapseTooltip : lang.queryformCollapseTooltip);
      } else {
        queryformSearchIcon.attr("aria-label", this.metadata.isSavedSearch ? lang.savedSearchFormExpandAria : lang.queryformExpandAria);
        queryformSearchIcon.attr("title", this.metadata.isSavedSearch ? lang.savedSearchFormExpandTooltip : lang.queryformExpandTooltip);
      }
    },
    onDestroy: function() {
      oldOnDestroy.apply(this, arguments);
      this.context && this.context.trigger("d2.close:widget", {
        widgetView: this
      });
    },
    getContainerId: function() {
      return this.query.get("queryform") || this.query.get("by-id") || "_quicksearch";
    },
    updateLayoutView: function() {
      this.getPreviousPageSize();
      this.paginationView.options.pageSize = this.options.prevPageSize;
      this.paginationView.selectedPageSize = this.options.prevPageSize;
    },
    getPreviousPageSize: function() {
      var prevPageSize = userPreference.fetchPageSize(this.getContainerId());
      this.options.prevPageSize = prevPageSize ? prevPageSize : 10;
    },
    setPagination: function() {
      this.getPreviousPageSize();
      this.options.pageSize = this.options.prevPageSize ? this.options.prevPageSize : this.options.pageSize;
      this.paginationView = new PaginationView({
        collection: this.collection,
        pageSize: this.options.pageSize,
        pageNumber: this.options.pageNumber,
        defaultDDList: [ 10, 25, 50, 100 ]
      });
      this.listenTo(this.paginationView, "pagesize:updated", function(paginationView) {
        this.paginationView.pageSize = paginationView.pageSize;
        userPreference.savePageSize(this.getContainerId(), paginationView.pageSize);
      }, this);
      return true;
    },
    getD2SelectedNodes: function() {
      return new NodeCollection(this.targetView.getSelectedChildren()).models;
    },
    windowRefresh: function() {
      this.facetView && this.facetView.triggerMethod("dom:refresh");
      this.queryFormView && this.queryFormView.triggerMethod("dom:refresh");
      if (this._selectAllView) {
        this._selectAllView.triggerMethod("dom:refresh");
      }
      if (this.expandAllView) {
        this.expandAllView.triggerMethod("dom:refresh");
      }
      var panelPosition = this.ui.searchSidePanel.css("position");
      if (panelPosition !== "absolute") {
        if (this.$el.width() > 1023 && this.ui.searchSidePanel.hasClass("search-side-panel-overlay")) {
          this.ui.searchSidePanel.removeClass("search-side-panel-overlay");
          if (this.ui.searchSidePanel.hasClass("search-side-panel-auto")) {
            this.ui.searchSidePanel.removeClass("search-side-panel-auto");
            if (this.queryFormHidden) {
              this.queryFormHidden = false;
              this._completeQueryFormCommand();
            } else if (this.facetsHidden) {
              this.facetsHidden = false;
              this._completeCommand(this, true);
            }
          }
        }
      } else if (!this.ui.searchSidePanel.hasClass("search-side-panel-auto") && !this.ui.searchSidePanel.hasClass("search-side-panel-overlay")) {
        this.ui.searchSidePanel.addClass("search-side-panel-overlay");
        if (this.ui.searchSidePanel.hasClass("csui-is-visible")) {
          this.ui.searchSidePanel.addClass("search-side-panel-auto");
          if (this.isQueryFormDisplayed) {
            this.queryFormHidden = true;
            this._completeQueryFormCommand();
          } else if (this.isFacetDisplayed) {
            this.facetsHidden = true;
            this._completeCommand(this, true);
          }
        }
      }
    }
  });
});