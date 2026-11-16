/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/columns", "nuc/models/mixins/node.resource/node.resource.mixin", "nuc/models/browsable/client-side.mixin", "nuc/models/node/node.model", "dctmw/server.adaptors/converters/node", "d2/server.adaptors/converters/servercolumns", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "d2/utils/sort.utils", "d2/utils/constants", "d2/utils/widget.constants", "i18n!d2/widgets/metadata/panels/locations/impl/nls/lang" ], function(module, $, _, Backbone, NodeColumnCollection, NodeResourceMixin, ClientSideBrowsableMixin, NodeModel, nodeConverter, serverColumnsConverter, RestLinkrels, RestResources, serverQueryUtils, sortUtils, constants, widgetConstants, lang) {
  "use strict";
  var LocationsNodeModel = NodeModel.extend({
    url: function() {
      return RestLinkrels.getLink(this.get("links"), RestLinkrels.SELF);
    }
  });
  var MetadataLocationCollection = Backbone.Collection.extend({
    model: LocationsNodeModel,
    constructor: function MetadataLocationCollection(models, options) {
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
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.OBJECTS_LOCATIONS);
      return url = url + "?inline=true&links=true&location_type=FOLDER%7cVD&widget-name=" + this.widgetName + "&object-ids=" + this.node.get("id") + "&parent_id=" + this.node.get("parent_id");
    },
    sync: function(method, collection, options) {
      var promise = $.Deferred();
      var w = RestResources.getCurrentUser().get("defaultWidgets");
      this.widgetName = w[widgetConstants.DEFAULT.LOCATIONS] || "";
      collection.options || (collection.options = {});
      collection.options.widgetName = w[widgetConstants.DEFAULT.LOCATIONS];
      collection.widgetType = widgetConstants.D2.LOCATIONS;
      var me = this;
      var widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.LOCATIONS, this.widgetName);
      me.fetchColumnPreferences(me.widgetName, widgetConfig).done(function() {
        me.fetchLocationsModel(method, collection, options).done(function() {
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
          widgetType: widgetConstants.D2.LOCATIONS,
          widgetName: me.widgetName,
          connector: me.node.connector,
          columnOptions: {
            typeColumn: false,
            reservedColumn: true,
            externalShareColumn: true,
            commentColumn: false,
            favoriteColumn: false,
            locationColumn: {
              enabled: !isDisableLocationColumn,
              title: lang.Location
            },
            isLocationMetadataWidgetView: true
          }
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
          var clientColms = _.without(clientCols, _.findWhere(clientCols, {
            column_key: "name"
          }));
          me.clientColumns = clientColms;
          _.each(clientCols, function(col) {
            col.customization_hidden = true;
            if (col.column_key === "parent_id") {
              col.isNaming = true;
              col.customization_width = 150;
              col.customization_min_width = 150;
              col.customization_hidden = false;
            }
            if (col.column_key === "d2_folder_path") {
              col.customization_hidden = false;
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
          widgetType: widgetConstants.D2.LOCATIONS,
          widgetName: me.widgetName,
          connector: me.node.connector,
          columnPreference: me.columnPreference,
          sortOrder: me.orderBy
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
        });
      }
    },
    fetchLocationsModel: function(method, collection, options) {
      var me = this, promise = $.Deferred();
      var oldSuccess = options.success;
      options.parse = false;
      options.headers = options.headers || {};
      options.success = function(response, status, xhr) {
        me.fetchLocationsModelData(response).done(function(response) {
          oldSuccess.call(options.context, response, status, xhr);
          promise.resolve();
        }).fail(function(error) {
          promise.reject(error);
        });
      };
      Backbone.sync.call(me, method, collection, options).fail(promise.reject);
      return promise.promise();
    },
    fetchLocationsModelData: function(response) {
      var me = this, promise = $.Deferred();
      let propertiesList = new Array();
      _.each(response.entries, function(entry) {
        _.each(entry.content.properties, function(properties) {
          const prepareAncestorList = new Array();
          const idsList = _.compact(properties["ancestor_id_path"].split("/"));
          const pathNamesList = _.compact(properties["r_folder_path"].split("/"));
          const repositoryList = {
            id: "repository",
            name: RestResources.getCurrentRepository().get("name"),
            type: 141,
            type_name: constants.NodeId.REPOSITORY_SERVER,
            container: true
          };
          _.each(idsList, function(id, index) {
            const linkObject = {
              id: id,
              name: pathNamesList[index] === "*" ? "..." : pathNamesList[index],
              parent_name: pathNamesList[index - 1],
              parent_id: idsList[index - 1],
              type: properties["location_type"] === "VD" ? 144 : 0,
              type_name: entry["type_name"],
              rObjectType: entry.content["rObjectType"],
              isChildViewOfParent: true,
              rIsVirtualDoc: properties["location_type"] === "VD"
            };
            prepareAncestorList.push(linkObject);
          });
          prepareAncestorList.unshift(repositoryList);
          propertiesList.push(new NodeModel(_.extend({}, prepareAncestorList[prepareAncestorList.length - 1], {
            r_folder_path: properties["r_folder_path"],
            i_ancestor_id: _.compact(properties["ancestor_id_path"].split("/")),
            parent_id_expand: prepareAncestorList[prepareAncestorList.length - 1],
            ancestor_list: prepareAncestorList
          }), {
            connector: me.node.connector,
            autofetch: true
          }));
        });
      });
      if (propertiesList.length > 0) {
        var parameters = {
          ids: _.map(propertiesList, item => {
            return item.get("id");
          }),
          connector: me.node.connector,
          permissions: {
            permissionLevel: "read"
          },
          actions: {
            menuType: constants.MenuTypes.DETAIL_LOCATIONS,
            widgetType: widgetConstants.D2.LOCATIONS,
            associateIds: _.map(propertiesList, item => {
              return item.get("id");
            })
          },
          externalShare: true
        };
        serverQueryUtils.fetchDataForObjects(parameters).done(function(output) {
          _.each(propertiesList, function(item) {
            item.actions.push(output.actions[item.get("id")]);
            item.actions.push({
              signature: "D2-metadataProperties"
            });
            item["basePermissions"] = output.permissions[item.get("id")] ? output.permissions[item.get("id")]["base-permission"] : {};
            me._getObjectData({
              node: item,
              connector: item.connector,
              link: me._updatedNodeLinks(item.get("id"))[0]
            });
            if (output.externalShare && output.externalShare[item.get("id")]) {
              item["externalShare"] = output.externalShare[item.get("id")];
            }
            var tempNode = {
              id: item.id
            };
            nodeConverter.setNodeType(tempNode);
          });
          promise.resolve(propertiesList);
        }).fail(function(err) {
          promise.reject(err);
        });
      } else {
        promise.resolve(propertiesList);
      }
      return promise.promise();
    },
    _getObjectData: function(options) {
      var deferred = $.Deferred();
      $.ajax(options.connector.extendAjaxOptions({
        url: options.connector.connection.url + options.link.href,
        success: function(response) {
          options.node.attributes.links = response.links;
          deferred.resolve(response);
        },
        error: function(xhr, status, error) {
          deferred.reject(xhr, status, error);
        }
      }));
      return deferred.promise();
    },
    _updatedNodeLinks: function(id) {
      return [ {
        rel: "self",
        href: "/repositories/" + RestResources.getCurrentRepository().get("name") + "/objects/" + id
      } ];
    }
  });
  ClientSideBrowsableMixin.mixin(MetadataLocationCollection.prototype);
  NodeResourceMixin.mixin(MetadataLocationCollection.prototype);
  var originalFetch = MetadataLocationCollection.prototype.fetch;
  MetadataLocationCollection.prototype.fetch = function(options) {
    if (this._lastFilterAndSortCriteria && !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy) && this.columnPreference) {
      this._saveColumnPreference();
    }
    return originalFetch.call(this, options);
  };
  MetadataLocationCollection.prototype.compareObjectsForSort = function(property, left, right) {
    var sortSchema = this.columnTypes[property];
    if (!sortSchema) {
      this.columnTypes[property] = {};
      sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
      this.columnTypes[property] = sortSchema;
    }
    return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, RestResources.getCurrentUser().get("preferences").order_folder_before !== false, this.orderBy);
  };
  return MetadataLocationCollection;
});