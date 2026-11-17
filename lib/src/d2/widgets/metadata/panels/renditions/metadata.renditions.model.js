/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/columns", "nuc/models/mixins/node.resource/node.resource.mixin", "nuc/models/browsable/client-side.mixin", "nuc/models/node/node.model", "dctmw/server.adaptors/converters/node", "d2/server.adaptors/converters/servercolumns", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/utils/sort.utils", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/rest.resources", "i18n!d2/widgets/metadata/panels/renditions/impl/nls/lang" ], function($, _, Backbone, NodeColumnCollection, NodeResourceMixin, ClientSideBrowsableMixin, NodeModel, nodeConverter, serverColumnsConverter, RestLinkrels, serverQueryUtils, sortUtils, constants, widgetConstants, RestResources, lang) {
  "use strict";
  var RenditionNodeModel = NodeModel.extend({
    url: function() {
      return RestLinkrels.getLink(this.get("links"), RestLinkrels.SELF);
    }
  });
  var MetadataRenditionCollection = Backbone.Collection.extend({
    model: RenditionNodeModel,
    constructor: function MetadataRenditionCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeNodeResource(options).makeClientSideBrowsable(options);
      this.columns = new NodeColumnCollection();
      this.columnTypes = {};
    },
    url: function() {
      var url = RestLinkrels.getLink(this.node.get("links"), RestLinkrels.D2_RENDITIONS);
      return serverQueryUtils.appendQueryParams(url, {
        scope: this,
        widgetName: this.widgetName,
        clientColumns: this.clientColumns,
        parent_id: this.node.get("parent_id")
      });
    },
    sync: function(method, collection, options) {
      var w = RestResources.getCurrentUser().get("defaultWidgets"), promise = $.Deferred();
      this.widgetName = w[widgetConstants.DEFAULT.RENDITIONS] || "";
      var me = this;
      $.when(me.fetchColumnPreferences(this.widgetName)).done(function() {
        $.when(me.fetchRenditionModel(method, collection, options)).done(function() {
          promise.resolve();
        }).fail(function(err) {
          promise.reject(err);
        });
      }).fail(function(err) {
        promise.reject(err);
      });
      return promise.promise();
    },
    fetchColumnPreferences: function(wName) {
      var me = this, promise = $.Deferred();
      me.widgetName = wName;
      if (me.clientColumns && me.clientColumns.length !== 0) {
        me.columns.reset(me.clientColumns);
        promise.resolve();
      } else {
        serverQueryUtils.fetchColumnPreferences({
          scope: me,
          widgetType: widgetConstants.D2.RENDITIONS,
          widgetName: me.widgetName,
          connector: me.node.connector,
          columnOptions: {
            typeColumn: false,
            reservedColumn: false,
            externalShareColumn: false,
            commentColumn: false,
            favoriteColumn: false
          }
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
          me.clientColumns = clientCols;
          var col = _.findWhere(me.clientColumns, {
            column_key: "a_content_type"
          }), idx = _.indexOf(me.clientColumns, col);
          col.default_action = true;
          me.clientColumns.splice(idx, 0, {
            column_key: "type",
            key: "type",
            name: lang.Type,
            sort: false,
            default_action: true,
            definitions_order: col.definitions_order
          });
          _.each(clientCols, function(col) {
            if (col.sort === true && col.direction) {
              me.orderBy = col.column_key + " " + col.direction.toLowerCase();
            }
          });
          me.columns.reset(me.clientColumns);
          me.columnTypes = {};
          promise.resolve();
        }).fail(function(err) {
          promise.reject(err);
        });
      }
      return promise.promise();
    },
    _saveColumnPreference: function() {
      var sortarr = _.isString(this.orderBy) ? this.orderBy.split(" ") : [], me = this;
      if (sortarr.length > 1) {
        serverQueryUtils.saveColumnPreferences({
          scope: me,
          widgetType: widgetConstants.D2.RENDITIONS,
          widgetName: me.widgetName,
          connector: me.node.connector,
          columnPreference: me.columnPreference,
          sortOrder: me.orderBy
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
        });
      }
    },
    fetchRenditionModel: function(method, collection, options) {
      var me = this, promise = $.Deferred();
      var oldSuccess = options.success;
      options.parse = false;
      options.headers = options.headers || {};
      options.success = function(response, status, xhr) {
        me.fecthRenditionModelData(response).done(function(response) {
          oldSuccess.call(options.context, response, status, xhr);
          promise.resolve();
        }).fail(function(error) {
          promise.reject(error);
        });
      };
      Backbone.sync.call(me, method, collection, options).fail(promise.reject);
      return promise.promise();
    },
    fecthRenditionModelData: function(response) {
      var me = this, promise = $.Deferred();
      response = serverQueryUtils.parseResponse(response, {
        scope: this
      });
      if (response.length > 0) {
        var contentIds = _.pluck(response, "id");
        serverQueryUtils.fetchDataForObjects({
          ids: contentIds,
          connector: me.node.connector,
          actions: {
            menuType: constants.MenuTypes.DETAIL_RENDITIONS,
            widgetType: widgetConstants.D2.RENDITIONS,
            parentIds: _.map(contentIds, function() {
              return me.node.get("id");
            })
          }
        }).done(function(output) {
          _.each(response, function(item) {
            item.name = item.a_content_type;
            item.actions = output.actions[item.id];
            var permission = me.node.get("basePermissions");
            if (permission && permission.read === true) {
              item.actions.push({
                signature: "open"
              });
            }
          });
          promise.resolve(response);
        }).fail(function(err) {
          promise.reject(err);
        });
      } else {
        promise.resolve(response);
      }
      return promise.promise();
    }
  });
  ClientSideBrowsableMixin.mixin(MetadataRenditionCollection.prototype);
  NodeResourceMixin.mixin(MetadataRenditionCollection.prototype);
  var originalFetch = MetadataRenditionCollection.prototype.fetch;
  MetadataRenditionCollection.prototype.fetch = function(options) {
    if (this._lastFilterAndSortCriteria && !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy) && this.columnPreference) {
      this._saveColumnPreference();
    }
    return originalFetch.call(this, options);
  };
  MetadataRenditionCollection.prototype.compareObjectsForSort = function(property, left, right) {
    var sortSchema = this.columnTypes[property];
    if (!sortSchema) {
      this.columnTypes[property] = {};
      sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
      this.columnTypes[property] = sortSchema;
    }
    return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, false);
  };
  return MetadataRenditionCollection;
});