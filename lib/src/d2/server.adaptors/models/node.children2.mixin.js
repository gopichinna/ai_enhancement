/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/log", "csui/models/nodefacets", "nuc/models/browsable/client-side.mixin", "csui/models/node.facets/facet.query.mixin", "nuc/utils/url", "dctmw/server.adaptors/converters/node", "d2/server.adaptors/converters/servercolumns", "d2/server.adaptors/models/client-side.type.filter.mixin", "d2/server.adaptors/models/node.multiple.actions.mixin", "dctmw/models/mixins/collection.delayed.data.mixin", "d2/server.adaptors/models/d2.fetchable.mixin", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "d2/utils/search.utils", "d2/utils/sort.utils", "d2/utils/constants", "d2/utils/widget.constants", "d2/utils/facet.utils", "d2/utils/node.utils", "d2/utils/filter.utils", "dctmw/utils/utils", "d2/controls/globalmessage/globalmessage", "i18n!d2/server.adaptors/models/impl/nls/lang" ], function(require, module, $, _, Log, NodeFacetCollection, ClientSideBrowsableMixin, FacetQueryMixin, Url, nodeConverter, serverColumnsConverter, ClientSideTypeFilterMixin, NodeMultipleActionsMixin, DelayedDataMixin, D2FetchableMixin, RestLinkrels, RestResources, serverQueryUtils, searchUtils, sortUtils, constants, widgetConstants, FacetUtils, nodeUtils, FilterUtils, utils, globalMessage, lang) {
  "use strict";
  var config = _.extend({
    showFavoriteColumn: true
  }, module.config());
  const logger = Log(module.id);
  return {
    mixin: function(prototype) {
      ClientSideBrowsableMixin.mixin(prototype);
      FacetQueryMixin.mixin(prototype);
      NodeMultipleActionsMixin.mixin(prototype);
      DelayedDataMixin.mixin(prototype);
      D2FetchableMixin.mixin(prototype);
      var superSyncMethod = prototype.sync, superFetchMethod = prototype.fetch;
      var proto = _.extend(prototype, {
        makeServerAdaptor: function(options) {
          this.makeClientSideBrowsable(options);
          this.enableDelayedDataFetch(options);
          this.columnTypes = {};
          this.nodeFacets = new NodeFacetCollection();
          this.nodeFacets.isFetchable = false;
          this.nodeD2FilterConfig = {};
          this.avaliableD2FilterConfigFacets = {};
          this.ignoreServerSortOnRestrictedColumns = true;
          return this;
        },
        fetchDelayedData: function(options) {
          var me = this, queryUtilOptions = {
            ids: options.nodes,
            connector: me.node.connector,
            permissions: {
              permissionLevel: "read"
            },
            externalShare: true,
            favorites: config.showFavoriteColumn !== false
          };
          if (me.options && me.options.showCommentColumn) {
            _.extend(queryUtilOptions, {
              commentsCount: true
            });
          }
          const widgetDetails = me.node.get("widgetPreference");
          if (widgetDetails.widgetName && widgetDetails.widgetType) {
            _.extend(queryUtilOptions, {
              widgetName: widgetDetails.widgetName,
              widgetType: widgetDetails.widgetType,
              isTargetBrowse: this.isTargetBrowse
            });
          }
          return serverQueryUtils.fetchDataAsPropertiesForObjects(queryUtilOptions);
        },
        fetch: function(options) {
          options = options || {};
          this.serverFilterEnabled = false;
          this.clientFilterWithFacets = false;
          var widgetPreference = this.node.get("widgetPreference");
          options = options || {};
          if (widgetPreference) {
            this.options = this.options || {};
            this.widgetType = widgetPreference.widgetType;
            this.options.widgetName = widgetPreference.widgetName;
            this.options.showCommentColumn = widgetPreference.widgetConfig.getParam("is_disable_cmts_col_smartview") !== "true";
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
            if (this.oldNodeId !== this.node.get("id")) {
              this.oldNodeId = this.node.get("id");
            }
          }
          if (lastFilter !== undefined && JSON.stringify(filter) !== JSON.stringify(lastFilter) && this.nodeFacets?.filters.length > 0) {
            forceServerSideFilter = true;
            options.reload = true;
          }
          if (options.d2filterApplied) {
            forceServerSideFilter = true;
            options.reload = true;
          }
          if (this.initialServerSideFilter === true) {
            this.serverFilterEnabled = true;
          }
          if (this.oldNodeId !== this.node.get("id")) {
            this.oldNodeId = this.node.get("id");
            options.reload = true;
            this.hadMoreRecords = false;
          } else if (this.hasMoreRecords === true || forceServerSideFilter) {
            if (!_.isEqual(filter, lastFilter) || !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy)) {
              options.reload = true;
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
              options.reload = true;
              this.filters = _.omit(this.filters, function(value, key) {
                return key !== this.serverFilterColumn;
              }, this);
            }
            this.serverFilterValue = filterValue;
          }
          if (!_.isEqual(filter, lastFilter)) {
            this.fetchFacets = false;
          }
          if (this._lastFilterAndSortCriteria && this._lastFilterAndSortCriteria.orderBy && !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy) && (widgetPreference && widgetPreference.columnPreference)) {
            this._saveColumnPreference(widgetPreference.widgetName, widgetPreference.columnPreference);
            options.sortOrderChanged = true;
          }
          this._setExpectedSortingResponse(this.orderBy);
          var currentConstraint = this.getFilterQuery(this.nodeFacets.filters) || {};
          this.setOptionsForConstraintChange(options, currentConstraint);
          this.setOptionsForFilterChange(options, currentConstraint);
          this.setOptionsForSkipCountChange(options);
          if (this.facetsfetched === undefined && options.fetchFacetsInit === true) {
            this.facetsfetched = true;
            options.refreshFacets = true;
            options.reload = true;
          }
          if (utils.isMobile() && options.fetchFacetsInit) {
            this.fetchFacets = true;
          }
          var me = this;
          options.success = function(ctx, model, response) {
            if (widgetConstants.ServerTableModesConstants.GRID === me._getWidgetDisplayMode()) {
              me.loadThumbnails();
            }
            if (!nodeConverter.isNonDCTMNode(me.node)) {
              if (me.facetsfetched && !response.reload && !response.skipCountChanged && !response.sortOrderChanged || response.refreshFacets) {
                var models = ctx.lastFilteredAndSortedModels;
                if (models.length) {
                  var ids = [];
                  _.each(models, function(model) {
                    ids.push(model.get("id"));
                  });
                  if (ids) {
                    if (!me.fetchFacets) {
                      var postData = me.hasMoreRecords ? {} : FacetUtils.getExprPostBody(ids), isMobile = utils.isMobile();
                      me.trigger(!isMobile ? "request" : "facet:fetch:start", me, {}, options);
                      me.fetchFacetsForObjects(postData).always(function() {
                        me.trigger(!isMobile ? "sync" : "facet:fetch:end", me, postData, options);
                      }).fail(function(xhr) {
                        me.trigger(!isMobile ? "error" : "facet:fetch:error", me, xhr, options);
                      });
                    }
                  }
                } else {
                  me.parseFacets({});
                }
              }
            }
          };
          return superFetchMethod.call(this, options);
        },
        _getWidgetDisplayMode: function() {
          var widgetState = this.node?.get("widgetPreference")?.columnPreference?.get("d2sv_widget_state");
          return widgetState && widgetState["table_mode"];
        },
        _setExpectedSortingResponse: function(orderBy) {
          if (orderBy) {
            this.sorting = {
              sort: [ {
                key: "sort",
                value: orderBy.split(" ").reverse().join("_")
              } ]
            };
          }
        },
        setOptionsForConstraintChange: function(options, currentConstraint) {
          this.previousConstraint = this.previousConstraint || {};
          if (JSON.stringify(currentConstraint) !== JSON.stringify(this.previousConstraint)) {
            options.reload = true;
            if (!_.isEmpty(this.filters) && !this.serverFilterEnabled) {
              options.refreshFacets = true;
            }
          }
        },
        setOptionsForFilterChange: function(options, currentConstraint) {
          if (this._lastFilterAndSortCriteria && !_.isEqual(this.filters, this._lastFilterAndSortCriteria.filters)) {
            if (!_.isEmpty(this.filters) && !_.isEmpty(currentConstraint)) {
              options.reload = true;
              this.clientFilterWithFacets = true;
              if (!this.serverFilterEnabled) {
                options.refreshFacets = true;
              }
            } else if (!this.serverFilterEnabled && _.isEmpty(this.filters)) {
              if (!_.difference(this.allModels, this.lastFilteredAndSortedModels).length) {
                options.reload = true;
              }
              options.refreshFacets = true;
            }
          } else if (!this.hasMoreRecords && !_.isEmpty(this.filters)) {
            this.clientFilterWithFacets = true;
          }
        },
        setOptionsForSkipCountChange: function(options) {
          if (!_.isEqual(this.previousSkipCount, this.skipCount)) {
            options.skipCountChanged = true;
          }
          this.previousSkipCount = this.skipCount;
        },
        fetchFacetsForObjects: function(data) {
          var deferred = $.Deferred(), me = this;
          $.ajax(this.connector.extendAjaxOptions({
            url: this.getFacetsUrl(),
            type: "POST",
            headers: {
              "Content-Type": constants.MediaTypes.DCTM_JSON
            },
            data: JSON.stringify(data),
            success: function(response) {
              me.parseFacets(response);
              deferred.resolve(response);
            },
            error: function(request) {
              deferred.reject(request);
            }
          }));
          return deferred.promise();
        },
        getFacetsUrl: function() {
          var url = RestLinkrels.getLink(this.node.get("links"), RestLinkrels.OBJECTS_FACETS);
          url = Url.appendQuery(url, Url.combineQueryString({
            "parent-id": this.node.get("parent_id")
          }));
          var extraParams = {
            "process-facets-only": true
          }, widgetPreference = this.node.get("widgetPreference") || {}, subTypeFilters = this.options && this.options.subTypeFilters;
          if (!_.isEmpty(this.nodeD2FilterConfig)) {
            extraParams["filter-name"] = this.nodeD2FilterConfig.facetvalue;
          }
          var params = {
            scope: this,
            extraParams: extraParams,
            widgetName: widgetPreference.widgetName || "",
            widgetType: widgetPreference.widgetType || "",
            clientColumns: widgetPreference.clientColumns,
            sort: !_.isEmpty(this.orderBy),
            filter: !_.isEmpty(this.filters),
            subTypeFilters: subTypeFilters
          };
          return serverQueryUtils.appendQueryParams(url, params);
        },
        getUrl: function(ignoreFilter) {
          var url, subTypeFilters, currRepo = RestResources.getCurrentRepository();
          if (nodeConverter.isRepositoryNode(this.node)) {
            if (!this.serverFilterEnabled && this.clientFilterWithFacets) {
              ignoreFilter = true;
            }
            url = RestLinkrels.getLink(currRepo.get("links"), RestLinkrels.D2_CABINETS);
          } else if (nodeConverter.isFavoritesNode(this.node)) {
            url = RestLinkrels.getLink(currRepo.get("links"), RestLinkrels.D2_FAVORITES);
          } else if (nodeConverter.isDQLNode(this.node)) {
            url = RestLinkrels.getLink(currRepo.get("links"), RestLinkrels.DQL_DOCLIST_OBJECTS);
            url = Url.appendQuery(url, Url.combineQueryString({
              "parent-id": this.node.get("parent_id")
            }));
          } else {
            url = RestLinkrels.getLink(this.node.get("links"), RestLinkrels.OBJECTS_FACETS);
            url = Url.appendQuery(url, Url.combineQueryString({
              "parent-id": this.node.get("parent_id")
            }));
            subTypeFilters = this.options && this.options.subTypeFilters;
          }
          var widgetPreference = this.node.get("widgetPreference") || {}, params = {
            scope: this,
            widgetName: widgetPreference.widgetName || "",
            widgetType: widgetPreference.widgetType || "",
            clientColumns: widgetPreference.clientColumns,
            sort: !_.isEmpty(this.orderBy),
            filter: !(_.isEmpty(this.filters) || ignoreFilter),
            subTypeFilters: subTypeFilters,
            ignoreServerSortOnRestrictedColumns: this.ignoreServerSortOnRestrictedColumns
          }, columnPreference = widgetPreference?.columnPreference;
          if (this.facetConfig && !utils.isMobile()) {
            this.fetchFacets = columnPreference?.get("d2sv_widget_state").left_panel === widgetConstants.ServerLeftPanelConstants.FACET;
          }
          this.fetchFacets = this.fetchFacets || this.nodeFacets.filters.length > 0;
          if (typeof this.url_filter !== "undefined") {
            params.urlFilter = this.url_filter;
          }
          if (!_.isEmpty(this.filters)) {
            params["filter"] = !_.isEmpty(this.filters);
          }
          if (!nodeConverter.isNonDCTMNode(this.node)) {
            var extraParams = {
              "process-facets": this.fetchFacets,
              "include-all-versions": columnPreference?.get("d2sv_widget_state")?.show_all_version || false
            };
            if (this.isTargetBrowse === undefined || !this.isTargetBrowse) {
              var preferenceFilterId = columnPreference?.get("d2sv_widget_state")?.filter;
              var filterConfig = FilterUtils.fetchFilterConfig({
                selectedFilterName: !this.nodeD2FilterConfig.facetvalue ? preferenceFilterId : this.nodeD2FilterConfig.facetvalue,
                d2FilterConfigs: this?.avaliableD2FilterConfigFacets
              });
              var filterItem = _.find(filterConfig?.topics, function(topic) {
                return topic.checked === true;
              });
              if (filterItem) {
                extraParams["filter-name"] = filterItem.value;
                extraParams["include-all-versions"] = filterItem.all_versions;
              }
            }
            params["extraParams"] = extraParams;
          }
          return serverQueryUtils.appendQueryParams(url, params);
        },
        url: function() {
          return this.getUrl(false);
        },
        parse: function(response) {
          this.hasMoreRecords = response["has-more-records"];
          this.totalFromServer = response["total"];
          this.parseFacets(response);
          if (this.initialServerSideFilter === true && this.hasMoreRecords === false && serverQueryUtils._isTableFilterApplied(this.filters) === false) {
            this.hadMoreRecords = false;
            this.initialServerSideFilter = false;
          }
          return serverQueryUtils.parseResponse(response, {
            scope: this,
            propertiesFn: function(entry) {
              return entry.content;
            }
          });
        },
        sync: function(method, collection, options) {
          if (method !== "read") {
            throw new Error("Only fetching the node children collection is supported");
          }
          var me = this, promise = $.Deferred();
          if (utils.isMobile() && this.node.get("id") === constants.NodeId.FAVORITES) {
            options.force = true;
          }
          me.fetchFilterConfig().done(function() {
            me.fetchWidgetData(options).done(function() {
              searchUtils.getSearchConfiguration({
                connector: me.node.connector
              }).done(function(searchConfig) {
                me.facetConfig = searchConfig && searchConfig.defaultFacetProperties;
                var _changed = false;
                var columns = me.node.get("columns");
                if (!columns) {
                  var widgetPreference = me.node.get("widgetPreference");
                  if (widgetPreference) {
                    columns = widgetPreference.clientColumns;
                  }
                }
                if (!_.isEmpty(me.facetConfig)) {
                  _.each(columns, function(col) {
                    if (col.filter !== false) {
                      var key = col.filter_key || col.column_key;
                      key = key.indexOf(".") > -1 ? key.split(".")[1] : key;
                      if (_.has(me.facetConfig, key)) {
                        col.description = "desc_" + new Date().getTime();
                        _changed = true;
                      }
                    }
                  });
                }
                if (collection.columns && collection.columns.length === 0) {
                  collection.columns.reset(columns);
                  _changed = true;
                }
                if (_changed) {
                  me.node.definitions.reset(columns);
                  me.node.columns.reset(columns);
                }
                if (!me.orderBy || me.orderBy === "_d2_sample_column asc") {
                  me.sorting = {
                    sort: []
                  };
                  _.each(columns, function(col) {
                    if (col.sort === true && col.direction) {
                      me.sorting["sort"].push({
                        key: "sort",
                        value: col.direction.toLowerCase() + "_" + col.column_key
                      });
                      me.orderBy = col.column_key + " " + col.direction.toLowerCase();
                    }
                  });
                }
                me.fetchNodeChildren(method, collection, options).done(function() {
                  promise.resolve();
                }).fail(function(xhr) {
                  promise.reject(xhr);
                });
              }).fail(function(err) {
                promise.reject(err);
              });
            }).fail(function(err) {
              promise.reject(err);
            });
          }).fail(function(err) {
            promise.reject(err);
          });
          return promise.promise();
        },
        fetchWidgetData: function(options) {
          let widgetPreference = this.node.get("widgetPreference");
          if (this.isTargetBrowse) {
            this.node.isTargetBrowse = true;
          }
          if (widgetPreference && !options.forceResetWidgetPreference) {
            this.node.columns.reset(widgetPreference.clientColumns);
            return $.Deferred().resolve().promise();
          } else {
            return this.node.resetWidgetPreference();
          }
        },
        fetchNodeChildren: function(method, collection, options) {
          var me = this, promise = $.Deferred();
          var originalSuccess = options.success;
          var originalError = options.error;
          options.success = function(response, status, xhr) {
            if (nodeConverter.isDQLNode(me.node) && response.entries && response.entries.length > 0) {
              var entry = response.entries[0];
              if (!entry.content.properties || !entry.content.properties.r_object_id) {
                var widgetPreference = me.node.get("widgetPreference") || {};
                var columns = widgetPreference.clientColumns;
                if (columns) {
                  columns.shift();
                  me.node.definitions.reset(columns);
                  me.node.columns.reset(columns);
                }
                me._idLess = true;
                _.each(response.entries, function(item) {
                  item.content["base-permissions"] = {
                    read: false
                  };
                  item.content["favorite"] = false;
                });
                originalSuccess.call(options, response, status, xhr);
                promise.resolve();
                return;
              }
            }
            me.fetchNodeChildrenData(response).done(function() {
              originalSuccess.call(options, response, status, xhr);
              promise.resolve();
            }).fail(function(error) {
              promise.reject(error);
            });
          };
          options.error = function() {
            originalError.apply(options, arguments);
            promise.reject(arguments[0]);
          };
          if (nodeConverter.isNonDCTMNode(this.node)) {
            superSyncMethod.call(me, method, collection, options).fail(promise.reject);
          } else {
            var ignoreFilter = false;
            if (!this.serverFilterEnabled && this.clientFilterWithFacets) {
              ignoreFilter = true;
            }
            var postbody = this.getFilterQuery(me.nodeFacets.filters) || {};
            this.trigger("request", collection, {}, options);
            me.previousConstraint = postbody;
            $.ajax(me.connector.extendAjaxOptions({
              url: this.getUrl(ignoreFilter),
              type: "POST",
              headers: {
                "Content-Type": constants.MediaTypes.DCTM_JSON
              },
              data: JSON.stringify(me.previousConstraint),
              success: function(response) {
                options.success.call(options, response, "success", {});
              },
              error: function(request) {
                var e = request.responseJSON && request.responseJSON.message || "";
                globalMessage.showMessage("error", lang.failedToRenderDocList, e);
                options.error.apply(options, arguments);
              }
            }));
          }
          return promise.promise();
        },
        fetchFilterConfig: function() {
          var me = this, deferred = $.Deferred();
          if (nodeConverter.isRepositoryNode(this.node)) {
            deferred.resolve();
          } else {
            FilterUtils.getD2FilterServerConfig({
              connector: me.connector,
              container_id: me.node.get("id")
            }).done(function(filterObject) {
              me.avaliableD2FilterConfigFacets = filterObject;
              deferred.resolve();
            });
          }
          return deferred.promise();
        },
        fetchNodeChildrenData: function(response) {
          var me = this, deferred = $.Deferred(), spcCfg = nodeUtils.getSpecialNodeConfig(me.node);
          response.entries || (response.entries = []);
          me._fetchSpecialNodeData(spcCfg).done(function(homeCabinet, favIds) {
            var isTreeViewDisabled = !spcCfg.treeEnabled || utils.isMobile();
            if (!me.isTargetBrowse && spcCfg.favoritesNodeEnabled && isTreeViewDisabled && me.node.get("id") === spcCfg.startingPath) {
              var data = nodeUtils.createSpecialNodeRaw(constants.NodeId.FAVORITES);
              response.entries.splice(0, 0, {
                content: data
              });
              response.total++;
            }
            if (homeCabinet) {
              _.find(response.entries, function(entry, index) {
                if (entry.content.properties.r_object_id === homeCabinet.properties.r_object_id) {
                  response.entries.splice(index, 1);
                  response.total--;
                  return true;
                }
              });
              homeCabinet.properties._is_home_cabinet = true;
              response.entries.splice(0, 0, {
                content: homeCabinet
              });
              response.total++;
            }
            _.each(response.entries, function(item) {
              item.content.properties._possibleRoots = nodeUtils.getPossibleRoots({
                ancestorIds: item.content.properties.i_ancestor_id,
                favoriteFolderIds: favIds,
                homeCabinetEnabled: spcCfg.homeCabinetEnabled,
                startingPath: spcCfg.startingPath
              });
            });
            deferred.resolve(response);
          }).fail(deferred.reject);
          return deferred.promise();
        },
        parseFacets: function(response) {
          var preferenceFilterId = this.node?.get("widgetPreference")?.columnPreference?.get("d2sv_widget_state")?.filter;
          var filterConfig = FilterUtils.fetchFilterConfig({
            selectedFilterName: !this.nodeD2FilterConfig.facetvalue ? preferenceFilterId : this.nodeD2FilterConfig.facetvalue,
            d2FilterConfigs: this?.avaliableD2FilterConfigFacets
          });
          var filters = this.nodeFacets.filters;
          let tStart = new Date();
          var newfacets = FacetUtils.parseNewFacets(response.facets);
          logger.debug(`parseFacets :: Facets in folder ${this.node.get("id")} took ${(new Date() - tStart) / 1e3}s to process`) && console.log(logger.last);
          if (!nodeConverter.isRepositoryNode(this.node)) {
            newfacets.unshift(filterConfig);
          }
          tStart = new Date();
          var clone = JSON.parse(JSON.stringify(newfacets));
          logger.debug(`parseFacets :: cloning took ${(new Date() - tStart) / 1e3}s`) && console.log(logger.last);
          if (filters.length === 0 || response["facet-processed"] === false) {
            this.baseFacets = null;
          }
          if (response["facet-processed"] === false) {
            this.nodeFacets.filters = [];
          }
          tStart = new Date();
          var facetsArr = FacetUtils.computeFacets(clone, this.baseFacets, filters);
          logger.debug(`parseFacets :: computation took ${(new Date() - tStart) / 1e3}s`) && console.log(logger.last);
          if (!this.baseFacets) {
            tStart = new Date();
            this.baseFacets = JSON.parse(JSON.stringify(newfacets));
            logger.debug(`parseFacets :: cloning base facet took ${(new Date() - tStart) / 1e3}s`) && console.log(logger.last);
          }
          if (facetsArr.length > 0 && facetsArr[0]["id"] === "filter") {
            facetsArr[0] = this?.avaliableD2FilterConfigFacets;
          }
          this.nodeFacets.reset(facetsArr);
        },
        _fetchSpecialNodeData: function(spcCfg) {
          var me = this, homePromise, deferred = $.Deferred(), homeCabinetId = nodeUtils.getHomeCabinetId();
          var isTreeViewDisabled = !spcCfg.treeEnabled || utils.isMobile();
          if (spcCfg.homeCabinetEnabled && isTreeViewDisabled && me.node.get("id") === spcCfg.startingPath && spcCfg.startingPath !== homeCabinetId) {
            homePromise = $.ajax(me.node.connector.extendAjaxOptions({
              url: Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF), "objects", homeCabinetId)
            }));
          } else {
            homePromise = $.Deferred().resolve().promise();
          }
          homePromise.done(function(homeCabinet) {
            nodeUtils.fetchFavoriteFolders({
              favoriteFoldersEnabled: spcCfg.favoriteFoldersEnabled,
              connector: me.node.connector
            }).done(function(favIds) {
              deferred.resolve(homeCabinet, favIds);
            }).fail(deferred.reject);
          }).fail(deferred.reject);
          return deferred.promise();
        },
        _saveColumnPreference: function(widgetName, colPref) {
          var sortarr = _.isString(this.orderBy) ? this.orderBy.split(" ") : [], me = this;
          if (sortarr.length > 1) {
            serverQueryUtils.saveColumnPreferences({
              scope: me,
              widgetType: widgetConstants.D2.DOCLIST,
              widgetName: widgetName || "",
              defaultType: constants.ColTypes.DEFAULT,
              connector: this.node.connector,
              columnPreference: colPref,
              sortOrder: this.orderBy
            }).done(function() {});
          }
        },
        compareObjectsForSort: function(property, left, right) {
          var specialNodeWeight = function(item) {
            if (item) {
              return item.get("id") === constants.NodeId.FAVORITES ? 0 : item.get("_is_home_cabinet") === true ? 1 : 2;
            }
            return 2;
          }, cmpVal = specialNodeWeight(left) - specialNodeWeight(right);
          if (cmpVal !== 0) {
            if (_.isString(this.orderBy) && this.orderBy.toLowerCase().trim().split(" ")[1] === "desc") {
              cmpVal = -1 * cmpVal;
            }
            return cmpVal;
          }
          var sortSchema = this.columnTypes[property];
          if (!sortSchema) {
            var widgetPreference = this.node.get("widgetPreference") || {};
            this.columnTypes[property] = {};
            sortSchema = serverColumnsConverter.getSortColumnSchema(widgetPreference.clientColumns, property);
            this.columnTypes[property] = sortSchema;
          }
          return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, RestResources.getCurrentUser().get("preferences").order_folder_before !== false, this.orderBy);
        },
        loadThumbnails: function() {
          var me = this;
          var fetchThumbNailIds = _.map(_.filter(me.models, function(record) {
            return record.get("d2thumbnailfetched") !== true && record.get("container") === false;
          }), function(model) {
            return model.get("id");
          });
          if (fetchThumbNailIds && fetchThumbNailIds.length > 0) {
            serverQueryUtils.fetchThumbnailURLs(fetchThumbNailIds, me.node.connector).done(function(results) {
              _.each(results, function(entry) {
                var record = me.findWhere({
                  id: entry.id
                });
                if (record) {
                  record.set("csuiThumbnailImageUrl", entry.thumbnailURL, {
                    silent: true
                  });
                  var thumbnailobject = record.thumbnail;
                  if (thumbnailobject) {
                    thumbnailobject.imgUrl = entry.thumbnailURL;
                    thumbnailobject.trigger("loadUrl");
                  }
                }
              });
            });
          }
          _.each(me.models, function(record) {
            record.set("d2thumbnailfetched", true, {
              silent: true
            });
          });
        }
      });
      ClientSideTypeFilterMixin.mixin(prototype);
      return proto;
    }
  };
});