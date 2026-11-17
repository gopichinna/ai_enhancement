/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/models/nodefacets", "d2/sdk/models/mixins/collection.resource.mixin", "d2/server.adaptors/models/d2.fetchable.mixin", "d2/models/d2collections/d2collections.items.model", "d2/models/d2collections/table/d2collections.items.client.columns", "d2/utils/constants", "d2/utils/widget.constants", "d2/utils/server.query.utils", "d2/utils/rest.linkrels", "d2/utils/facet.utils", "d2/utils/filter.utils" ], function($, _, Backbone, NodeFacetCollection, CollectionResourceMixin, D2FetchableMixin, CollectionItemWidgetModel, D2CollectionItemsColumnModel, constants, widgetConstants, serverQueryUtils, RestLinkrels, FacetUtils, FilterUtils) {
  "use strict";
  var CollectionItemsWidgetCollection = Backbone.Collection.extend({
    model: CollectionItemWidgetModel,
    widgetType: "CollectionWidget",
    constructor: function CollectionItemsWidgetCollection(models, options) {
      options = options || {};
      options.ColumnCollectionClass = D2CollectionItemsColumnModel;
      options.d2ActionsOptions = options.d2ActionsOptions || {
        menuType: constants.MenuTypes.COLLECTION_ITEMS,
        widgetType: widgetConstants.D2.COLLECTIONS
      };
      options.delayedActionsOptions = options.d2ActionsOptions;
      this.options = options;
      CollectionItemsWidgetCollection.__super__.constructor.call(this, models, options);
      this.makeCollectionResource(options).makeD2Fetchable(options);
      this.nodeFacets = new NodeFacetCollection();
      this.nodeD2FilterConfig = {};
      this.avaliableD2FilterConfigFacets = {};
      this.listenTo(this, "before:delayed:data:send", parameters => {
        if (this.widgetPreference && this.widgetPreference.widgetName && this.widgetPreference.widgetType) {
          _.extend(parameters, {
            widgetName: this.widgetPreference.widgetName,
            widgetType: this.widgetPreference.widgetType
          });
        }
      });
    },
    url: function() {
      if (this.orderBy.includes("parent_id")) {
        return false;
      }
      if (this._lastFilterAndSortCriteria && !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy) && this.columnPreference) {
        this.sortOrderChanged = true;
        this._saveColumnPreference();
      }
      var filter, lastFilter;
      if (this.filters) {
        filter = _.omit(this.filters, function(value) {
          return _.isUndefined(value) || _.isEmpty(value);
        });
      }
      if (this._lastFilterAndSortCriteria && this._lastFilterAndSortCriteria.filters) {
        lastFilter = _.omit(this._lastFilterAndSortCriteria.filters, function(value) {
          return _.isUndefined(value) || _.isEmpty(value);
        });
      }
      var forceServerSideFilter = false;
      if (this.fetched === undefined && filter && _.keys(filter).length === 1) {
        forceServerSideFilter = true;
        this.initialServerSideFilter = true;
      }
      if (this.hasMoreRecords === true || forceServerSideFilter) {
        if (!_.isEqual(filter, lastFilter) || !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy)) {
          this.reload = true;
          this.serverFilterEnabled = true;
        }
        var filterArray = filter && _.keys(filter) || [];
        if (filterArray.length > 0) {
          this.serverFilterColumn = filterArray[0];
          this.serverFilterValue = filter[this.serverFilterColumn];
        } else {
          this.serverFilterColumn = this.serverFilterValue = undefined;
        }
        this.hadMoreRecords = true;
      } else if (this.hadMoreRecords === true && this.serverFilterColumn) {
        var filterValue = filter[this.serverFilterColumn];
        if (filterValue !== this.serverFilterValue) {
          this.reload = true;
          this.filters = _.omit(this.filters, function(value, key) {
            return key !== this.serverFilterColumn;
          }, this);
        }
        this.serverFilterValue = filterValue;
      }
      var links = this.options.parentNode.get("links"), url = RestLinkrels.getLink(links, RestLinkrels.D2_COLLECTION_ITEMS), qParams = !this.expanded ? {} : {
        scope: this,
        paginate: false,
        clientColumns: this.clientColumns,
        sort: _.isString(this.orderBy) ? this.orderBy.toLowerCase().trim().split(" ") : [],
        filter: !_.isEmpty(this.serverFilterColumn),
        facetFilter: this.serverFacetFilters && (!_.isEmpty(this.serverFacetFilters.facetFilters) || !_.isEmpty(this.serverFacetFilters.categoryFilters))
      };
      var preferenceFilterId = this.columnPreference?.get("d2sv_widget_state")?.filter;
      var filterConfig = FilterUtils.fetchFilterConfig({
        selectedFilterName: !this.nodeD2FilterConfig.facetvalue ? preferenceFilterId : this.nodeD2FilterConfig.facetvalue,
        d2FilterConfigs: this?.avaliableD2FilterConfigFacets
      });
      var filterItem = _.find(filterConfig?.topics, function(topic) {
        return topic.checked === true;
      });
      if (filterItem) {
        qParams["extraParams"] = {
          filter_config_name: filterItem.value,
          "include-all-versions": filterItem.all_versions
        };
      }
      return serverQueryUtils.appendQueryParams(url, qParams) + "&include-total=true";
    },
    add: function(models, options) {
      CollectionItemsWidgetCollection.__super__.add.call(this, models, options);
    },
    sync: function(method, response, options) {
      if (options.parentNode) {
        this.options.parentNode = options.parentNode;
      }
      var promise = $.Deferred();
      var me = this, widgetConfig;
      if (me.expanded || me.options.expanded) {
        me.expanded = true;
        if (me.options.widgetName) {
          widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.COLLECTIONS, me.options.widgetName);
        }
      }
      me.avaliableD2FilterConfigFacets = me.options.parentNode.collection.avaliableD2FilterConfigFacets;
      me.fetchColumnPreferences(me.options.widgetName, widgetConfig).done(function() {
        me.fetchCollectionData(method, response, options).done(function() {
          promise.resolve();
        }).fail(function(err) {
          promise.reject(err);
        });
      }).fail(function(err) {
        promise.reject(err);
      });
      return promise.promise();
    },
    fetchCollectionData: function(method, collection, options) {
      var deferred = $.Deferred(), me = this, originalSuccess = options.success, originalError = options.error;
      options.error = function() {
        originalError.apply(options.context, arguments);
        deferred.reject.apply(this, arguments);
      };
      options.success = function() {
        originalSuccess.apply(options.context, arguments);
        deferred.resolve();
      };
      Backbone.sync.call(me, method, collection, options);
      return deferred.promise();
    },
    parse: function(response) {
      this.hasMoreRecords = response["has-more-records"];
      this.totalFromServer = response["total"];
      this.parseFacets();
      return _.isArray(response.entries) ? _.map(response.entries, function(entry) {
        var obj = entry.content;
        _.extend(obj.properties, {
          id: obj.properties["r_object_id"],
          name: obj.properties["object_name"],
          links: obj.links,
          parentLinks: response?.links,
          updated: entry.updated
        });
        return obj.properties;
      }) : [];
    },
    parseFacets: function() {
      var preferenceFilterId = this?.columnPreference?.get("d2sv_widget_state")?.filter;
      var filterConfig = FilterUtils.fetchFilterConfig({
        selectedFilterName: preferenceFilterId,
        d2FilterConfigs: this?.avaliableD2FilterConfigFacets
      });
      var filters = this.nodeFacets.filters;
      var newfacets = [ filterConfig ];
      var clone = JSON.parse(JSON.stringify(newfacets));
      if (filters.length === 0) {
        this.baseFacets = null;
      }
      var facetsArr = FacetUtils.computeFacets(clone, this.baseFacets, filters);
      if (!this.baseFacets) {
        this.baseFacets = JSON.parse(JSON.stringify(newfacets));
      }
      this.nodeFacets.reset(facetsArr);
    }
  });
  CollectionResourceMixin.mixin(CollectionItemsWidgetCollection.prototype);
  D2FetchableMixin.mixin(CollectionItemsWidgetCollection.prototype);
  var oldFetch = CollectionItemsWidgetCollection.prototype.fetch;
  CollectionItemsWidgetCollection.prototype.fetch = function(options) {
    if (options?.d2filterApplied) {
      options.reload = true;
    }
    return oldFetch.call(this, options);
  };
  return CollectionItemsWidgetCollection;
});