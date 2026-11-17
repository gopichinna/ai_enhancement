/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin", "nuc/models/browsable/client-side.mixin", "nuc/models/browsable/v2.response.mixin", "nuc/models/mixins/v2.expandable/v2.expandable.mixin", "nuc/models/mixins/state.requestor/state.requestor.mixin", "nuc/models/nodechildrencolumn", "nuc/models/nodechildrencolumns", "nuc/models/node/node.model", "d2/widgets/checkout/checkoutcolumns", "dctmw/server.adaptors/converters/node", "d2/server.adaptors/converters/servercolumns", "d2/server.adaptors/models/node.multiple.actions.mixin", "dctmw/models/mixins/collection.delayed.data.mixin", "d2/server.adaptors/models/d2.fetchable.mixin", "dctmw/utils/rest.resources", "d2/utils/graphics/graphics.resources", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/utils/sort.utils", "d2/utils/widget.constants", "d2/utils/constants", "dctmw/utils/utils", "i18n!d2/widgets/checkout/impl/nls/lang", "nuc/utils/deepClone/deepClone" ], function($, _, Backbone, Url, ConnectableMixin, FetchableMixin, DelayedCommandableV2Mixin, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, ExpandableV2Mixin, StateRequestorMixin, NodeChildrenColumnModel, NodeChildrenColumnCollection, NodeModel, CheckoutColumnCollection, nodeConverter, serverColumnsConverter, NodeMultipleActionsMixin, DelayedDataMixin, D2FetchableMixin, RestResources, GraphicsResources, RestLinkrels, serverQueryUtils, sortUtils, widgetConstants, constants, utils, lang) {
  "use strict";
  var CheckoutCollection = Backbone.Collection.extend({
    model: NodeModel,
    widgetType: widgetConstants.D2.CHECKOUT,
    constructor: function CheckoutCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      if (options) {
        this.options = _.pick(options, [ "connector", "autoreset", "commands", "widgetName", "expanded", "options" ]);
      }
      this.makeConnectable(options).makeFetchable(options).makeClientSideBrowsable(options).makeBrowsableV2Response(options).makeDelayedCommandableV2(options).makeExpandableV2(options).makeStateRequestor(options).enableDelayedDataFetch(options).makeD2Fetchable(options);
      this.columns = new CheckoutColumnCollection(options.columns);
      this.columnTypes = {};
      this.expanded = this.options.expanded || false;
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
      var url = RestLinkrels.getLink(links, RestLinkrels.CHECKEDOUT_OBJECTS);
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
    sync: function(method, model, options) {
      var promise = $.Deferred();
      var me = this;
      var args = arguments;
      var widgetConfig;
      if (me.expanded) {
        widgetConfig = serverQueryUtils.getWidgetConfig(me.widgetType, this.options.widgetName);
      }
      me.fetchColumnPreferences(this.options.widgetName, widgetConfig).done(function(data, isDisableLocationColumn) {
        me.fetchData(data, args, options, isDisableLocationColumn).done(function() {
          promise.resolve();
        }).fail(function(err) {
          promise.reject(err);
        });
      }).fail(function(err) {
        promise.reject(err);
      });
      return promise.promise();
    },
    fetchColumnPreferences: function(wName, widgetConfig) {
      var me = this, promise = $.Deferred();
      me.widgetName = wName;
      if (me.clientColumns && me.clientColumns.length !== 0 || !me.expanded) {
        promise.resolve();
      } else {
        var isDisableLocationColumn = widgetConfig && widgetConfig.getParam("is_disable_loc_col_smartview") === "true" || false;
        me.options.isDisableLocationColumn = isDisableLocationColumn;
        serverQueryUtils.fetchColumnPreferences({
          scope: this,
          widgetType: me.widgetType,
          widgetName: me.widgetName,
          connector: me.connector,
          columnOptions: {
            locationColumn: {
              enabled: !isDisableLocationColumn,
              title: lang.parent_id
            },
            commentColumn: false,
            externalShareColumn: !_.isUndefined(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_MYSHARED_OBJECTS))
          }
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
          _.each(clientCols, function(col) {
            if (col.sort === true && col.direction) {
              me.orderBy = col.column_key + " " + col.direction.toLowerCase();
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
        }).fail(function(err) {
          promise.reject(err);
        });
      }
      return promise.promise();
    },
    _prepareModel: function(attrs, options) {
      options || (options = {});
      options.promotedActionCommands = this.promotedActionCommands;
      options.nonPromotedActionCommands = this.nonPromotedActionCommands;
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
    },
    fetchData: function(data, args, options) {
      var me = this, deferred = $.Deferred();
      if (data != null) {
        me.clientColumns = data.clientCols;
      } else {
        me.columns.reset(me.clientColumns);
      }
      var success = options.success;
      options.success = function(checkoutResults) {
        success.call(options.context, checkoutResults, "success", {});
        deferred.resolve();
      };
      var beforesend = options.beforesend;
      options.beforeSend = function(request, settings) {
        options.request = request;
        request.settings = settings;
        if (me?.__proto__?.widgetType === widgetConstants.D2.CHECKOUT) {
          request.setRequestHeader("Accept", constants.MediaTypes.DCTM_D2_V1_JSON);
        } else {
          request.setRequestHeader("Accept", constants.MediaTypes.JSON);
        }
        if (beforesend) {
          beforesend.apply(this, arguments);
        }
      };
      options.error = function(errorResponse) {
        me.trigger("error", errorResponse);
        deferred.reject(arguments);
      };
      Backbone.sync.apply(me, args);
      return deferred.promise();
    },
    fetchDelayedData: function(options) {
      options = options || {};
      var me = this, parameters = {
        ids: options.nodes,
        connector: me.connector,
        permissions: {
          permissionLevel: "read"
        }
      };
      if (me.expanded) {
        if (!utils.isMobile()) {
          parameters.previewFormats = true;
        }
        _.extend(parameters, {
          favorites: true,
          externalShare: true,
          workspaceContainment: !!RestResources.getCurrentUser()?.get("defaultWidgets")?.[widgetConstants.DEFAULT.BWS]
        });
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
    parse: function(response) {
      response.columns = this.clientColumns;
      this.columns && this.columns.resetCheckoutCollection(response, this.options);
      return (response.entries || []).map(function(entry) {
        return entry.content;
      });
    }
  });
  ClientSideBrowsableMixin.mixin(CheckoutCollection.prototype);
  BrowsableV2ResponseMixin.mixin(CheckoutCollection.prototype);
  ConnectableMixin.mixin(CheckoutCollection.prototype);
  FetchableMixin.mixin(CheckoutCollection.prototype);
  DelayedCommandableV2Mixin.mixin(CheckoutCollection.prototype);
  ExpandableV2Mixin.mixin(CheckoutCollection.prototype);
  StateRequestorMixin.mixin(CheckoutCollection.prototype);
  NodeMultipleActionsMixin.mixin(CheckoutCollection.prototype);
  DelayedDataMixin.mixin(CheckoutCollection.prototype);
  D2FetchableMixin.mixin(CheckoutCollection.prototype);
  var originalFetch = CheckoutCollection.prototype.fetch;
  CheckoutCollection.prototype.fetch = function(options) {
    if (this._lastFilterAndSortCriteria && !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy) && this.columnPreference) {
      this._saveColumnPreference();
    }
    return originalFetch.call(this, options);
  };
  CheckoutCollection.prototype.compareObjectsForSort = function(property, left, right) {
    var sortSchema = this.columnTypes[property];
    if (!sortSchema) {
      this.columnTypes[property] = {};
      sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
      this.columnTypes[property] = sortSchema;
    }
    return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, false);
  };
  return CheckoutCollection;
});