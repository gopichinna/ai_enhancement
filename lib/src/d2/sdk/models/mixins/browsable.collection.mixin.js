/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'nuc/models/browsable/client-side.mixin',
  'nuc/models/browsable/v2.response.mixin',
  'nuc/models/mixins/v2.expandable/v2.expandable.mixin',
  'nuc/models/mixins/state.requestor/state.requestor.mixin',
  'd2/server.adaptors/converters/servercolumns',
  'd2/utils/constants',
  'dctmw/utils/rest.resources',
  'd2/utils/server.query.utils',
  'd2/utils/sort.utils',
  'd2/sdk/models/mixins/collection.delayed.data.mixin',
  'd2/sdk/models/table/column.collection'
], function (_, $, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, ExpandableV2Mixin, StateRequestorMixin,
             serverColumnsConverter, constants, RestResources, serverQueryUtils, sortUtils, DelayedDataMixin, DefaultColumnCollection) {
  'use strict';

  /**
   * BrowsableCollection mixin. Can be mixed with any `Backbone.Collection` to make it paginated. Pagination happens on the client
   * side by slicing & maintaining the models in it. But when it syncs to the server, it always fetches the full list of available objects.
   *
   * Besides pagination it also enables sorting & filtering.
   *
   * @see {@link ../../../nuc/models/browsable|Browsable Support}
   *
   * @example <caption>A typical usage infuses the mixin with a collection prototype</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'd2/sdk/models/mixins/browsable.collection.mixin'
   * ], function(Backbone, BrowsableCollectionMixin){
   *  'use strict';
   *
   *  var MyCollection = Backbone.Collection.extend({
   *    constructor: function MyCollection(models, options) {
   *      options = options || {};
   *      MyCollection.__super__.constructor.call(this, models, options);
   *
   *      this.makeBrowsableCollection(options);
   *    }
   *  });
   *
   *  BrowsableCollectionMixin.mixin(MyCollection.prototype);
   *
   *  return MyCollection;
   * });
   *
   * @module {d2/sdk/models/mixins/browsable.collection.mixin} d2/sdk/models/mixins/"browsable.collection.mixin"
   * @name BrowsableCollectionMixin
   * @extends {Object}
   *
   */

  /**
   * @external ClientSideBrowsableMixin
   * @see ../../../nuc/models/browsable/client-side.mixin
   */

  /**
   * @external BrowsableMixin
   * @see ../../../nuc/models/browsable/browsable.mixin
   */

  var BrowsableMixin = {
    /**
     * Fuse the mixin methods to a prototype
     * @param {Object} prototype - The target prototype where the mixin methods will be fused.
     * @returns {void}
     * @mixes external:ClientSideBrowsableMixin
     * @mixes external:BrowsableMixin
     * @mixes module:DelayedCollectionDataMixin
     * @memberOf module:BrowsableCollectionMixin
     */

    mixin: function (prototype) {
      ExpandableV2Mixin.mixin(prototype);
      StateRequestorMixin.mixin(prototype);
      ClientSideBrowsableMixin.mixin(prototype);
      BrowsableV2ResponseMixin.mixin(prototype);
      DelayedDataMixin.mixin(prototype);

      var originalFetch = prototype.fetch,
          originalUrl = prototype.url,
          originalSync = prototype.sync,
          originalParse = prototype.parse;

      _.extend(prototype, {
        /**
         * Does the necessary setup so that a `Backbone.Collection` instance could become client-side paginated along with support for property based sorting & filtering.
         *
         * @param {Object} options - The options hash.
         * @param {number} [options.skip] - Number of elements to skip from original collection. Needs to be set only if the collection needs to start from a page other the page-1.
         * @param {number} options.top - Number of elements per page.
         * @param {string} [options.filter] - Any filter expression that the collection should begin with. Can be changed later with `setFilter`.
         * @param {string} [options.orderBy] - Any sorting criteria that the collection should begin with. Can be changed later with `serOrderBy`.
         * @param {string} [options.responseMediaType=application/vnd.emc.documentum+json] - Controls the `Accept` header's value while requesting data through AJAX.
         * @returns {*} the collection instance itself.
         * @instance
         */

        makeBrowsableCollection: function (options) {
          options = options || {};
          this
              .makeExpandableV2(options)
              .makeStateRequestor(options)
              .makeClientSideBrowsable(options)
              .makeBrowsableV2Response(options)
              .enableDelayedDataFetch(options);

          var ColumnCollectionClass = options.ColumnCollectionClass || DefaultColumnCollection;
          this.columns = new ColumnCollectionClass(options.columns);
          this.columnTypes = {};
          this.expanded = this.options.expanded || false;

          return this;
        },

        url: function() {
          var url = _.isFunction(originalUrl) ? originalUrl.call(this) : originalUrl;

          if (this.expanded) {
            return serverQueryUtils.appendQueryParams(url, {
              scope: this,
              widgetName: this.options.widgetName,
              clientColumns: this.clientColumns,
              sort: !_.isEmpty(this.orderBy)
            });
          }

          return serverQueryUtils.appendQueryParams(url, {});
        },

        fetch: function(options) {
          if (this._lastFilterAndSortCriteria && !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy) && this.columnPreference && _.isFunction(this._saveColumnPreference)) {
            this._saveColumnPreference();
          }
          return originalFetch.call(this, options);
        },

        sync: function (method, model, options) {
          var dfd = $.Deferred();
          var me = this;
          var args = arguments;
          var widgetConfig;

          if (me.expanded && this.widgetType && this.options.widgetName) {
            widgetConfig = serverQueryUtils.getWidgetConfig(this.widgetType, this.options.widgetName);
          }

          me.fetchColumnPreferences(widgetConfig).done(function (data, isDisableLocationColumn) {
            me.fetchData(data, args, options, isDisableLocationColumn).done(function () {
              dfd.resolve();
            }).fail(function () {
              dfd.reject.apply(dfd, arguments);
            });
          }).fail(function () {
            dfd.reject.apply(dfd, arguments);
          });

          return dfd.promise();
        },

        fetchData: function (data, args, options/*, isDisableLocationColumn*/) {
          var me = this,
              deferred = $.Deferred();

          if (data != null) {
            me.clientColumns = data.clientCols;
          } else {
            me.columns.reset(me.clientColumns);
          }

          var success = options.success, error = options.error;
          options.success = function (results) {
            success && success.call(options.context, results, 'success', {});
            deferred.resolve();
          };
          options.error = function () {
            error && error.apply(options.context, arguments);
            deferred.reject.apply(deferred, arguments);
          };

          var beforesend = options.beforeSend;
          options.beforeSend = function (request, settings) {
            options.request = request;
            request.settings = settings;
            request.setRequestHeader("Accept", me?.options?.responseMediaType || constants.MediaTypes.DCTM_JSON);
            if (beforesend) {
              beforesend.apply(this, arguments);
            }
          };

          originalSync.apply(me, args);
          return deferred.promise();
        },

        fetchDelayedData: function (options) {
          options = options || {};

          var me = this,
              deferred = $.Deferred();

          var parameters = {
            ids: options.nodes,
            connector: me.connector,
            permissions: {
              permissionLevel: 'read'
            }
          };
          if (me.expanded) {
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

          me.trigger('before:delayed:data:send', parameters); //Allows request-parameter adjustments by implementations
          serverQueryUtils.fetchDataAsPropertiesForObjects(parameters).done(function (objectsProperties) {
            objectsProperties = objectsProperties || {};

            me.trigger('after:delayed:data:receive', options.nodes, objectsProperties); //Allows response adjustments/fabrication by implementations

            deferred.resolve(objectsProperties);
          }).fail(deferred.reject);

          return deferred.promise();
        },

        fetchColumnPreferences: function (widgetConfig) {
          var me = this,
              promise = $.Deferred();

          if ((me.clientColumns && me.clientColumns.length !== 0) || !me.expanded || !widgetConfig) {
            promise.resolve();
          } else {
            var wName = me.widgetName = widgetConfig['object_name'];
            var isDisableLocationColumn = (widgetConfig && widgetConfig.getParam('is_disable_loc_col_smartview') === "true") || false;
            me.options.isDisableLocationColumn = isDisableLocationColumn;

            serverQueryUtils.fetchColumnPreferences({
              scope: this,
              widgetType: me.widgetType,
              widgetName: wName,
              connector: me.connector,
              columnOptions: {
                locationColumn: {
                  enabled: !isDisableLocationColumn
                },
                commentColumn: false
              }
            }).done(function (clientCols, columnPreference) {
              me.columnPreference = columnPreference;
              _.each(clientCols, function (col) {
                //Set the initial loading sorting order here from column preference.
                if (col.sort === true && (col.direction)) {
                  me.orderBy = col.column_key + ' ' + col.direction.toLowerCase();
                }
                if (col.filter !== false && (col.type === 2 || col.type === -1)) {
                  col.filter = true;
                  col.filter_key = col.filter_key || col.column_key;
                }
              });
              var data = {
                clientCols: clientCols
              };
              me.columnTypes = {};
              me.widgetPreference = {
                widgetName: me.widgetName,
                widgetType: me.widgetType,
                columnPreference: me.columnPreference,
                clientColumns: clientCols,
                widgetConfig: widgetConfig
              };
              promise.resolve(data, isDisableLocationColumn);
            }).fail(function () {
              promise.reject.apply(promise, arguments);
            });
          }
          return promise.promise();
        },

        _saveColumnPreference: function () {
          var sortarr = _.isString(this.orderBy) ? this.orderBy.split(' ') : [],
              me = this;
          if (sortarr.length > 1) {
            serverQueryUtils.saveColumnPreferences({
              scope: me,
              widgetType: me.widgetType,
              widgetName: me.options.widgetName,
              connector: me.connector,
              columnPreference: me.columnPreference,
              sortOrder: me.orderBy
            }).done(function (clientCols, columnPreference) {
              me.columnPreference = columnPreference;
            });
          }
        },

        parse: function(response/*, options*/) {
          response.columns = this.clientColumns;
          this.columns && this.columns.resetCollection(response, this.options);

          return originalParse.apply(this, arguments);
        },

        compareObjectsForSort: function (property, left, right) {
          var sortSchema = this.columnTypes[property];
          if (!sortSchema) {
            this.columnTypes[property] = {};
            sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
            this.columnTypes[property] = sortSchema;
          }
          return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, RestResources.getCurrentUser().get('preferences').order_folder_before !== false, this.orderBy);
        },

        clone: function () {
          var clone = new this.constructor(this.models, this.options);
          if (this.columns) {
            clone.columns.reset(this.columns.toJSON());
          }
          clone.actualSkipCount = this.actualSkipCount;
          clone.skipCount = this.skipCount;
          clone.topCount = this.topCount;
          clone.totalCount = this.totalCount;
          clone.filteredCount = this.filteredCount;
          clone.filters = _.deepClone(this.filters);
          clone.orderBy = this.orderBy;
          clone.expand = _.clone(this.expand);
          clone.includeActions = this.includeActions;
          clone.includeCommands = _.clone(this.includeCommands);
          clone.defaultActionCommands = _.clone(this.defaultActionCommands);
          clone.commands = _.clone(this.commands);
          return clone;
        }
      });
    }
  };

  return BrowsableMixin;
});