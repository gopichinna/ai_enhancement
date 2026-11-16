/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/widgets/generic.expanded.table/generic.expanded.table.view", "csui/utils/contexts/factories/recycle.items.columns.factory", "csui/utils/contexts/factories/recycle.items", "csui/widgets/recycle.items.table/recycle.items.columns", "csui/widgets/recycle.items.table/recycle.toolbaritems", "csui/widgets/recycle.items.table/recycle.items.table.header.view", "csui/models/widget/recycle.items/recycle.items.facets.factory", "csui/utils/contexts/factories/recycle.bin", "csui/controls/facet.bar/facet.bar.view", "i18n!csui/widgets/recycle.items.table/impl/nls/lang" ], function(_, GenericExpandedTableView, RecycleItemsColumnsCollectionFactory, RecycleItemsCollectionFactory, RecycleItemsTableColumns, recycleToolbarItems, recycleItemsTableHeaderView, RecycleItemsFacetCollectionFactory, RecycleBinVolumeFactory, FacetBarView, lang) {
  "use strict";
  const RecycleItemsView = GenericExpandedTableView.extend({
    className: `csui-recycle-items-table-view ${GenericExpandedTableView.prototype.className}`,
    constructor: function RecycleItemsTableView(options = {}) {
      _.defaults(options, {
        orderBy: "deleted_date desc"
      });
      options.collectionFactory = RecycleItemsCollectionFactory;
      options.columnCollectionFactory = RecycleItemsColumnsCollectionFactory;
      options.tableColumns = RecycleItemsTableColumns;
      const recycleBinVolumeModel = options.context.getModel(RecycleBinVolumeFactory, {
        permanent: true,
        detached: true
      });
      recycleBinVolumeModel.ensureFetched().then(function() {
        const showPurgeDateColumn = recycleBinVolumeModel.get("show_purge_date_column");
        if (!showPurgeDateColumn) {
          const recycleItemsColumnsCollection = options.context.getModel(RecycleItemsColumnsCollectionFactory);
          const PurgeDateColumnModel = recycleItemsColumnsCollection.findWhere({
            key: "purged_date"
          });
          recycleItemsColumnsCollection.remove(PurgeDateColumnModel);
        }
      });
      options.tableAria = lang.tableAria;
      options.dialogTitle = lang.dialogTitle;
      options.headerIconName = "title-recyclebin-items";
      options.overrideToolbarItems = recycleToolbarItems;
      options.noNodeExtraData = true;
      options.displayCountProps = {
        showCount: false
      };
      options.showButtonsInEachFacet = false;
      options.enableFacetPanel = true;
      this.options = options;
      GenericExpandedTableView.prototype.constructor.call(this, options);
      if (!this.collection.recycleItemsFacets) {
        this.collection.recycleItemsFacets = this.options.context.getModel(RecycleItemsFacetCollectionFactory, {
          options: {
            query: this.options.query,
            orderBy: this.collection.orderBy,
            skipCount: this.collection.skipCount,
            topCount: this.collection.topCount,
            filters: this.collection.filters.length ? this.collection.filters : []
          },
          detached: true
        });
      }
      this.listenTo(this.collection, "sync", this.executeEndProcess);
      this.facetFilters = this.collection.recycleItemsFacets;
    },
    executeEndProcess: function() {
      const facetBarOptions = {
        showSaveFilter: false,
        hideClearAll: true
      };
      this._setFacetBarView(facetBarOptions);
      if (this.facetBarView && this.options.showFacetPanel !== false) {
        this.facetBarRegion.show(this.facetBarView);
      }
      if (this.facetBarView.facetBarView?.allTopicsCollection?.length) {
        this._handleFacetBarVisible();
      } else {
        this._handleFacetBarHidden();
      }
    },
    _removeAll: function() {
      this.facetFilters.clearFilter(false);
      this.collection.setDefaultPageNum();
      this._fetchCollectionAfterFilterUpdate();
    },
    _handleFacetBarVisible: function() {
      this.facetBarView.facetBarView.el.classList.remove("csui-facet-bar-hidden");
      this.facetBarView.facetBarView.$el.find(".csui-facet-list-bar .csui-facet-item-content").trigger("focus");
    },
    _handleFacetBarHidden: function() {
      this.facetBarView.facetBarView.el.classList.add("csui-facet-bar-hidden");
    },
    _removeFacetFilter: function(filter) {
      let facetValues;
      this.collection.mode = undefined;
      this.facetFilters.filters = [];
      if (this._synchronizedContextForFacets) {
        this.facetFilters.removeFilter(filter, false);
        facetValues = this.facetFilters.getFilterQueryValue();
        this.collection.resetLimit(false);
        this.collection.setFilter({
          facet: facetValues
        }, {
          fetch: false
        });
        this._synchronizedContextForFacets.fetch();
      } else {
        this.facetFilters.removeFilter(filter);
        facetValues = this.facetFilters.getFilterQueryValue();
        this.collection.resetLimit(false);
        this.collection.setFilter({
          facet: facetValues
        });
      }
      this.facetFilters.fetch();
      this._fetchCollectionAfterFilterUpdate();
    },
    _addToFacetFilter: function(filter) {
      let facetValues;
      this.collection.mode = filter.values[0].id;
      this.facetFilters.filters = [];
      if (this._synchronizedContextForFacets) {
        this.facetFilters.addFilter(filter, false);
        facetValues = this.facetFilters.getFilterQueryValue();
        this.collection.resetLimit(false);
        this.collection.setFilter({
          facet: facetValues
        }, {
          fetch: false
        });
        this._synchronizedContextForFacets.fetch();
      } else {
        this.facetFilters.addFilter(filter, false);
        facetValues = this.facetFilters.getFilterQueryValue();
        this.collection.resetLimit(false);
        this.collection.setFilter({
          facet: facetValues
        });
      }
      this._fetchCollectionAfterFilterUpdate();
    },
    _fetchCollectionAfterFilterUpdate: function() {
      this.collection.fetch({
        fetchFacets: true
      });
    },
    getCollectionOptions: function() {
      var collectionState = this._restoreCollectionOptionsFromViewState();
      collectionState = {
        ...collectionState,
        orderBy: "deleted_date desc"
      };
      return {
        collectionState: collectionState
      };
    },
    _setPerspectiveHeaderView: function() {
      this.headerView = new recycleItemsTableHeaderView({
        title: this.getTitle(),
        icon: "title-recyclebin-items",
        context: this.context,
        originatingView: this,
        localStorage: this.localStorage ? this.localStorage : this.options.localStorage,
        collection: this.collection,
        settings: !!this.settings ? this.settings : false,
        toolbarCommandController: this.commandController
      });
      this.headerView.data = {};
    }
  });
  return RecycleItemsView;
});