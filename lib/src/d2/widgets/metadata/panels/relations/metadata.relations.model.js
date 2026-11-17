/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/columns", "nuc/models/mixins/node.resource/node.resource.mixin", "nuc/models/browsable/client-side.mixin", "nuc/models/node/node.model", "dctmw/server.adaptors/converters/node", "d2/server.adaptors/converters/servercolumns", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/graphics/graphics.resources", "d2/utils/server.query.utils", "d2/utils/sort.utils", "d2/utils/constants", "d2/utils/widget.constants", "i18n!d2/widgets/metadata/panels/relations/impl/nls/lang" ], function(module, $, _, Backbone, NodeColumnCollection, NodeResourceMixin, ClientSideBrowsableMixin, NodeModel, nodeConverter, serverColumnsConverter, RestLinkrels, RestResources, GraphicsResources, serverQueryUtils, sortUtils, constants, widgetConstants, lang) {
  "use strict";
  var RelationNodeModel = NodeModel.extend({
    url: function() {
      return RestLinkrels.getLink(this.get("links"), RestLinkrels.SELF);
    }
  });
  var MetadataRelationCollection = Backbone.Collection.extend({
    model: RelationNodeModel,
    constructor: function MetadataRelationCollection(models, options) {
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
      this.relationPopup = options.relationPopup || false;
      this.sizeLimit = options.sizeLimit;
      this.showInTargetBrowse = options.showInTargetBrowse;
    },
    url: function() {
      var url = RestLinkrels.getLink(this.node.get("links"), RestLinkrels.D2_RELATIONS);
      return serverQueryUtils.appendQueryParams(url, {
        scope: this,
        widgetName: this.widgetName,
        clientColumsn: this.clientColumns,
        sort: this.sort,
        orderBy: this.orderBy,
        parent_id: this.node.get("parent_id")
      });
    },
    sync: function(method, collection, options) {
      var promise = $.Deferred();
      if (this.relationPopup || this.showInTargetBrowse) {
        this.fetchRelationModel(method, collection, options, true).done(function() {
          promise.resolve();
        }).fail(function(err) {
          promise.reject(err);
        });
      } else {
        var w = RestResources.getCurrentUser().get("defaultWidgets");
        this.widgetName = w[widgetConstants.DEFAULT.RELATIONS] || "";
        collection.options || (collection.options = {});
        collection.options.widgetName = w[widgetConstants.DEFAULT.RELATIONS];
        collection.widgetType = widgetConstants.D2.RELATIONS;
        var me = this;
        var widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.RELATIONS, this.widgetName);
        me.fetchColumnPreferences(me.widgetName, widgetConfig).done(function(isDisableLocationColumn) {
          me.fetchRelationModel(method, collection, options, isDisableLocationColumn).done(function() {
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
      me.widgetName = wName;
      if (me.clientColumns && me.clientColumns.length !== 0) {
        me.columns.reset(me.clientColumns);
        promise.resolve();
      } else {
        var isDisableLocationColumn = false;
        if (widgetConfig.widgetParams && widgetConfig.widgetParams.is_disable_loc_col_smartview === "true") {
          isDisableLocationColumn = true;
        }
        serverQueryUtils.fetchColumnPreferences({
          scope: me,
          widgetType: widgetConstants.D2.RELATIONS,
          widgetName: me.widgetName,
          connector: me.node.connector,
          columnOptions: {
            typeColumn: true,
            reservedColumn: true,
            externalShareColumn: true,
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
          widgetType: widgetConstants.D2.RELATIONS,
          widgetName: me.widgetName,
          connector: me.node.connector,
          columnPreference: me.columnPreference,
          sortOrder: me.orderBy
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
        });
      }
    },
    fetchRelationModel: function(method, collection, options, isDisableLocationColumn) {
      var me = this, promise = $.Deferred();
      var oldSuccess = options.success;
      options.parse = false;
      options.headers = options.headers || {};
      options.headers.accept = constants.MediaTypes.DCTM_D2_V1_JSON;
      options.success = function(response, status, xhr) {
        me.fetchRelationModelData(response, isDisableLocationColumn).done(function(response) {
          oldSuccess.call(options.context, response, status, xhr);
          promise.resolve();
        }).fail(function(error) {
          promise.reject(error);
        });
      };
      Backbone.sync.call(me, method, collection, options).fail(promise.reject);
      return promise.promise();
    },
    fetchRelationModelData: function(response, isDisableLocationColumn) {
      var me = this, promise = $.Deferred();
      _.each(response.entries, function(entry) {
        entry.content.properties = _.extend(Object.fromEntries(Object.entries(entry.content.properties).map(([ key, value ]) => {
          if (key === "associate_id" || key === "r_object_id") {
            return [ key, value ];
          } else {
            return [ `${entry.content.type}.${key}`, value ];
          }
        })), entry.content["child-attributes"]);
        var r_object_id, getProperty = key => entry.content.properties[`${entry.content.type}.${key}`];
        if (entry.content["properties"].child_id === me.node.get("id")) {
          r_object_id = getProperty("parent_id");
        } else {
          r_object_id = getProperty("child_id");
        }
        entry.content.properties["isChildOfRelation"] = true;
        entry.content.properties.rIsVirtualDoc = entry.content.properties.rIsVirtualDoc === "true" ? true : false;
        entry.content.properties["r_object_id"] = r_object_id;
        entry.content.properties["a_content_type"] = entry.content["properties"].aContentType;
        entry.content.properties["origLinks"] = entry.content.links;
        entry.content.properties["resetOrigLinks"] = true;
        entry.content.properties["relation_type_name"] = entry.content.type;
      });
      response = serverQueryUtils.parseResponse(response, {
        scope: this
      });
      if (response.length > 0 && !me.relationPopup) {
        var parameters = {
          ids: _.pluck(response, "id"),
          connector: me.node.connector,
          permissions: {
            permissionLevel: "read"
          },
          externalShare: true,
          actions: {
            menuType: constants.MenuTypes.DETAIL_RELATIONS,
            widgetType: widgetConstants.D2.RELATIONS,
            associateIds: _.pluck(response, "associate_id")
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
            item.actions.push({
              signature: "D2-metadataProperties"
            });
            item["basePermissions"] = output.permissions[item.id] ? output.permissions[item.id]["base-permission"] : {};
            if (output.locations && output.locations[item.id]) {
              item.parent_id_expand = output.locations[item.id];
              item.parent_name = item.parent_id_expand.name;
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
  ClientSideBrowsableMixin.mixin(MetadataRelationCollection.prototype);
  NodeResourceMixin.mixin(MetadataRelationCollection.prototype);
  var originalFetch = MetadataRelationCollection.prototype.fetch;
  MetadataRelationCollection.prototype.fetch = function(options) {
    if (this._lastFilterAndSortCriteria && !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy) && this.columnPreference) {
      this._saveColumnPreference();
    }
    return originalFetch.call(this, options);
  };
  MetadataRelationCollection.prototype.compareObjectsForSort = function(property, left, right) {
    var sortSchema = this.columnTypes[property];
    if (!sortSchema) {
      this.columnTypes[property] = {};
      sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
      this.columnTypes[property] = sortSchema;
    }
    return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, RestResources.getCurrentUser().get("preferences").order_folder_before !== false, this.orderBy);
  };
  return MetadataRelationCollection;
});