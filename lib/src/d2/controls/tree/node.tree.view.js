/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/models/node/node.model", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/utils/contexts/factories/next.node", "csui/utils/contexts/factories/ancestors", "d2/utils/contexts/factories/node.navigation", "nuc/utils/url", "nuc/utils/log", "dctmw/controls/tree/tree.view", "dctmw/server.adaptors/converters/node", "d2/utils/server.query.utils", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/node.utils", "d2/utils/constants", "hbs!d2/controls/tree/impl/node.tree", "i18n!d2/controls/tree/impl/nls/lang", "css!d2/controls/tree/impl/node.tree" ], function(module, $, _, Backbone, Marionette, NodeModel, PerfectScrollingBehavior, NextNodeModelFactory, AncestorCollectionFactory, NodeNavigationCollectionFactory, Url, log, TreeView, nodeConverter, serverQueryUtils, RestLinkrels, RestResources, nodeUtils, constants, template, lang) {
  "use strict";
  log = log(module.id);
  var DEFAULT_INIT_NODE_LIMIT = 5, DEFAULT_INIT_ROOT_LIMIT = 25, DEFAULT_SHOW_MORE_BLOCK_SIZE = 25;
  return Marionette.LayoutView.extend({
    className: "d2-tree-panel",
    template: template,
    regions: {
      treeRegion: ".d2-tree-container"
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true
      }
    },
    constructor: function NodeTreeView(options) {
      if (!options || !options.originatingView) {
        throw new Error("originatingView option is mandatory");
      }
      this.context = options.originatingView.context;
      this.connector = options.originatingView.connector;
      this.originatingView = options.originatingView;
      this.initRootLimit = options.initRootLimit || DEFAULT_INIT_ROOT_LIMIT;
      this.initNodeLimit = options.initNodeLimit || DEFAULT_INIT_NODE_LIMIT;
      this.showMoreBlockSize = options.showMoreBlockSize || DEFAULT_SHOW_MORE_BLOCK_SIZE;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.listenTo(this.originatingView.collection, "add", this._modelAdded, this);
      this.listenTo(this.context, "d2:objects:deleted", this._modelRemoved, this);
      this.listenTo(this.originatingView.collection, "remove", this._modelRemoved, this);
      this.listenTo(this.originatingView.collection, "change:name", this._modelRenamed, this);
      if (options.fixedRootNodeId) {
        this.rootNodeId = options.fixedRootNodeId;
      } else {
        this.rootNodeId = constants.NodeId.REPOSITORY;
        var wType = this.originatingView.collection.widgetType, wName = this.originatingView.collection.options && this.originatingView.collection.options.widgetName;
        if (wType && wName) {
          var widgetConfig = serverQueryUtils.getWidgetConfig(wType, wName);
          if (widgetConfig) {
            var startingPath = widgetConfig.getParam("start_path_smartview");
            this.rootNodeId = startingPath || constants.NodeId.REPOSITORY;
            if (widgetConfig.getParam("is_show_home_cabinet") === "true") {
              this.homeCabinetEnabled = true;
            }
            this.showFavoriteFolders = widgetConfig.getParam("is_show_favorites_folders") === "true";
            if (this.showFavoriteFolders || widgetConfig.getParam("is_show_favorites_documents") === "true") {
              this.favoritesNodeEnabled = true;
            }
            if (this.showFavoriteFolders) {
              this.originatingView.$el.on("favorite:change", this._modelFavoriteChanged.bind(this));
            }
          }
        }
      }
    },
    onRender: function() {
      this.treeView = new TreeView(this._buildTreeOptions());
      this.treeRegion.show(this.treeView);
    },
    _buildTreeOptions: function() {
      var me = this, nextNode = me.context.getModel(NextNodeModelFactory), ancestors = me.context.getCollection(AncestorCollectionFactory);
      return {
        levelIndentOnErrorNode: false,
        strings: {
          loadError: lang.loadError
        },
        source: function() {
          var deferred = $.Deferred(), nodes = [], promises = [], addNode = function(nodeId, isHomeCabinet) {
            var node = new NodeModel({
              id: nodeId,
              _is_home_cabinet: isHomeCabinet
            }, {
              connector: me.connector
            });
            nodes.push(node);
            promises.push(node.fetch());
          };
          if (me.favoritesNodeEnabled) {
            addNode(constants.NodeId.FAVORITES);
          }
          if (me.homeCabinetEnabled) {
            addNode(nodeUtils.getHomeCabinetId(), true);
          }
          addNode(me.rootNodeId);
          $.whenAll.apply($, promises).done(function() {
            deferred.resolve(_.map(nodes, me._createTreeNode));
          }).fail(function() {
            deferred.reject("");
          });
          return deferred.promise();
        },
        init: function(event, data) {
          function syncTree(firstLoad) {
            var ancestorList = ancestors.map(function(ancestor) {
              return {
                id: ancestor.get("id"),
                _is_home_cabinet: ancestor.get("_is_home_cabinet")
              };
            });
            if (me.options.fixedRootNodeId) {
              var fixedAncestor = _.findWhere(ancestorList, {
                id: me.options.fixedRootNodeId
              });
              if (fixedAncestor) {
                var fixedAncestorPosition = _.indexOf(ancestorList, fixedAncestor);
                if (fixedAncestorPosition > 0) {
                  ancestorList.splice(0, fixedAncestorPosition);
                }
              }
            }
            me._activateNode(data.tree, ancestorList, undefined, firstLoad);
          }
          me.listenTo(ancestors, "update reset", function() {
            syncTree(false);
          });
          syncTree(true);
        },
        lazyLoad: function(event, data) {
          var deferred = $.Deferred();
          me._fetchNodeChildren(data.node.data.origNode).done(function(result) {
            var limit = me._getInitialLimit(data.node);
            if (result.length > limit) {
              var allChildren = _.clone(result);
              result.splice(limit);
              me._addPagingNode(result, allChildren, true, limit);
            }
            deferred.resolve(result);
          }).fail(deferred.reject);
          data.result = deferred.promise();
        },
        focus: function(event, data) {
          data.node.scrollIntoView(true);
        },
        expand: function() {
          me.trigger("update:scrollbar");
        },
        collapse: function(event, data) {
          me.trigger("update:scrollbar");
          data.node.resetLazy();
        },
        click: function(event, data) {
          data.tree.activateKey(false, {
            noEvents: true
          });
        },
        dblclick: function() {
          return false;
        },
        keydown: function(event, data) {
          if (event.which === 13 || event.which === 32) {
            data.tree.activateKey(false, {
              noEvents: true
            });
          }
        },
        clickPaging: function(event, data) {
          me._clickPagingNode(data.node);
        },
        beforeActivate: function(event, data) {
          if (data.node.isPagingNode()) {
            data.tree.options.clickPaging.apply(this, arguments);
            return false;
          }
          return true;
        },
        activate: function(event, data) {
          var nodeNavigationCollection = me.context.getCollection(NodeNavigationCollectionFactory);
          var pathIds = _.compact(data.node.getKeyPath().split(data.tree.options.keyPathSeparator));
          if (pathIds[0] === constants.HiddenItems.ID) {
            ancestors.root = {};
            delete ancestors.rootSubId;
          } else {
            if (!ancestors.root || ancestors.root.id !== pathIds[0]) {
              if (nodeConverter.isNonDCTMNode(pathIds[0])) {
                ancestors.root = {
                  id: pathIds[0],
                  name: data.tree.getNodeByKey(pathIds[0]).title
                };
              } else if (me.homeCabinetEnabled && pathIds[0] === nodeUtils.getHomeCabinetId()) {
                ancestors.root = ancestors.getHomeCabineNode();
              } else {
                ancestors.root = {};
              }
            }
            if (pathIds.length > 1 && (pathIds[0] === constants.NodeId.FAVORITES || pathIds[0] === constants.NodeId.DQL)) {
              ancestors.rootSubId = pathIds[1];
            } else {
              delete ancestors.rootSubId;
            }
          }
          var navigationArray = [], leafNode = data.node;
          while (leafNode) {
            navigationArray.push({
              id: leafNode.key,
              name: leafNode.title
            });
            leafNode = leafNode.parent;
          }
          navigationArray.reverse().shift();
          nodeNavigationCollection.reset(navigationArray);
          data.tree._currActiveNodeKey = data.node.key;
          if (event.originalEvent instanceof $.Event) {
            var origId = nextNode.get("id");
            nextNode.trigger("before:change:id", data.node.data.origNode, this);
            nextNode.set({
              id: data.node.key
            });
            nextNode.set({
              _is_home_cabinet: data.node.data._is_home_cabinet
            });
            if (origId === data.node.key) {
              me.originatingView.collection.fetch({
                reload: true,
                error: function() {
                  $(data.node.span).find(".fancytree-title").addClass("perspective-load-error");
                }
              }).done(function() {
                me.originatingView.getAllSelectedNodes().reset([], {
                  silent: true
                });
                me.originatingView._restoreSelectedNodesFromSessionViewSate();
                $(data.node.span).find(".fancytree-title").removeClass("perspective-load-error");
              });
            } else {
              var onPerspectiveError = function() {
                $(data.node.span).find(".fancytree-title").addClass("perspective-load-error");
                me.context.off("sync:perspective", onPerspectiveSync, me);
                me.context.off("sync", onPerspectiveSync, me);
              }, onPerspectiveSync = function() {
                $(data.node.span).find(".fancytree-title").removeClass("perspective-load-error");
                me.context.off("error:perspective", onPerspectiveError, me);
                me.context.off("error", onPerspectiveError, me);
              };
              if (nodeConverter.isNonDCTMNode(data.node.data.origNode)) {
                me.listenToOnce(me.context, "error", onPerspectiveError);
                me.listenToOnce(me.context, "sync", onPerspectiveSync);
              } else {
                me.listenToOnce(me.context, "error:perspective", onPerspectiveError);
                me.listenToOnce(me.context, "sync:perspective", onPerspectiveSync);
              }
            }
          }
        }
      };
    },
    _getInitialLimit: function(node) {
      return node.parent == null || node.parent.parent == null ? this.initRootLimit : this.initNodeLimit;
    },
    _createTreeNode: function(node) {
      var isContainer = !!node.get("container");
      return {
        key: node.get("id"),
        origNode: node,
        title: node.get("name"),
        tooltip: node.get("name"),
        _is_home_cabinet: node.get("_is_home_cabinet"),
        folder: isContainer,
        lazy: isContainer
      };
    },
    _fetchNodeChildren: function(parentNode) {
      var me = this, deferred = $.Deferred(), repoLinks = RestResources.getCurrentRepository().get("links"), parentId = parentNode.get("id"), isFavNode = parentId === constants.NodeId.FAVORITES, url, method = "GET", parseResponseOptions = {}, filterQParam = "a_is_hidden=false";
      if (isFavNode) {
        if (!me.showFavoriteFolders) {
          return deferred.resolve([]).promise();
        }
        url = RestLinkrels.getLink(repoLinks, RestLinkrels.D2_FAVORITES);
      } else if (parentId === constants.NodeId.REPOSITORY) {
        url = RestLinkrels.getLink(repoLinks, RestLinkrels.D2_CABINETS);
      } else {
        url = RestLinkrels.getLink(parentNode.get("links"), RestLinkrels.OBJECTS);
        url = Url.appendQuery(url, Url.combineQueryString({
          widgetName: this?.originatingView?.container?.widgetName,
          widgetType: this?.originatingView?.container?.widgetType
        }));
        filterQParam = "substr(r_object_id, 1, 2) in ('0b') AND " + filterQParam;
        parseResponseOptions.propertiesFn = function(entry) {
          entry.content.properties = {};
          _.each(entry.content?.attributes, function(attribute) {
            entry.content.properties[attribute.name] = attribute.value;
          });
          return nodeConverter.convertNode(entry.content);
        };
      }
      url = Url.appendQuery(url, Url.combineQueryString({
        inline: true,
        filter: filterQParam
      }));
      $.ajax(parentNode.connector.extendAjaxOptions({
        url: url,
        method: method,
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        success: function(response) {
          var nodes = _.map(serverQueryUtils.parseResponse(response, parseResponseOptions), function(node) {
            return me._createTreeNode(new NodeModel(node, {
              connector: parentNode.connector
            }));
          });
          if (isFavNode) {
            nodes = _.reject(nodes, function(node) {
              return !node.folder;
            });
          }
          nodes = _.sortBy(nodes, function(node) {
            return node.title.toLowerCase();
          });
          deferred.resolve(nodes);
        },
        error: function(request) {
          deferred.reject(request);
        }
      }));
      return deferred.promise();
    },
    _activateNode: function(tree, ancestors, lastNode, firstLoad) {
      var me = this, key, treeNode;
      if (ancestors.length > 0) {
        key = ancestors[0].id;
        if (!lastNode) {
          var rootNodes = tree.rootNode.getChildren(), hiddenNode = _.find(rootNodes, {
            key: constants.HiddenItems.ID
          });
          if (key !== constants.HiddenItems.ID && key !== constants.NodeId.FAVORITES && !ancestors[0]._is_home_cabinet && hiddenNode) {
            var origRootNode = new NodeModel({
              id: me.rootNodeId
            }, {
              connector: me.connector
            });
            origRootNode.fetch().done(function() {
              hiddenNode.remove();
              tree.rootNode.addNode(me._createTreeNode(origRootNode));
              me._activateNode(tree, ancestors, lastNode, firstLoad);
            });
            return;
          }
          treeNode = _.find(rootNodes, {
            key: key
          });
        }
        if (!treeNode) {
          var lastActedNode = lastNode || tree.activeNode;
          treeNode = lastActedNode && _.find(lastActedNode.getChildren(), function(n) {
            return n.key === key;
          });
        }
        if (!treeNode) {
          treeNode = tree.getNodeByKey(key);
        }
        if (treeNode) {
          if (ancestors.length === 1) {
            treeNode.setActive(true);
            if (firstLoad === true) {
              treeNode.setExpanded(true);
            }
          } else {
            treeNode.setExpanded(true).done(function() {
              ancestors.splice(0, 1);
              me._activateNode(tree, ancestors, treeNode, firstLoad);
            });
          }
        } else {
          if (key === constants.HiddenItems.ID) {
            ancestors.splice(0, 1);
            var node = new NodeModel({
              id: ancestors[0].id
            }, {
              connector: me.connector
            });
            node.fetch().done(function() {
              _.find(tree.rootNode.getChildren(), function(child) {
                if (!child.data._is_home_cabinet && child.key !== constants.NodeId.FAVORITES) {
                  child.remove();
                  return true;
                }
              });
              treeNode = tree.rootNode.addNode({
                key: constants.HiddenItems.ID,
                title: constants.HiddenItems.NAME,
                folder: true,
                lazy: false,
                disabled: true,
                unselectable: true,
                children: [ me._createTreeNode(node) ]
              });
              me._activateNode(tree, ancestors, treeNode, firstLoad);
            }).fail(function() {
              throw "Failed fetching node data for id: " + ancestors[0].id;
            });
            return;
          } else if (lastNode) {
            var lastChild = lastNode.getLastChild();
            if (lastChild && lastChild.statusNodeType === "paging" && lastChild.data.showMore) {
              me._clickPagingNode(lastChild).done(function() {
                me._activateNode(tree, ancestors, lastNode, firstLoad);
              });
              return;
            }
          }
          log.error("Ancestor " + key + " not found in the tree, while trying to activate the node") && console.error(log.last);
        }
      }
    },
    _addPagingNode: function(output, allChildren, showMore, currPageListSize) {
      output.push({
        statusNodeType: "paging",
        title: showMore ? lang.ShowMore : lang.ShowLess,
        data: {
          allChildren: allChildren,
          currPageListSize: currPageListSize,
          showMore: showMore
        }
      });
    },
    _clickPagingNode: function(node, collapse) {
      var me = this, deferred = $.Deferred(), allChildren = node.data.allChildren, currPageListSize = node.data.currPageListSize, showMore = node.data.showMore && collapse !== true, newResult, newPageListSize;
      if (showMore) {
        newResult = _.clone(allChildren);
        newPageListSize = currPageListSize + me.showMoreBlockSize;
        newResult.splice(newPageListSize);
        newResult.splice(0, currPageListSize);
      } else {
        newResult = [];
        newPageListSize = me._getInitialLimit(node.parent);
      }
      if (newPageListSize >= allChildren.length) {
        newPageListSize = allChildren.length;
        me._addPagingNode(newResult, allChildren, false, newPageListSize);
      } else {
        me._addPagingNode(newResult, allChildren, true, newPageListSize);
      }
      var parentNode = node.getParent();
      if (!showMore) {
        for (var i = parentNode.children.length - 2; i >= newPageListSize; i--) {
          parentNode.removeChild(parentNode.children[i]);
        }
      }
      node.replaceWith(newResult).done(function() {
        me.trigger("update:scrollbar");
        if (showMore && node.tree._currActiveNodeKey && _.any(newResult, {
          key: node.tree._currActiveNodeKey
        })) {
          me._getActiveNode().setActive(true, {
            noFocus: true,
            noEvents: true
          });
        }
        if (collapse !== true) {
          parentNode.children[parentNode.children.length - 1].setFocus(true);
        }
        deferred.resolve();
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _getActiveNode: function() {
      var tree = this.treeView.tree;
      return tree.getNodeByKey(tree._currActiveNodeKey);
    },
    _addNewNode: function(parentNode, newNode) {
      var lastChild = parentNode.getLastChild(), pos, addedInMainList, hasPagingNode = lastChild && lastChild.statusNodeType === "paging", children = hasPagingNode ? lastChild.data.allChildren : parentNode.getChildren(), childIdNames = _.map(children, function(item) {
        return {
          key: item.key,
          title: item.title
        };
      });
      childIdNames.push(newNode);
      childIdNames = _.sortBy(childIdNames, function(item) {
        return item.title.toLowerCase();
      });
      _.find(childIdNames, function(item, index) {
        if (item.key === newNode.key) {
          pos = index;
          return true;
        }
      });
      if (pos < parentNode.getChildren().length) {
        parentNode.addChildren([ newNode ], pos === -1 ? null : pos);
        addedInMainList = true;
      } else if (pos === parentNode.getChildren().length && !hasPagingNode) {
        parentNode.addChildren([ newNode ]);
        addedInMainList = true;
      }
      if (hasPagingNode) {
        lastChild.data.allChildren.splice(pos, 0, newNode);
        if (addedInMainList) {
          lastChild.data.currPageListSize = lastChild.data.currPageListSize + 1;
        }
      }
    },
    _removeNode: function(parentNode, modelId) {
      var nodeToBeRemoved = _.find(parentNode.getChildren(), {
        key: modelId
      });
      if (nodeToBeRemoved) {
        nodeToBeRemoved.remove();
      }
      var lastChild = parentNode.getLastChild();
      if (lastChild && lastChild.statusNodeType === "paging") {
        lastChild.data.allChildren = _.reject(lastChild.data.allChildren, {
          key: modelId
        });
        if (nodeToBeRemoved) {
          lastChild.data.currPageListSize = lastChild.data.currPageListSize - 1;
        }
        if (lastChild.data.allChildren.length === lastChild.data.currPageListSize) {
          parentNode.removeChild(lastChild);
        }
      }
    },
    _modelAdded: function(model) {
      var me = this, addModelToTree = function(model) {
        var activeNode = me._getActiveNode(), activeNodeKey = activeNode.key, treeParentNodes = me.treeView.tree.findAll(function(node) {
          return node.isLoaded() && activeNodeKey === node.key;
        });
        _.each(treeParentNodes, function(parentNode) {
          me._addNewNode(parentNode, me._createTreeNode(model));
        });
      };
      if (model.get("container")) {
        if (!model.get("id")) {
          me.listenToOnce(model, "sync", function() {
            addModelToTree(model);
          });
        } else {
          addModelToTree(model);
        }
      }
    },
    _modelRemoved: function(model) {
      var me = this;
      var modelId = model instanceof Backbone.Model ? model.get("id") : model[0];
      var parentNodes = me.treeView.tree.findAll(function(node) {
        if (node.isLoaded() && node.hasChildren()) {
          if (_.any(node.getChildren(), {
            key: modelId
          })) {
            return true;
          }
          var lastChild = node.getLastChild();
          if (lastChild.statusNodeType === "paging") {
            return _.any(lastChild.data.allChildren, {
              key: modelId
            });
          }
        }
        return false;
      });
      _.each(parentNodes, function(parentNode) {
        me._removeNode(parentNode, modelId);
      });
    },
    _modelRenamed: function(model) {
      var me = this;
      if (model.get("container")) {
        var modelId = model.get("id"), treeNodes = me.treeView.tree.findAll(function(node) {
          return modelId === node.key;
        });
        _.each(treeNodes, function(treeNode) {
          treeNode.setTitle(model.get("name"));
        });
      }
    },
    _modelFavoriteChanged: function(event, model) {
      var favNode = _.find(this.treeView.tree.rootNode.getChildren(), function(n) {
        return n.key === constants.NodeId.FAVORITES;
      });
      if (model.get("container") && favNode.isLoaded()) {
        if (model.get("favorite") === true) {
          var newNode = this._createTreeNode(model), origProps = model.get("_orig_properties");
          if (newNode.key === nodeUtils.getHomeCabinetId()) {
            delete newNode._is_home_cabinet;
            newNode.title = origProps && origProps.object_name || newNode.title;
          }
          this._addNewNode(favNode, newNode);
        } else {
          this._removeNode(favNode, model.get("id"));
        }
      }
    }
  });
});