/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/utils/url", "nuc/lib/jquery", "nuc/models/browsable/client-side.mixin", "csui/models/node.facets/facet.query.mixin", "csui/utils/accessibility", "nuc/models/node.columns2", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "dctmw/server.adaptors/converters/node", "d2/server.adaptors/converters/servercolumns", "d2/server.adaptors/models/client-side.type.filter.mixin", "d2/server.adaptors/models/node.multiple.actions.mixin", "dctmw/models/mixins/collection.delayed.data.mixin", "d2/server.adaptors/models/d2.fetchable.mixin", "d2/utils/server.query.utils", "d2/utils/search.utils", "d2/utils/facet.utils", "d2/utils/sort.utils", "dctmw/utils/utils", "d2/utils/constants", "d2/utils/widget.constants", "i18n!d2/widgets/search.results/nls/lang", "i18n!csui/widgets/search.results/impl/nls/lang" ], function(_, Url, $, ClientSideBrowsableMixin, FacetQueryMixin, Accessibility, NodeColumn2Collection, RestResources, RestLinkrels, NodeConverter, serverColumnsConverter, ClientSideTypeFilterMixin, NodeMultipleActionsMixin, DelayedDataMixin, D2FetchableMixin, serverQueryUtils, searchUtils, facetUtils, sortUtils, utils, constants, widgetConstants, lang, csuiSearchResultsLang) {
  "use strict";
  function refreshRequired(previousQuery, currentQuery, previousConstraint, currentConstraint) {
    return !_.isEqual(previousQuery, currentQuery) || !_.isEqual(previousConstraint, currentConstraint);
  }
  function searchQueryParam() {
    var queryParam = {};
    queryParam["term"] = this.options.query.get("where");
    if (this.options.query.get("current-folder-id") && this.options.query.get("descend")) {
      queryParam["current-folder-id"] = this.options.query.get("current-folder-id");
      queryParam["descend"] = this.options.query.get("descend") === "true";
    }
    if (this.options.query.get("filtered-search")) {
      queryParam["filtered-search"] = this.options.query.get("filtered-search") === "true";
    }
    queryParam["process-facets"] = true;
    if (this.options.subTypeFilters) {
      queryParam["object-types"] = this.options.subTypeFilters;
    }
    return queryParam;
  }
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      ClientSideBrowsableMixin.mixin(prototype);
      FacetQueryMixin.mixin(prototype);
      NodeMultipleActionsMixin.mixin(prototype);
      DelayedDataMixin.mixin(prototype);
      D2FetchableMixin.mixin(prototype);
      var superSyncMethod = prototype.sync;
      var superFetchMethod = prototype.fetch;
      var proto = _.extend(prototype, {
        makeServerAdaptor: function(options) {
          var filterQueryParameterName = "facet-id-constraints";
          this.makeClientSideBrowsable(options);
          options.filterQueryParameterName = filterQueryParameterName;
          this.makeFacetQuery(options);
          this.columnTypes = {};
          this.options = this.options || {};
          this.widgetType = widgetConstants.D2.DOCLIST;
          this.enableDelayedDataFetch(options).makeD2Fetchable(options);
          return this;
        },
        populateSortDropDown: function() {
          if (this.response) {
            this.defaultOrderBy = searchUtils.getDefaultOrderBy(this.response["sorted-by"], this.response["sort-direction"]);
            if (this.defaultOrderBy && this.defaultOrderBy.indexOf("score") === 0) {
              var scoreColumn = _.findWhere(this.clientColumns, {
                column_key: "score"
              });
              scoreColumn.sort = true;
            } else {
              var nameColumn = _.findWhere(this.clientColumns, {
                column_key: "name"
              });
              nameColumn.sort = true;
            }
            var sortDetails = searchUtils.parseSortOrder(this.clientColumns, this.orderBy, this.defaultOrderBy);
            this.previousOrderBy = sortDetails.orderBy;
            if (!utils.isMobile()) {
              this.orderBy = this.orderBy || this.defaultOrderBy;
            }
            this.sorting = sortDetails.sorting;
            this.selectedSettings = "SO";
          }
        },
        parseFacets: function(response) {
          if (response.facets && response.facets.length) {
            this.searchFacetsExist = true;
          }
          if (this.searchFacets) {
            var filters = this.searchFacets.filters;
            var newfacets = facetUtils.parseNewFacets(response.facets);
            var clone = JSON.parse(JSON.stringify(newfacets));
            if (filters.length === 0) {
              this.baseFacets = null;
            }
            var facetsArr = facetUtils.computeFacets(clone, this.baseFacets, filters);
            if (!this.baseFacets) {
              this.baseFacets = JSON.parse(JSON.stringify(newfacets));
            }
            this.searchFacets.reset(facetsArr);
          }
        },
        fetch: function(options) {
          options = options || {};
          var currentConstraint = JSON.stringify({});
          currentConstraint = JSON.stringify(this.getFilterQuery(this.searchFacets ? this.searchFacets.filters : []));
          if (options.reset === undefined) {
            options.reset = true;
          }
          var refreshBaseFacets = !_.isEqual(this.previousQuery, searchQueryParam.call(this));
          if (refreshBaseFacets) {
            this.baseFacets = null;
          }
          if (refreshRequired(this.previousQuery, searchQueryParam.call(this), this.previousConstraint, currentConstraint)) {
            options.reload = true;
          }
          this.populateSortDropDown();
          return superFetchMethod.call(this, options);
        },
        getUrl: function() {
          var queryParam = searchQueryParam.call(this);
          this.skipCount = this.orderBy && this.previousOrderBy !== this.orderBy ? 0 : this.skipCount;
          var currRepo = RestResources.getCurrentRepository();
          var url = RestLinkrels.getLink(currRepo.get("links"), RestLinkrels.QUICK_SEARCH);
          var query = serverQueryUtils.appendQueryParams(url, {
            scope: this,
            widgetName: this.widgetName,
            extraParams: queryParam
          });
          this.previousQuery = queryParam;
          this.searching = this.searching || {};
          this.searching.result_title = lang.searchResultsTitle + queryParam["term"];
          return query;
        },
        parse: function(response, options) {
          this.response = response;
          this.actualSkipCount = 0;
          this.parseFacets(response);
          this.populateSortDropDown();
          return searchUtils.parseItems(response, options);
        },
        sync: function(method, model, options) {
          this.trigger("request", model, {}, options);
          var deferred = $.Deferred();
          var w = RestResources.getCurrentUser().get("defaultWidgets");
          this.widgetName = w[widgetConstants.DEFAULT.SEARCH] || "";
          this.options.widgetName = this.widgetName;
          if (!this.clientColumns) {
            this.columnTypes = {};
            var me = this, widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.DOCLIST, me.widgetName), isDisableLocationColumn = widgetConfig.getParam("is_disable_loc_col_smartview") === "true", showCommentColumn = widgetConfig.getParam("is_disable_cmts_col_smartview") !== "true" && me.isTargetBrowse !== true;
            me.isDisableLocationColumn = isDisableLocationColumn;
            me.options.isDisableLocationColumn = isDisableLocationColumn;
            me.options.showCommentColumn = showCommentColumn;
            searchUtils.getColumnPref(fetchData, isDisableLocationColumn, superSyncMethod, arguments, me, deferred);
          } else {
            fetchData(null, superSyncMethod, arguments, this, deferred);
          }
          function fetchData(data, superSyncMethod, args, ctx, deferred) {
            if (data != null) {
              data.clientCols.push({
                column_key: "score",
                key: "score",
                definitions_order: 800,
                title: lang.columnTitleRanking,
                type: 6
              });
              if (Accessibility.isAccessibleTable()) {
                data.clientCols.push({
                  column_key: "summary",
                  key: "summary",
                  definitions_order: 900,
                  title: csuiSearchResultsLang.summaryColumnTitle,
                  type: -1
                });
              }
              ctx.searching = {};
              var clonedCols = JSON.parse(JSON.stringify(data.clientCols));
              _.each(clonedCols, function(col) {
                col.sort = false;
              });
              var sortedColumns = new NodeColumn2Collection();
              sortedColumns.reset(clonedCols);
              ctx.searching.sortedColumns = sortedColumns;
              ctx.clientColumns = data.clientCols;
            }
            var postbody = ctx.searchFacets ? ctx.getFilterQuery(ctx.searchFacets.filters) || {} : {};
            ctx.previousConstraint = JSON.stringify(postbody);
            $.ajax(ctx.connector.extendAjaxOptions({
              url: ctx.getUrl(),
              type: "POST",
              headers: {
                Accept: constants.MediaTypes.DCTM_D2_V1_JSON,
                "Content-Type": constants.MediaTypes.DCTM_D2_V1_JSON
              },
              data: ctx.previousConstraint,
              success: function(searchResults) {
                if (searchResults["has-more-records"]) {
                  ctx.hasMoreRecords = true;
                  ctx.totalFromServer = _.str.sformat(lang.totalItems, searchResults.entries.length);
                } else {
                  ctx.hasMoreRecords = false;
                }
                var isFullText = searchResults["sorted-by"] === "score";
                if (!isFullText) {
                  var sortedColumns = new NodeColumn2Collection();
                  var cols = _.reject(ctx.clientColumns, function(col) {
                    return col.key === "score";
                  });
                  sortedColumns.reset(cols);
                  ctx.searching.sortedColumns = sortedColumns;
                }
                options.success.call(options.context, searchResults, "success", {});
                deferred.resolve();
              },
              error: function(error) {
                let errorMessage = utils.parseAjaxError(error);
                options.error && options.error(errorMessage);
                deferred.reject(error);
              }
            }));
          }
          return deferred.promise();
        },
        fetchDelayedData: function(options) {
          options = options || {};
          var me = this, params = {
            ids: options.nodes,
            connector: me.connector,
            permissions: {
              permissionLevel: "read"
            },
            favorites: true,
            externalShare: true
          };
          if (!me.isDisableLocationColumn) {
            _.extend(params, {
              locations: {
                fullPath: false
              }
            });
          }
          if (me.options && me.options.showCommentColumn) {
            _.extend(params, {
              commentsCount: true
            });
          }
          return serverQueryUtils.fetchDataAsPropertiesForObjects(params);
        },
        compareObjectsForSort: function(property, left, right) {
          var sortSchema = this.columnTypes[property];
          if (!sortSchema) {
            this.columnTypes[property] = {};
            sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
            this.columnTypes[property] = sortSchema;
          }
          return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, false);
        }
      });
      ClientSideTypeFilterMixin.mixin(prototype);
      return proto;
    }
  };
  return ServerAdaptorMixin;
});