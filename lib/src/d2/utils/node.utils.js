/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/widgets/nodestable/headermenuitems", "nuc/utils/url", "dctmw/server.adaptors/converters/node", "d2/utils/contexts/context.controller", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "dctmw/utils/utils", "d2/utils/constants", "d2/utils/widget.constants", "i18n!d2/server.adaptors/models/impl/nls/lang" ], function(require, $, _, Backbone, nodesTableHeaderMenuItems, Url, nodeConverter, D2ContextController, RestLinkrels, RestResources, serverQueryUtils, utils, constants, widgetConstants, lang) {
  "use strict";
  var GO_TO_NODE = "goToNode", highlightNodeDetails = utils.getLocalStore(constants.StorageKey.HIGHLIGHT_NODE_DETAILS);
  return {
    getHomeCabinetId: function() {
      return RestResources.getCurrentUser().get("_home_cabinet").id;
    },
    getHomeCabinetType: function() {
      return RestResources.getCurrentUser().get("_home_cabinet").type;
    },
    createSpecialNode: function(id) {
      var rawNode = this.createSpecialNodeRaw(id);
      if (!rawNode) {
        return rawNode;
      }
      return nodeConverter.convertNode(rawNode);
    },
    createSpecialNodeRaw: function(id) {
      var currRepo, toolItems = nodesTableHeaderMenuItems["headerMenuToolbar"].getCollection(), copyLinkItem = toolItems.find(function(item) {
        return item.get("signature") === "CopyLink";
      }), data = {
        properties: {
          r_object_id: id,
          actions: nodeConverter.isFavoritesNode(id) ? [] : [ {
            signature: "CopyLink",
            commandData: copyLinkItem && copyLinkItem.get("commandData")
          } ]
        },
        "base-permissions": {
          read: true
        }
      };
      if (nodeConverter.isRepositoryNode(id)) {
        currRepo = RestResources.getCurrentRepository();
        data.properties.object_name = currRepo.get("description") || currRepo.get("name");
        data.links = currRepo.get("links");
      } else if (nodeConverter.isFavoritesNode(id)) {
        data.properties.object_name = lang.favoritesNodeName;
      } else if (nodeConverter.isDQLNode(id)) {
        var wName = id, widgetConfig;
        wName = wName.substring(constants.DQL_NODE_PREFIX.length);
        widgetConfig = this.getNodeWidgetConfig(id, {
          name: wName
        });
        data.properties.object_name = widgetConfig.label_value;
      } else {
        return false;
      }
      return data;
    },
    getSpecialNodeConfig: function(node) {
      var wPref = node && node.get("widgetPreference"), widgetConfig = wPref && wPref.widgetConfig;
      if (!widgetConfig) {
        if (nodeConverter.isDQLNode(node)) {
          const nodeId = node.get("id");
          widgetConfig = this.getNodeWidgetConfig(nodeId, {
            name: nodeId.substring(constants.DQL_NODE_PREFIX.length)
          });
        }
        if (!widgetConfig) {
          var wInfo = D2ContextController.getWidgetInfo(), wType = wInfo.type || widgetConstants.D2.DOCLIST, wName = wInfo.name || RestResources.getCurrentUser().get("defaultWidgets")[widgetConstants.DEFAULT.DOCLIST];
          widgetConfig = serverQueryUtils.getWidgetConfig(wType, wName);
          if (!widgetConfig) {
            return {};
          }
        }
      }
      var startingPath, isDqlRoot = false, favoriteFoldersEnabled = widgetConfig.getParam("is_show_favorites_folders") === "true", favoriteDocumentsEnabled = widgetConfig.getParam("is_show_favorites_documents") === "true";
      if (widgetConfig.getParam("content_type") === "DQL") {
        isDqlRoot = true;
        startingPath = constants.DQL_NODE_PREFIX + widgetConfig.object_name;
      } else {
        startingPath = widgetConfig.getParam("start_path_smartview") || constants.NodeId.REPOSITORY;
      }
      return {
        startingPath: startingPath,
        treeEnabled: widgetConfig.getParam("is_enable_tree_nav_smartview") === "true",
        favoriteFoldersEnabled: favoriteFoldersEnabled,
        favoriteDocumentsEnabled: favoriteDocumentsEnabled,
        favoritesNodeEnabled: favoriteFoldersEnabled || favoriteDocumentsEnabled,
        homeCabinetEnabled: widgetConfig.getParam("is_show_home_cabinet") === "true",
        isDqlRoot: isDqlRoot,
        objectName: widgetConfig.object_name ? widgetConfig.object_name : ""
      };
    },
    getNodeWidgetConfig: function(nodeId, widgetInfo) {
      var widgetConfig = serverQueryUtils.getWidgetConfig(widgetInfo.type || widgetConstants.D2.DOCLIST, widgetInfo.name || "");
      if (nodeConverter.isDQLNode(nodeId) && widgetConfig.getParam("content_type") !== "DQL") {
        throw Error(_.str.sformat(lang.doclistDQLMismatchPath, widgetInfo.name));
      }
      return _.deepClone(widgetConfig);
    },
    getPossibleRoots: function(options) {
      var possibleRoots = {}, startingPath = options.startingPath !== constants.NodeId.REPOSITORY ? options.startingPath : undefined;
      if (_.isArray(options.ancestorIds)) {
        var homeCabinetId = this.getHomeCabinetId();
        possibleRoots.startingPath = !!startingPath && options.ancestorIds.indexOf(startingPath) !== -1;
        possibleRoots.homeCabinet = options.homeCabinetEnabled && options.ancestorIds.indexOf(homeCabinetId) !== -1;
        possibleRoots.favoritesNodes = _.filter(options.favoriteFolderIds || [], function(id) {
          return options.ancestorIds.indexOf(id) >= 0;
        });
      }
      return possibleRoots;
    },
    fetchFavoriteFolders: function(options) {
      var deferred = $.Deferred();
      if (!options.favoriteFoldersEnabled) {
        deferred.resolve([]);
      } else {
        var context = D2ContextController.getContext();
        if (context) {
          require([ "csui/utils/contexts/factories/favorites" ], function(FavoriteCollectionFactory) {
            var favCollection = context.getCollection(FavoriteCollectionFactory, {
              detached: true
            });
            favCollection.ensureFetched().done(function() {
              deferred.resolve(favCollection.pluck("id"));
            }).fail(deferred.reject);
          }, deferred.reject);
        }
      }
      return deferred.promise();
    },
    getHighlightNode: function() {
      return highlightNodeDetails.get(GO_TO_NODE);
    },
    setHighlightNode: function(data) {
      return highlightNodeDetails.set(GO_TO_NODE, data);
    },
    removeHighlightNode: function() {
      highlightNodeDetails.remove(GO_TO_NODE);
    },
    _showViewer: function(node) {
      return !node.get("container") && node.get("a_content_type");
    },
    getParentId: function(nodesCollection, args) {
      if (nodesCollection?.models?.length === 0) {
        return;
      } else {
        var node, parent_id, i;
        node = nodesCollection?.models[0], parent_id = node?.getParentId(args);
        for (i = 1; i < nodesCollection?.models?.length; i++) {
          node = nodesCollection.models[i];
          if (parent_id !== node.getParentId(args)) {
            return;
          }
        }
        return parent_id;
      }
    }
  };
});