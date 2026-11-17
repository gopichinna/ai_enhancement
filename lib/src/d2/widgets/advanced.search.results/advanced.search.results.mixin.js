/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/models/browsable/client-side.mixin", "csui/models/node.facets/facet.query.mixin", "csui/utils/accessibility", "dctmw/models/mixins/collection.delayed.data.mixin", "nuc/models/node.columns2", "d2/models/table/column.preference", "d2/server.adaptors/converters/servercolumns", "dctmw/utils/rest.resources", "d2/utils/graphics/graphics.resources", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/utils/search.utils", "d2/utils/facet.utils", "d2/utils/sort.utils", "d2/utils/constants", "dctmw/utils/utils", "d2/utils/widget.constants", "i18n!d2/widgets/advanced.search.results/nls/lang" ], function(_, $, ClientSideBrowsableMixin, FacetQueryMixin, Accessibility, DelayedDataMixin, NodeColumn2Collection, ColumnPreferenceModel, serverColumnsConverter, RestResources, GraphicsResources, RestLinkrels, serverQueryUtils, searchUtils, facetUtils, sortUtils, constants, utils, widgetConstants, lang) {
  "use strict";
  return {
    mixin: function(prototype) {
      ClientSideBrowsableMixin.mixin(prototype);
      FacetQueryMixin.mixin(prototype);
      DelayedDataMixin.mixin(prototype);
      var superFetchMethod = prototype.fetch;
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          this.makeClientSideBrowsable(options);
          options.filterQueryParameterName = "facet-id-constraints";
          this.makeFacetQuery(options);
          this.columnTypes = {};
          this.options = this.options || {};
          this.widgetType = widgetConstants.D2.DOCLIST;
          this.enableDelayedDataFetch(options);
          return this;
        },
        fetch: function(options) {
          options = options || {};
          if (this.fromMetdataData) {
            options.reload = true;
            this.populateSortDropDown(options);
          } else {
            if (options.filterChanged) {
              this.searchMetadataObj.fetch();
            } else {
              this.populateSortDropDown(options);
            }
          }
          if (!utils.isMobile() || utils.isMobile() && options.reset === undefined) {
            options.reset = true;
          }
          return superFetchMethod.call(this, options);
        },
        getFacetConstraintQuery: function() {
          return this.getFilterQuery(this.searchFacets.filters) || {};
        },
        populateSortDropDown: function(options) {
          if (this.response && this.response["column-preference"]) {
            this.clientColumns = this.convertColumns(this.response["column-preference"].columns, null);
            this.defaultOrderBy = searchUtils.getDefaultOrderBy(this.response["sorted-by"], this.response["sort-direction"]);
            if (utils.isMobile()) {
              this.trigger("orderBy:change");
            } else {
              if (this.defaultOrderBy && this.defaultOrderBy.indexOf("score") === 0) {
                var scoreColumn = _.findWhere(this.clientColumns, {
                  column_key: "score"
                });
                scoreColumn.sort = true;
              }
              var sortDetails = searchUtils.parseSortOrder(this.clientColumns, this.orderBy, this.defaultOrderBy);
              this.previousOrderBy = sortDetails.orderBy;
              this.orderBy = this.orderBy || this.defaultOrderBy;
              this.sorting = sortDetails.sorting;
              this.columnTypes = {};
              this.selectedSettings = "SO";
              if (options && options.addnlOptions && options.addnlOptions.resetColumnPref === true) {
                this.orderBy = this.defaultOrderBy;
                this.columns.reset(this.clientColumns);
              }
            }
          }
        },
        parseFacets: function(response) {
          if (response.facets && response.facets.length) {
            this.searchFacetsExist = true;
          }
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
        },
        convertColumns: function(cols) {
          var isFullText = this.response && this.response["sorted-by"] === "score", options = {};
          if (isFullText) {
            cols.push({
              label: lang.ranking,
              name: "score",
              type: 6
            });
          }
          if (Accessibility.isAccessibleTable()) {
            cols.push({
              label: lang.summaryColumnTitle,
              name: "summary",
              type: -1
            });
          }
          var nameColumn = _.findWhere(cols, {
            name: "object_name"
          }), isSavedSearch = !!(this.searchMetadataObj && this.searchMetadataObj.isSavedSearch);
          if (!nameColumn && !isSavedSearch) {
            cols.unshift({
              label: lang.name,
              name: "name",
              type: -1
            });
          }
          if (this.widgetConfig && !this.isDisableLocationColumn) {
            cols.splice(1, 0, {
              label: lang.location,
              name: "parent_id",
              type: -1
            });
            options["locationColumn"] = {};
            options.locationColumn.enabled = true;
          }
          if (this.widgetConfig && this.options.showCommentColumn) {
            cols.push({
              label: "",
              name: "wnd_comments",
              type: -1
            });
            options["commentColumn"] = true;
          }
          var columnPreference = new ColumnPreferenceModel({
            colType: "default"
          });
          columnPreference.columns.reset(cols);
          return serverColumnsConverter.convertColumns(columnPreference, options);
        },
        parse: function(response, options) {
          this.response = response;
          this.actualSkipCount = 0;
          this.parseFacets(response);
          this.populateSortDropDown(options);
          if (!this.sortedColumns) {
            this.sortedColumns = new NodeColumn2Collection();
            var clonedCols = JSON.parse(JSON.stringify(this.clientColumns));
            _.each(clonedCols, function(col) {
              col.sort = false;
            });
            this.sortedColumns.reset(clonedCols);
            this.searching = this.searching || {};
            this.searching.sortedColumns = this.sortedColumns;
          }
          this.populateSortDropDown(options);
          return searchUtils.parseItems(response);
        },
        sync: function(method, model, options) {
          this.fromMetdataData = false;
          this.trigger("request", model, {}, options);
          var me = this;
          var deferred = $.Deferred();
          var w = RestResources.getCurrentUser().get("defaultWidgets");
          this.widgetName = w[widgetConstants.DEFAULT.SEARCH] || "";
          this.options.widgetName = this.widgetName;
          var searchResults = this.response;
          var hasData = searchResults && searchResults.entries && searchResults.entries.length;
          setTimeout(function() {
            me.searching = me.searching || {};
            if (me.searchMetadataObj && me.searchMetadataObj.isLastSearch) {
              searchResults.saved_search_name = lang.myLastSearch;
            }
            me.searching.title = searchResults.saved_search_name;
            me.searching.result_title = searchResults.saved_search_name === "lastSearch" ? lang.searchResultsWithoutNameTitle : _.str.sformat(lang.searchResultsTitle, searchResults.saved_search_name);
            if (hasData) {
              if (searchResults["has-more-records"]) {
                me.hasMoreRecords = true;
                me.totalFromServer = _.str.sformat(lang.totalItems, searchResults.entries.length);
              } else {
                me.hasMoreRecords = false;
              }
              var widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.DOCLIST, me.widgetName);
              var isDisableLocationColumn = widgetConfig && widgetConfig.getParam("is_disable_loc_col_smartview") === "true" || false;
              var showCommentColumn = widgetConfig.getParam("is_disable_cmts_col_smartview") !== "true";
              me.widgetConfig = widgetConfig;
              me.isDisableLocationColumn = isDisableLocationColumn;
              me.options.isDisableLocationColumn = isDisableLocationColumn;
              me.options.showCommentColumn = showCommentColumn;
              deferred.fail(options.error);
            }
            options.success.call(options.context, searchResults, "success", {});
            deferred.resolve();
          }, 0);
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
            externalShare: true,
            workspaceContainment: !!RestResources.getCurrentUser()?.get("defaultWidgets")?.[widgetConstants.DEFAULT.BWS]
          };
          if (!me.isDisableLocationColumn) {
            _.extend(params, {
              locations: {
                fullPath: false,
                ancestorDetails: GraphicsResources.hasConditionAttributes()
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
    }
  };
});