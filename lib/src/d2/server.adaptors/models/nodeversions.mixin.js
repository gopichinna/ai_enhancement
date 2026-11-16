/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/utils/constants", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/utils/node.version.utils", "d2/utils/widget.constants", "d2/utils/sort.utils", "d2/server.adaptors/converters/servercolumns", "i18n!d2/widgets/metadata/panels/versions/impl/nls/lang" ], function(_, $, constants, RestResources, RestLinkrels, serverQueryUtils, nodeVersionUtils, widgetConstants, sortUtils, serverColumnsConverter, lang) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      var superSyncMethod = prototype.sync, superFetchMethod = prototype.fetch;
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          this.columnTypes = {};
          this.widgetType = widgetConstants.D2.VERSIONS;
          this.options = this.options || {};
          return this;
        },
        fetch: function(options) {
          if (this._lastFilterAndSortCriteria && !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy) && this.columnPreference) {
            this._saveColumnPreference();
          }
          return superFetchMethod.call(this, options);
        },
        url: function() {
          var url = RestLinkrels.getLink(this.node.get("links"), RestLinkrels.VERSION_HISTORY);
          return serverQueryUtils.appendQueryParams(url, {
            scope: this,
            widgetName: this.options.widgetName,
            clientColumns: this.clientColumns,
            sort: !_.isEmpty(this.orderBy),
            parent_id: this.node.get("parent_id")
          });
        },
        sync: function(method, collection, options) {
          var me = this, w = RestResources.getCurrentUser().get("defaultWidgets"), deferred = $.Deferred();
          this.options.widgetName = w[widgetConstants.DEFAULT.VERSIONS] || "";
          _.extend(options.headers, {
            Accept: constants.MediaTypes.DCTM_D2_V1_JSON
          });
          me.fetchColumnPreferences().done(function(isDisableLocationColumn) {
            me.isDisableLocationColumn = isDisableLocationColumn;
            me.fetchVersionModel(method, collection, options, isDisableLocationColumn).done(function() {
              deferred.resolve();
            }).fail(function(err) {
              deferred.reject(err);
            });
          }).fail(function(err) {
            deferred.reject(err);
          });
          return deferred.promise();
        },
        fetchColumnPreferences: function() {
          var me = this, deferred = $.Deferred(), widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.VERSIONS, this.options.widgetName);
          if (this.options.ignoreColumns) {
            return deferred.resolve().promise();
          }
          me.options.widgetName = widgetConstants.D2.VERSIONS;
          if (me.clientColumns && me.clientColumns.length !== 0) {
            me.columns.reset(me.clientColumns);
            deferred.resolve();
          } else {
            var isDisableLocationColumn = widgetConfig && widgetConfig.getParam("is_disable_loc_col_smartview") === "true" || false;
            serverQueryUtils.fetchColumnPreferences({
              scope: me,
              widgetType: widgetConstants.D2.VERSIONS,
              widgetName: me.options.widgetName,
              connector: me.node.connector,
              columnOptions: {
                typeColumn: true,
                reservedColumn: true,
                externalShareColumn: false,
                commentColumn: false,
                favoriteColumn: false,
                locationColumn: {
                  enabled: !isDisableLocationColumn,
                  title: lang.ColumnTitleLocation
                }
              }
            }).done(function(clientCols, columnPreference) {
              me.columnPreference = columnPreference;
              me.clientColumns = clientCols;
              _.each(clientCols, function(col) {
                if (col.sort === true && col.direction) {
                  me.orderBy = col.column_key + " " + col.direction.toLowerCase();
                }
              });
              me.columns.reset(me.clientColumns);
              me.columnTypes = {};
              deferred.resolve(isDisableLocationColumn);
            }).fail(function(err) {
              deferred.reject(err);
            });
          }
          return deferred.promise();
        },
        _saveColumnPreference: function() {
          var me = this, sortarr = _.isString(me.orderBy) ? me.orderBy.split(" ") : [];
          if (sortarr.length > 1) {
            serverQueryUtils.saveColumnPreferences({
              scope: me,
              widgetType: widgetConstants.D2.VERSIONS,
              widgetName: me.options.widgetName || "",
              connector: me.node.connector,
              columnPreference: me.columnPreference,
              sortOrder: me.orderBy
            }).done(function(clientCols, columnPreference) {
              me.columnPreference = columnPreference;
            });
          }
        },
        fetchVersionModel: function(method, collection, options, isDisableLocationColumn) {
          var me = this, deferred = $.Deferred(), oldSuccess = options.success, oldError = options.error;
          options.parse = false;
          options.success = function(response, status, xhr) {
            nodeVersionUtils.fetchVersionModelData(response, isDisableLocationColumn, me.node.connector).done(function(response) {
              oldSuccess.call(options.context, response, status, xhr);
              deferred.resolve();
            }).fail(function(error) {
              deferred.reject(error);
            });
          };
          options.error = function(xhr, textStatus, error) {
            oldError.apply(options.context, arguments);
            deferred.reject(xhr, textStatus, error);
          };
          superSyncMethod.call(me, method, collection, options).fail(deferred.reject);
          return deferred.promise();
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