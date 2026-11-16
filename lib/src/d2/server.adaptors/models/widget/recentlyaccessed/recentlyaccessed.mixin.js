/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/server.adaptors/converters/servercolumns", "d2/server.adaptors/models/node.multiple.actions.mixin", "dctmw/models/mixins/collection.delayed.data.mixin", "d2/server.adaptors/models/d2.fetchable.mixin", "d2/utils/server.query.utils", "d2/utils/widget.constants", "d2/utils/sort.utils", "i18n!csui/widgets/recentlyaccessed/impl/nls/lang", "dctmw/utils/utils" ], function(module, _, $, Url, RestResources, RestLinkrels, serverColumnsConverter, NodeMultipleActionsMixin, DelayedDataMixin, D2FetchableMixin, serverQueryUtils, widgetConstants, sortUtils, lang, utils) {
  "use strict";
  var topCount = 25;
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      NodeMultipleActionsMixin.mixin(prototype);
      DelayedDataMixin.mixin(prototype);
      D2FetchableMixin.mixin(prototype);
      var superSyncMethod = prototype.sync;
      var superCloneMethod = prototype.clone;
      return _.extend(prototype, {
        widgetType: widgetConstants.D2.RECENTLY_ACCESSED,
        makeServerAdaptor: function(options) {
          this.options.widgetName = options.widgetName || options.options && options.options.widgetName;
          this.options.expanded = options.expanded || options.options && options.options.expanded || false;
          this.columnTypes = {};
          this.enableDelayedDataFetch(options).makeD2Fetchable(options);
          return this;
        },
        url: function() {
          var links = RestResources.getCurrentRepository().get("links");
          var url = RestLinkrels.getLink(links, RestLinkrels.D2_USER_RECENTLY_ACCESSED);
          this.topCount = topCount;
          return serverQueryUtils.appendQueryParams(url, {
            paginate: true,
            scope: this,
            widgetName: this.options.widgetName
          });
        },
        sync: function(method, model, options) {
          var promise = $.Deferred();
          var me = this;
          if (method === "read") {
            var widgetConfig;
            if (me.options.expanded) {
              widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.RECENTLY_ACCESSED, me.options.widgetName);
            }
            me.fetchColumnPreferences(me.options.widgetName, widgetConfig).done(function(isDisableLocationColumn) {
              me.fetchRecentlyAccessedData(method, model, options, isDisableLocationColumn).done(function() {
                promise.resolve();
              }).fail(function(err) {
                promise.reject(err);
              });
            }).fail(function(err) {
              promise.reject(err);
            });
          }
          return promise.promise();
        },
        fetchColumnPreferences: function(wName, widgetConfig) {
          var me = this, promise = $.Deferred();
          if (utils.isMobile() || me.options.expanded && (!me.clientColumns || me.clientColumns.length === 0)) {
            var isDisableLocationColumn = widgetConfig && widgetConfig.getParam("is_disable_loc_col_smartview") === "true" || false;
            me.options.isDisableLocationColumn = isDisableLocationColumn;
            var columnOptions;
            if (!utils.isMobile()) {
              columnOptions = {
                locationColumn: {
                  enabled: !isDisableLocationColumn,
                  title: lang.parent_id
                },
                externalShareColumn: true,
                commentColumn: false
              };
            } else {
              columnOptions = {
                typeColumn: false,
                reservedColumn: false,
                externalShareColumn: false,
                commentColumn: false,
                favoriteColumn: false
              };
            }
            serverQueryUtils.fetchColumnPreferences({
              scope: me,
              widgetType: widgetConstants.D2.RECENTLY_ACCESSED,
              widgetName: wName,
              columnOptions: columnOptions,
              connector: this.connector
            }).done(function(clientCols, columnPreference) {
              var ordr;
              var nameCol = _.findWhere(clientCols, {
                isNaming: true
              });
              var locationCol = _.findWhere(clientCols, {
                key: "parent_id"
              });
              if (locationCol) {
                ordr = locationCol.definitions_order + 1;
              } else if (nameCol) {
                ordr = nameCol.definitions_order + 1;
              }
              var last_accessed_column = {
                column_key: "access_date_last",
                key: "access_date_last",
                title: lang.access_date_last,
                sort: true,
                type: -7,
                definitions_order: ordr
              };
              clientCols.push(last_accessed_column);
              _.each(clientCols, function(col) {
                if (col.filter !== false && (col.type === 2 || col.type === -1)) {
                  col.filter = true;
                  col.filter_key = col.filter_key || col.column_key;
                }
              });
              me.columnPreference = columnPreference;
              me.clientColumns = clientCols;
              me.columns.reset(me.clientColumns);
              me.columnTypes = {};
              me.widgetPreference = {
                widgetName: wName,
                widgetType: widgetConstants.D2.RECENTLY_ACCESSED,
                columnPreference: me.columnPreference,
                clientColumns: clientCols,
                widgetConfig: widgetConfig
              };
              promise.resolve(isDisableLocationColumn);
            }).fail(function(err) {
              promise.reject(err);
            });
          } else {
            me.columns.reset(me.clientColumns);
            promise.resolve();
          }
          return promise.promise();
        },
        fetchRecentlyAccessedData: function(method, model, options) {
          var me = this, promise = $.Deferred();
          var oldSuccess = options.success, oldError = options.error;
          options.success = function(response, status, xhr) {
            oldSuccess.call(options.context, response, status, xhr);
            promise.resolve();
          };
          options.error = function() {
            oldError.apply(options.context, arguments);
            promise.reject.apply(promise, arguments);
          };
          superSyncMethod.call(me, method, model, options);
          return promise.promise();
        },
        fetchDelayedData: function(options) {
          options = options || {};
          var me = this, parameters = {
            ids: options.nodes,
            connector: me.connector,
            externalShare: true,
            permissions: {
              permissionLevel: "read"
            }
          };
          if (utils.isMobile()) {
            _.extend(parameters, {
              favorites: true
            });
          } else if (me.options.expanded) {
            _.extend(parameters, {
              favorites: true
            });
            if (!me.options.isDisableLocationColumn) {
              _.extend(parameters, {
                locations: {
                  fullPath: false
                }
              });
            }
          }
          return serverQueryUtils.fetchDataAsPropertiesForObjects(parameters);
        },
        parse: function(response) {
          return serverQueryUtils.parseResponse(response, {
            scope: this,
            paginate: false,
            propertiesFn: function(entry) {
              return entry.content;
            }
          });
        },
        clone: function() {
          this.options.expanded = this.expanded;
          return superCloneMethod.call(this);
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
  return ServerAdaptorMixin;
});