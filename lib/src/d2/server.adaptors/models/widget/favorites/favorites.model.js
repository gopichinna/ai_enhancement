/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin", "nuc/models/browsable/client-side.mixin", "nuc/models/browsable/v2.response.mixin", "nuc/models/mixins/v2.expandable/v2.expandable.mixin", "nuc/models/mixins/state.requestor/state.requestor.mixin", "nuc/models/node/node.model", "d2/models/workflow/workflow", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "dctmw/server.adaptors/converters/node", "d2/server.adaptors/converters/servercolumns", "d2/server.adaptors/models/client-side.type.filter.mixin", "d2/server.adaptors/models/node.multiple.actions.mixin", "d2/server.adaptors/models/widget/favorites/favoritecolumns", "dctmw/models/mixins/collection.delayed.data.mixin", "d2/server.adaptors/models/d2.fetchable.mixin", "d2/utils/graphics/graphics.resources", "d2/utils/server.query.utils", "d2/utils/widget.constants", "d2/utils/sort.utils", "dctmw/utils/utils", "dctmw/utils/user.preference.storage", "i18n!d2/widgets/favorites/impl/nls/lang", "nuc/utils/deepClone/deepClone" ], function($, _, Backbone, Url, ConnectableMixin, FetchableMixin, DelayedCommandableV2Mixin, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, ExpandableV2Mixin, StateRequestorMixin, NodeModel, WorkflowModel, RestResources, RestLinkrels, nodeConverter, serverColumnsConverter, ClientSideTypeFilterMixin, NodeMultipleActionsMixin, FavoriteColumnCollection, DelayedDataMixin, D2FetchableMixin, GraphicsResources, serverQueryUtils, widgetConstants, sortUtils, utils, userPreferenceStore, lang) {
  "use strict";
  var FavoriteCollection = Backbone.Collection.extend({
    model: NodeModel,
    widgetType: widgetConstants.D2.FAVORITES,
    constructor: function FavoriteCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      if (options) {
        this.options = _.pick(options, [ "connector", "autoreset", "commands", "widgetName", "expanded", "widgetType", "subTypeFilters", "excludeTypes", "options" ]);
      }
      this.makeConnectable(options).makeFetchable(options).makeClientSideBrowsable(options).makeBrowsableV2Response(options).makeDelayedCommandableV2(options).makeExpandableV2(options).makeStateRequestor(options).enableDelayedDataFetch(options).makeD2Fetchable(options);
      this.columnTypes = {};
      this.columns = new FavoriteColumnCollection(options.columns);
      this.widgetType = this.options.widgetType ? this.options.widgetType : this.widgetType;
      this.expanded = this.options.expanded;
    },
    clone: function() {
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
    },
    url: function() {
      var links = RestResources.getCurrentRepository().get("links");
      var url = RestLinkrels.getLink(links, RestLinkrels.D2_FAVORITES);
      var url_filter = null;
      if (typeof this.url_filter !== "undefined") {
        url_filter = this.url_filter;
      }
      if (this.expanded) {
        return serverQueryUtils.appendQueryParams(url, {
          scope: this,
          widgetName: this.options.widgetName,
          clientColumns: this.clientColumns,
          urlFilter: url_filter,
          sort: !_.isEmpty(this.orderBy),
          extraParams: {
            "include-all-versions": this.columnPreference.get("d2sv_widget_state")?.show_all_version || false
          },
          subTypeFilters: this.options.subTypeFilters
        });
      }
      return serverQueryUtils.appendQueryParams(url, {
        extraParams: {
          "include-all-versions": false
        },
        subTypeFilters: this.options.subTypeFilters
      });
    },
    parse: function(response) {
      response.columns = this.clientColumns;
      this.columns && this.columns.resetFavoriteCollection(response, this.options);
      return (response.entries || []).map(function(entry) {
        return entry.content;
      });
    },
    sync: function(method, response, options) {
      var promise = $.Deferred();
      if (method === "read") {
        var me = this, widgetConfig;
        if (me.expanded || me.options.expanded) {
          me.expanded = true;
          widgetConfig = serverQueryUtils.getWidgetConfig(me.widgetType, me.options.widgetName);
        }
        me.fetchColumnPreferences(me.options.widgetName, widgetConfig).done(function(isDisableLocationColumn) {
          me.fetchFavoritesData(method, response, options, isDisableLocationColumn).done(function() {
            promise.resolve();
          }).fail(function(err) {
            promise.reject(err);
          });
        }).fail(function(err) {
          promise.reject(err);
        });
      } else {
        throw new Error("Only fetching the metadata relation collection is supported");
      }
      return promise.promise();
    },
    fetchColumnPreferences: function(wName, widgetConfig) {
      var me = this, promise = $.Deferred();
      if (me.clientColumns && me.clientColumns.length !== 0 || !me.expanded) {
        me.columns.reset(this.clientColumns);
        promise.resolve();
      } else {
        var isDisableLocationColumn = widgetConfig && widgetConfig.getParam("is_disable_loc_col_smartview") === "true" || false;
        me.options.isDisableLocationColumn = isDisableLocationColumn;
        var columnOptions;
        if (!utils.isMobile()) {
          columnOptions = {
            locationColumn: {
              enabled: !isDisableLocationColumn,
              title: lang.parent_id
            },
            commentColumn: false,
            showAllVersion: false,
            externalShareColumn: !_.isUndefined(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_MYSHARED_OBJECTS))
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
        if (me.isTargetBrowse) {
          columnOptions = {
            reservedColumn: false,
            externalShareColumn: false,
            commentColumn: false,
            favoriteColumn: false
          };
        }
        serverQueryUtils.fetchColumnPreferences({
          scope: me,
          widgetType: me.widgetType,
          widgetName: wName,
          connector: me.connector,
          columnOptions: columnOptions
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
          me.clientColumns = clientCols;
          var counter = 0, maxColumnsDisplayed = 3;
          _.each(clientCols, function(col) {
            if (utils.isMobile()) {
              if (counter < maxColumnsDisplayed) {
                if (col.d2_sort_key && col.type_name) {
                  if (col.sort === true && col.direction) {
                    me.orderBy = col.d2_sort_key + " " + col.direction.toLowerCase();
                    me.mobileOrderBy = col.d2_sort_key + " " + col.direction.toLowerCase();
                  }
                  counter++;
                }
              }
            } else {
              if (col.sort === true && col.direction) {
                me.orderBy = col.column_key + " " + col.direction.toLowerCase();
              }
            }
            if (col.filter !== false && (col.type === 2 || col.type === -1)) {
              col.filter = true;
              col.filter_key = col.filter_key || col.column_key;
            }
          });
          if (utils.isMobile() && !me.mobileOrderBy) {
            me.orderBy = clientCols[0].column_key + " asc";
          }
          me.columns.reset(me.clientColumns);
          me.columnTypes = {};
          me.widgetPreference = {
            widgetName: wName,
            widgetType: me.widgetType,
            columnPreference: me.columnPreference,
            clientColumns: clientCols,
            widgetConfig: widgetConfig
          };
          promise.resolve(isDisableLocationColumn);
        }).fail(function(err) {
          promise.reject(err);
        });
      }
      return promise.promise();
    },
    fetchFavoritesData: function(method, response, options) {
      var me = this, promise = $.Deferred();
      var oldSuccess = options.success;
      var oldError = options.error;
      options.success = function(response, status, xhr) {
        _.each(response.entries || [], function(item) {
          if (item.content && item.content.properties) {
            item.content.properties.favorite = true;
          }
        });
        oldSuccess.call(options.context, response, status, xhr);
        promise.resolve();
      };
      options.error = function() {
        oldError.apply(options.context, arguments);
        promise.reject.apply(promise, arguments);
      };
      Backbone.sync.call(me, method, response, options);
      return promise.promise();
    },
    fetchDelayedData: function(options) {
      options = options || {};
      var me = this, parameters = {
        ids: options.nodes,
        connector: me.connector,
        permissions: {
          permissionLevel: "read"
        },
        externalShare: true,
        workspaceContainment: !!RestResources.getCurrentUser()?.get("defaultWidgets")?.[widgetConstants.DEFAULT.BWS]
      };
      if (me.expanded) {
        if (!me.options.isDisableLocationColumn) {
          _.extend(parameters, {
            locations: {
              fullPath: false,
              ancestorDetails: GraphicsResources.hasConditionAttributes()
            }
          });
        }
      }
      const widgetDetails = me.widgetPreference;
      if (widgetDetails && widgetDetails.widgetName && widgetDetails.widgetType) {
        _.extend(parameters, {
          widgetName: widgetDetails.widgetName,
          widgetType: widgetDetails.widgetType
        });
      }
      return serverQueryUtils.fetchDataAsPropertiesForObjects(parameters);
    },
    _prepareModel: function(attrs, options) {
      options || (options = {});
      options.promotedActionCommands = this.promotedActionCommands;
      options.nonPromotedActionCommands = this.nonPromotedActionCommands;
      this.model = attrs?.type === "d2c_workflow_tracker" ? WorkflowModel : NodeModel;
      return Backbone.Collection.prototype._prepareModel.call(this, attrs, options);
    },
    _saveColumnPreference: function() {
      var sortarr = _.isString(this.orderBy) ? this.orderBy.split(" ") : [], me = this;
      if (sortarr.length > 1) {
        serverQueryUtils.saveColumnPreferences({
          scope: me,
          widgetType: me.widgetType,
          widgetName: me.options.widgetName,
          connector: me.connector,
          columnPreference: me.columnPreference,
          sortOrder: me.orderBy
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
        });
      }
    }
  });
  ClientSideBrowsableMixin.mixin(FavoriteCollection.prototype);
  BrowsableV2ResponseMixin.mixin(FavoriteCollection.prototype);
  ConnectableMixin.mixin(FavoriteCollection.prototype);
  FetchableMixin.mixin(FavoriteCollection.prototype);
  DelayedCommandableV2Mixin.mixin(FavoriteCollection.prototype);
  ExpandableV2Mixin.mixin(FavoriteCollection.prototype);
  StateRequestorMixin.mixin(FavoriteCollection.prototype);
  NodeMultipleActionsMixin.mixin(FavoriteCollection.prototype);
  ClientSideTypeFilterMixin.mixin(FavoriteCollection.prototype);
  DelayedDataMixin.mixin(FavoriteCollection.prototype);
  D2FetchableMixin.mixin(FavoriteCollection.prototype);
  var originalFetch = FavoriteCollection.prototype.fetch;
  FavoriteCollection.prototype.fetch = function(options) {
    if (this._lastFilterAndSortCriteria && !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy) && this.columnPreference) {
      this._saveColumnPreference();
    }
    return originalFetch.call(this, options);
  };
  FavoriteCollection.prototype.compareObjectsForSort = function(property, left, right) {
    var sortSchema = this.columnTypes[property];
    if (!sortSchema) {
      this.columnTypes[property] = {};
      sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
      this.columnTypes[property] = sortSchema;
    }
    return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, RestResources.getCurrentUser().get("preferences").order_folder_before !== false, this.orderBy);
  };
  return FavoriteCollection;
});