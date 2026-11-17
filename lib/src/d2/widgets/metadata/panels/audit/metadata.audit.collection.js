/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/columns", "nuc/models/mixins/node.resource/node.resource.mixin", "nuc/models/browsable/client-side.mixin", "nuc/models/node/node.model", "dctmw/server.adaptors/converters/node", "d2/server.adaptors/converters/servercolumns", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "d2/utils/sort.utils", "d2/utils/constants", "d2/utils/graphics/graphics.resources", "d2/utils/widget.constants", "i18n!d2/widgets/metadata/panels/audit/impl/nls/lang" ], function(module, $, _, Backbone, NodeColumnCollection, NodeResourceMixin, ClientSideBrowsableMixin, NodeModel, nodeConverter, serverColumnsConverter, RestLinkrels, RestResources, serverQueryUtils, sortUtils, constants, GraphicsResources, widgetConstants, lang) {
  "use strict";
  var AuditNodeModel = NodeModel.extend({
    url: function() {
      return RestLinkrels.getLink(this.get("links"), RestLinkrels.SELF);
    }
  });
  var MetadataAuditCollection = Backbone.Collection.extend({
    model: AuditNodeModel,
    constructor: function MetadataAuditCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      options = options || {};
      this.makeNodeResource(options).makeClientSideBrowsable(options);
      this.columns = new NodeColumnCollection();
      this.columnTypes = {};
      if (options.clientColumns) {
        var me = this;
        this.clientColumns = options.clientColumns;
        _.each(options.clientColumns, function(col) {
          if (col.sort === true && col.direction) {
            me.orderBy = col.column_key + " " + col.direction.toLowerCase();
            me.sort = col.sort;
          }
        });
        this.columns.reset(options.clientColumns);
      }
      this.sizeLimit = options.sizeLimit;
      this.showInTargetBrowse = options.showInTargetBrowse;
    },
    url: function() {
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.AUDIT_TRAIL);
      url = url + "?inline=true&items-per-page=1000&include-total=true&audited_obj_id=" + this.node.get("id") + "&view=:all" + "&parent_id=" + this.node.get("parent_id");
      for (let key in this.filters) {
        if (!this.filters[key]) {
          delete this.filters[key];
        }
      }
      let filterKeys = Object.keys(this.filters);
      if (this.hasMoreRecords && filterKeys.length > 0) {
        url = url + "&filter=";
        for (let index in filterKeys) {
          if (index > 0) url = url + " and ";
          url = url + "contains(lower(" + filterKeys[index] + "),'" + this.filters[filterKeys[index]].toLowerCase() + "')";
        }
      }
      return url;
    },
    sync: function(method, collection, options) {
      var promise = $.Deferred();
      var w = RestResources.getCurrentUser().get("defaultWidgets");
      this.widgetName = w[widgetConstants.DEFAULT.AUDIT] || "";
      collection.options || (collection.options = {});
      collection.options.widgetName = w[widgetConstants.DEFAULT.AUDIT];
      collection.widgetType = widgetConstants.D2.AUDIT;
      var me = this;
      var widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.AUDIT, this.widgetName);
      me.fetchColumnPreferences(me.widgetName, widgetConfig).done(function(isDisableLocationColumn) {
        me.fetchAuditModel(method, collection, options, isDisableLocationColumn).done(function() {
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
        var isDisableLocationColumn = true;
        serverQueryUtils.fetchColumnPreferences({
          scope: me,
          widgetType: widgetConstants.D2.AUDIT,
          widgetName: me.widgetName,
          connector: me.node.connector,
          columnOptions: {
            typeColumn: true,
            reservedColumn: false,
            externalShareColumn: false,
            commentColumn: false,
            favoriteColumn: false,
            locationColumn: {
              enabled: !isDisableLocationColumn,
              title: lang.Location
            }
          }
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
          me.clientColumns = clientCols;
          _.each(clientCols, function(col) {
            col.filter = true;
            if (col.column_key === "event_source") {
              col.customization_hidden = true;
              col.filter = false;
            }
            if (col.column_key === "time_stamp") {
              col.filter = false;
            }
            if (col.column_key === "type") {
              col.customization_hidden = true;
              col.filter = false;
            }
            if (col.sort === true && col.direction) {
              me.orderBy = col.column_key + " " + col.direction.toLowerCase();
            }
          });
          me.columns.reset(me.clientColumns);
          me.columnTypes = {};
          promise.resolve(isDisableLocationColumn);
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
          widgetType: widgetConstants.D2.AUDIT,
          widgetName: me.widgetName,
          connector: me.node.connector,
          columnPreference: me.columnPreference,
          sortOrder: me.orderBy
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
        });
      }
    },
    fetchAuditModel: function(method, collection, options, isDisableLocationColumn) {
      var me = this, promise = $.Deferred();
      var oldSuccess = options.success;
      options.parse = false;
      options.headers = options.headers || {};
      options.success = function(response, status, xhr) {
        me.fetchAuditModelData(response, isDisableLocationColumn).done(function(response) {
          oldSuccess.call(options.context, response, status, xhr);
          promise.resolve();
        }).fail(function(error) {
          promise.reject(error);
        });
      };
      Backbone.sync.call(me, method, collection, options).fail(promise.reject);
      return promise.promise();
    },
    fetchAuditModelData: function(response, isDisableLocationColumn) {
      var me = this, promise = $.Deferred();
      if (_.isEmpty(me.filters)) me.hasMoreRecords = !!response["has-more-records"];
      me.totalFromServer = response["total"];
      _.each(response.entries, function(entry) {
        entry.content.properties = _.extend({}, me.node.attributes, entry.content.properties);
      });
      response = serverQueryUtils.parseResponse(response, {
        scope: this
      });
      if (response.length > 0) {
        var parameters = {
          connector: me.node.connector,
          permissions: {
            permissionLevel: "read"
          },
          externalShare: true,
          actions: {
            menuType: constants.MenuTypes.DETAIL_AUDIT,
            widgetType: widgetConstants.D2.AUDIT
          }
        };
        if (!isDisableLocationColumn) {
          _.extend(parameters, {
            locations: {
              fullPath: false,
              ancestorDetails: GraphicsResources.hasConditionAttributes()
            }
          });
        }
        serverQueryUtils.fetchDataForObjects(parameters).done(function(output) {
          _.each(response, function(item) {
            item.actions = output.actions[item.id];
            item["basePermissions"] = output.permissions[item.id] ? output.permissions[item.id]["base-permission"] : {};
            if (output.locations && output.locations[item.id]) {
              item["parent_id_expand"] = output.locations[item.id];
              item["parent_name"] = item.parent_id_expand.name;
            }
            if (output.externalShare && output.externalShare[item.id]) {
              item["externalShare"] = output.externalShare[item.id];
            }
            var tempNode = {
              id: item.id
            };
            nodeConverter.setNodeType(tempNode);
            if (tempNode.type === constants.Types.CABINET || tempNode.type === constants.Types.FOLDER) {
              item.actions.push({
                signature: "browse"
              });
            } else {
              var permission = output.permissions[item.id];
              if (permission && permission["base-permission"] && permission["base-permission"].read === true) {
                item.actions.push({
                  signature: "open"
                });
              }
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
  ClientSideBrowsableMixin.mixin(MetadataAuditCollection.prototype);
  NodeResourceMixin.mixin(MetadataAuditCollection.prototype);
  var originalFetch = MetadataAuditCollection.prototype.fetch;
  MetadataAuditCollection.prototype.fetch = function(options) {
    if (options) {
      options.reload = true;
    }
    if (this._lastFilterAndSortCriteria && !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy) && this.columnPreference) {
      this._saveColumnPreference();
    }
    return originalFetch.call(this, options);
  };
  MetadataAuditCollection.prototype.compareObjectsForSort = function(property, left, right) {
    var sortSchema = this.columnTypes[property];
    if (!sortSchema) {
      this.columnTypes[property] = {};
      sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
      this.columnTypes[property] = sortSchema;
    }
    return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, RestResources.getCurrentUser().get("preferences").order_folder_before !== false, this.orderBy);
  };
  return MetadataAuditCollection;
});