/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "dctmw/server.adaptors/converters/node", "d2/utils/contexts/context.controller", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/node.utils", "dctmw/utils/utils", "d2/utils/widgets.utils", "d2/utils/constants", "d2/utils/contexts/factories/node.navigation", "i18n!d2/server.adaptors/models/impl/nls/lang" ], function($, _, Url, nodeConverter, D2ContextController, RestResources, RestLinkrels, nodeUtils, utils, widgetUtils, constants, NodeNavigationCollctionFactory, lang) {
  "use strict";
  return {
    mixin: function(prototype) {
      var superSyncMethod = prototype.sync;
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        url: function() {
          var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.OBJECTS_LOCATIONS);
          return Url.appendQuery(url, Url.combineQueryString({
            "object-ids": this.node.get("id")
          }));
        },
        parse: function(response) {
          var ancestors = [], pathIds = [], pathNames = [], i, index, bcRoot, nodeId = this.node.get("id"), config = response.specialNodeConfig, pathIdsStr, pathNamesStr, nodeNavigationCollection = this.connector.context && this.connector.context.getCollection(NodeNavigationCollctionFactory);
          if (!this.root) {
            bcRoot = D2ContextController.getBreadcrumbRoot();
            this.root = bcRoot && bcRoot.root || {};
            this.rootSubId = bcRoot && bcRoot.rootSubId || undefined;
          }
          if (response && _.isArray(response.entries) && response.entries.length > 0) {
            var entry = response.entries[0].content;
            var locationObj = null;
            const namedSessionStorage = utils.getSessionStore("navigatedFromDoclist");
            if (entry.properties && entry.properties.length > 1) {
              locationObj = _.find(entry.properties, function(location) {
                return this.node.parent && location.ancestor_id_path && location.ancestor_id_path.endsWith(this.node.parent.get("id"));
              }.bind(this));
              if (nodeNavigationCollection && nodeNavigationCollection.length > 0) {
                var nodePath = [], widgetName = this.node.get("widgetPreference")?.widgetName, widgetAncestorInfo = widgetUtils.getAncestorInfo(widgetName);
                if (widgetAncestorInfo?.ancestors && namedSessionStorage.get("navigatedFromDoclist")) {
                  this.getNodePath(widgetAncestorInfo?.ancestors, nodePath);
                } else {
                  this.getNodePath(nodeNavigationCollection, nodePath);
                }
                var nodePathString = "/" + nodePath.join("/");
                if (this?.node?.widgetConfig?.widgetParams?.start_path_smartview) {
                  locationObj = _.find(entry.properties, function(location) {
                    return location.ancestor_id_path && location.ancestor_id_path.endsWith(nodePathString);
                  }.bind(this));
                } else {
                  locationObj = _.find(entry.properties, function(location) {
                    return location.ancestor_id_path && _.isEqual(location.ancestor_id_path, nodePathString);
                  }.bind(this));
                }
              }
            }
            if (!locationObj) {
              if (entry.properties) {
                locationObj = entry.properties[0];
              } else {
                if (!this.node.has("type")) {
                  nodeConverter.setNodeType(this.node.attributes);
                }
                if (this.node.get("type") === constants.Types.CABINET) {
                  locationObj = {
                    ancestor_id_path: entry.id,
                    r_folder_path: entry.name
                  };
                } else {
                  var path = "/" + constants.HiddenItems.ID + "/";
                  locationObj = {
                    ancestor_id_path: path + entry.id,
                    r_folder_path: path + entry.name
                  };
                }
              }
            }
            if (namedSessionStorage.get("navigatedFromDoclist")) {
              namedSessionStorage.remove("navigatedFromDoclist");
            }
            pathIdsStr = locationObj.ancestor_id_path;
            if (pathIdsStr.indexOf("/") === 0) {
              pathIdsStr = pathIdsStr.substr(1);
            }
            pathNamesStr = locationObj.r_folder_path;
            if (pathNamesStr.indexOf("/") === 0) {
              pathNamesStr = pathNamesStr.substr(1);
            }
            pathIds = pathIdsStr.split("/");
            pathNames = pathNamesStr.split("/");
          }
          this._setRootForNode(config, pathIds);
          if (utils.isMobile()) {
            this._resetRootForMobile(config, pathIds, pathNames);
          }
          if (!nodeConverter.isNonDCTMNode(this.node) && this.node.get("_is_home_cabinet") !== true) {
            if (pathIds.indexOf(nodeId) === -1) {
              pathIds.push(nodeId);
              pathNames.push(this.node.get("name") || _.isArray(response.entries) && response.entries[0].content && response.entries[0].content["name"] || "");
            }
            if (!this.rootSubId) {
              if (this.root.id === constants.NodeId.FAVORITES || nodeConverter.isDQLNode(this.root.id)) {
                this.rootSubId = nodeId;
              }
            }
          }
          if (this.rootSubId && pathIds[0] !== constants.HiddenItems.ID) {
            index = pathIds.indexOf(this.rootSubId);
            if (index === -1) {
              this.rootSubId = nodeId;
              index = pathIds.indexOf(this.rootSubId);
            }
            if (index !== -1) {
              pathIds = pathIds.slice(index);
              pathNames = pathNames.slice(index);
            }
          }
          index = pathIds.indexOf(config.startingPath);
          if (index !== -1) {
            pathIds = pathIds.slice(index);
            pathNames = pathNames.slice(index);
          }
          if (this.root._is_home_cabinet) {
            index = pathIds.indexOf(this.root.id);
            if (index !== -1) {
              pathIds = pathIds.slice(index + 1);
              pathNames = pathNames.slice(index + 1);
            }
          }
          for (i = 0; i < pathIds.length; i++) {
            if (pathIds[i] === constants.HiddenItems.ID && pathNames[i] === constants.HiddenItems.ID) {
              pathNames[i] = constants.HiddenItems.NAME;
            }
            var objectName = pathNames[i];
            if (this.options.isTargetBrowse && !config.treeEnabled && config.homeCabinetEnabled && pathIds[i] === nodeUtils.getHomeCabinetId()) {
              var homeNode = this.getHomeCabineNode();
              objectName = homeNode.name;
            }
            ancestors.push({
              r_object_id: pathIds[i],
              object_name: objectName
            });
          }
          ancestors = nodeConverter.convertAncestors(ancestors);
          if (pathIds[0] === constants.HiddenItems.ID) {
            ancestors.splice(0, 0, this.root);
          } else {
            if (this.root.id === constants.NodeId.REPOSITORY || nodeConverter.isDQLNode(this.root.id)) {
              ancestors.splice(0, 0, this.root);
            }
            if (this.root.id === constants.NodeId.FAVORITES || this.root._is_home_cabinet) {
              ancestors.splice(0, 0, this.root);
              if (!config.treeEnabled) {
                ancestors.splice(0, 0, this.startPathNode || nodeUtils.createSpecialNode(constants.NodeId.REPOSITORY));
              }
            }
          }
          if (!utils.isMobile() && !this.options.isTargetBrowse) {
            D2ContextController.setBreadcrumbRoot({
              root: _.pick(this.root, "id", "name", "type", "_is_home_cabinet"),
              rootSubId: this.rootSubId
            });
          }
          return ancestors;
        },
        sync: function(method, model, options) {
          var me = this, args = arguments;
          if (method === "read") {
            var deferred = $.Deferred();
            me.node.ensureFetched().done(function() {
              var spcCfg = nodeUtils.getSpecialNodeConfig(me.node), startNodePromise;
              if (!me.startPathNode && !spcCfg.isDqlRoot && spcCfg.startingPath !== constants.NodeId.REPOSITORY) {
                startNodePromise = me._fetchStartPathNode(spcCfg);
              } else {
                startNodePromise = $.Deferred().resolve().promise();
              }
              startNodePromise.done(function() {
                if (nodeConverter.isNonDCTMNode(me.node) || me.node.get("_is_home_cabinet") === true) {
                  me.trigger("request", me, {}, options);
                  setTimeout(function() {
                    options.success.call(options.context, {
                      entries: [],
                      specialNodeConfig: spcCfg
                    }, "success", {});
                    deferred.resolve();
                  });
                } else {
                  var oldSuccess = options.success;
                  options.success = function(response, status, xhr) {
                    response = response || {};
                    response.specialNodeConfig = spcCfg;
                    oldSuccess.call(options.context, response, status, xhr);
                    deferred.resolve();
                  };
                  superSyncMethod.apply(me, args);
                }
              }).fail(deferred.reject);
            }).fail(deferred.reject);
            return deferred.promise();
          }
          return superSyncMethod.apply(me, args);
        },
        getHomeCabineNode: function() {
          return {
            id: nodeUtils.getHomeCabinetId(),
            name: lang.homeCabinetNodeName,
            type: nodeUtils.getHomeCabinetType(),
            _is_home_cabinet: true
          };
        },
        getNodePath: function(breadCrumNodeCollection, nodePath) {
          breadCrumNodeCollection.forEach(function(node) {
            if (node.id !== "repository" && node.id !== this.node.get("id")) {
              nodePath.push(node.id);
            }
          }, this);
        },
        _fetchStartPathNode: function(config) {
          var me = this, deferred = $.Deferred();
          $.ajax(this.connector.extendAjaxOptions({
            url: Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF), "objects", config.startingPath),
            success: function(response) {
              me.startPathNode = {
                id: response.properties.r_object_id,
                name: response.properties.object_name
              };
              deferred.resolve();
            },
            error: function(xhr, status, error) {
              deferred.reject(utils.parseAjaxError(xhr, status, error));
            }
          }));
          return deferred.promise();
        },
        _setRootForNode: function(config, pathIds) {
          var nodeId = this.node.get("id"), homeNode = this.getHomeCabineNode();
          if (pathIds[0] === constants.HiddenItems.ID) {
            var checkNodeType = {
              id: config.startingPath
            };
            nodeConverter.setNodeType(checkNodeType);
            if (checkNodeType.type === constants.Types.FOLDER || checkNodeType.type === constants.Types.CABINET || config.isDqlRoot) {
              this.root = {
                container: true,
                id: config.startingPath,
                name: config.objectName,
                type: checkNodeType.type
              };
            } else {
              var currRepo = RestResources.getCurrentRepository();
              this.root = {
                container: true,
                id: constants.NodeId.REPOSITORY,
                name: currRepo.get("description") || currRepo.get("name"),
                type: constants.Types.REPOSITORY
              };
            }
          } else if (nodeConverter.isNonDCTMNode(this.node)) {
            this.root = nodeUtils.createSpecialNode(nodeId);
            delete this.rootSubId;
          } else if (this.node.get("_is_home_cabinet") === true) {
            this.root = homeNode;
            delete this.rootSubId;
          } else {
            var pRoots = this.node.get("_possibleRoots") || {};
            let nodeNavigationCollectionFirst = this.connector.context && this.connector.context.getCollection(NodeNavigationCollctionFactory) && this.connector.context.getCollection(NodeNavigationCollctionFactory).at(0);
            if (!Object.prototype.hasOwnProperty.call(pRoots, "startingPath") && this?.node?.widgetConfig?.widgetParams?.start_path_smartview && this.node.widgetConfig.widgetParams.start_path_smartview === nodeNavigationCollectionFirst?.get("id")) {
              pRoots.startingPath = true;
            }
            pRoots.favoritesNodes = pRoots.favoritesNodes || [];
            if (!pRoots.startingPath && !nodeConverter.isDQLNode(this.root.id)) {
              this.root = nodeUtils.createSpecialNode(constants.NodeId.REPOSITORY);
              delete this.rootSubId;
            }
            if (this.root.id !== constants.NodeId.REPOSITORY && !nodeConverter.isDQLNode(this.root.id) && (this.root.id || !pRoots.startingPath) && (!this.root._is_home_cabinet || !pRoots.homeCabinet)) {
              if (this.root.id === constants.NodeId.FAVORITES && pRoots.favoritesNodes.length) {
                if (pRoots.favoritesNodes.indexOf(this.rootSubId) === -1) {
                  this.rootSubId = pRoots.favoritesNodes[0];
                }
              } else {
                delete this.rootSubId;
                if (pRoots.favoritesNodes.length) {
                  this.root = nodeUtils.createSpecialNode(constants.NodeId.FAVORITES);
                  this.rootSubId = pRoots.favoritesNodes[0];
                } else if (pRoots.homeCabinet) {
                  this.root = homeNode;
                } else if (pRoots.startingPath) {
                  this.root = {};
                } else if (config.startingPath === constants.NodeId.REPOSITORY) {
                  this.root = nodeUtils.createSpecialNode(constants.NodeId.REPOSITORY);
                }
              }
            }
            if (!config.treeEnabled && nodeId === config.startingPath && nodeId !== constants.NodeId.REPOSITORY) {
              this.root = {};
            }
          }
        },
        _resetRootForMobile: function(config, pathIds, pathNames) {
          if (this.root._is_home_cabinet && pathIds.indexOf(this.root.id) === -1) {
            pathIds.push(this.root.id);
            pathNames.push(this.root.name);
          }
          if (this.rootSubId || this.root._is_home_cabinet || config.startingPath === constants.NodeId.REPOSITORY) {
            this.root = nodeUtils.createSpecialNode(constants.NodeId.REPOSITORY);
            delete this.rootSubId;
          } else {
            this.root = {};
          }
        }
      });
    }
  };
});