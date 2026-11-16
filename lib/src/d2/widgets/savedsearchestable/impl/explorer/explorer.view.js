/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/log", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/progressblocker/blocker", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/controls/button.toolbar/button.toolbar.view", "dctmw/controls/tree/tree.view", "d2/server.adaptors/converters/savedsearch", "d2/utils/advanced.search.utils", "d2/utils/constants", "hbs!d2/controls/tree/impl/node.tree", "hbs!d2/widgets/savedsearchestable/impl/explorer/explorer", "i18n!d2/widgets/savedsearchestable/impl/nls/lang" ], function($, _, Backbone, Marionette, log, LayoutViewEventsPropagationMixin, BlockingView, PerfectScrollingBehavior, ButtonToolbarView, TreeView, SavedSearchConvertor, AdvancedSearchUtils, constants, treeTemplate, template, lang) {
  "use strict";
  var SavedSearchTreeStructureView = Marionette.LayoutView.extend({
    className: "d2-tree-panel",
    template: treeTemplate,
    regions: {
      treeRegion: ".d2-tree-container"
    },
    behaviors: {
      PerfectScrolling: {
        contentParent: "> .d2-tree-container",
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true
      }
    },
    constructor: function SavedSearchTreeStructureView(options) {
      options || (options = {});
      this._ancestors = options.ancestors;
      Marionette.LayoutView.prototype.constructor.call(this, options);
    },
    onShow: function() {
      if (!this.treeView) {
        this.treeView = new TreeView(_.extend(this._buildTreeOptions(this.options)));
        this.treeRegion.show(this.treeView);
      }
    },
    updateTreeNode: function(node) {
      var label = node.get("label"), ftNode = this.treeView.tree.getNodeByKey(node.get("id"));
      if (ftNode) {
        ftNode.applyPatch({
          title: label,
          tooltip: label
        });
        ftNode.render(true);
      }
    },
    _getExpandedNodes: function() {
      return this.treeView.tree.findAll(function(ftNode) {
        return ftNode.isExpanded();
      });
    },
    refreshTreeStructure: function(source) {
      this.treeView.tree.reload(source);
    },
    _getTreeNode: function(key) {
      return this.treeView.tree.getNodeByKey(key);
    },
    _removeTreeNode: function(key) {
      var ftNode = this._getTreeNode(key);
      ftNode && ftNode.remove();
    },
    _buildTreeOptions: function(options) {
      var me = this;
      return {
        source: options.data,
        init: function(event, data) {
          _.each(data.tree.getRootNode().getChildren(), function(node) {
            if (node.getChildren() && node.getChildren().length < 8) {
              node.setExpanded(true);
            }
          });
          function syncTree(firstLoad) {
            me._activateNode(data.tree, me._ancestors.get("ancestors").slice(), null, firstLoad);
          }
          me.listenTo(me._ancestors, "change:ancestors", function() {
            syncTree(false);
          });
          syncTree(true);
        },
        activate: function(event, data) {
          if (event.originalEvent instanceof $.Event) {
            me.trigger("d2:item:selected", data.node);
          }
        },
        click: function(event, data) {
          data.tree.activateKey(false, {
            noEvents: true
          });
        }
      };
    },
    _activateNode: function(tree, ancestors, lastNode, firstLoad) {
      var me = this, key, treeNode;
      if (ancestors.length > 0) {
        key = ancestors[0];
        if (!lastNode) {
          treeNode = _.find(tree.rootNode.getChildren(), {
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
            firstLoad && treeNode.setExpanded(true);
          } else {
            treeNode.setExpanded(true).done(function() {
              ancestors.splice(0, 1);
              me._activateNode(tree, ancestors, treeNode, firstLoad);
            });
          }
        }
      }
    }
  });
  _.extend(SavedSearchTreeStructureView.prototype, LayoutViewEventsPropagationMixin);
  return Marionette.LayoutView.extend({
    className: "d2-savedsearch-explorer",
    template: template,
    regions: {
      toolbarViewRgn: ".toolbar",
      treeViewRgn: ".tree-view"
    },
    constructor: function SavedSearchTreeView(options) {
      options || (options = {});
      this.context = options.context;
      this.connector = options.connector || this.context && this.context.getObject("connector");
      this.savedSearchCollection = options.savedSearchCollection;
      this.containerNode = this.savedSearchCollection.node;
      if (options.blockingParentView) {
        BlockingView.delegate(this, options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      Marionette.LayoutView.prototype.constructor.call(this, options);
    },
    onRender: function() {
      this.showToolbarView();
      this.createSingleSelectTreeView();
    },
    showToolbarView: function() {
      var buttonsConfig = {
        right: [],
        left: [ {
          id: "navigateBack",
          className: "icon icon-searches-go-back",
          tooltip: this.options.tooltipBackButton && this.options.tooltipBackButton !== "back" ? this.options.tooltipBackButton : lang.defaultTooltipBackButton,
          iconName: "csui_action_back32",
          clickHandler: this._onClickGoBack.bind(this)
        }, {
          id: "listLabel",
          className: "d2-savedsearch-tree-header-label",
          label: lang.defaultLabelSearchesList,
          showLabel: true
        } ]
      };
      this.toolbarView = new ButtonToolbarView(buttonsConfig);
      this.toolbarViewRgn.show(this.toolbarView);
    },
    createSingleSelectTreeView: function() {
      this._fetchSavedSearchGroups().done(_.bind(this.showSingleSelectTreeView, this));
    },
    _fetchSavedSearchGroups: function() {
      var me = this, deferred = $.Deferred();
      this.blockActions();
      AdvancedSearchUtils.getSearchLocations({
        connector: this.options.connector,
        loadAllGroups: true
      }).done(function(linearSearchLocations) {
        me._searchLocationById = AdvancedSearchUtils.createSearchLocationsTreeStructure({
          linearSearchLocations: linearSearchLocations,
          loadAllGroups: true
        });
        deferred.resolve(me._searchLocationById);
      }).fail(function() {
        log.error("failed to fetch saved search groups data") && console.log(log.last);
        deferred.reject();
      }).always(_.bind(this.unblockActions, this));
      return deferred.promise();
    },
    showSingleSelectTreeView: function() {
      var id = this.getCurrentTreeNodeId(), path = this.getAncestorsPath(this._searchLocationById, id);
      this._ancestors = new Backbone.Model({
        ancestors: path
      });
      this.treeView = new SavedSearchTreeStructureView({
        data: this._searchLocationById[0].children,
        ancestors: this._ancestors
      });
      this.treeViewRgn.show(this.treeView);
      if (!this._isRootCategoryTreeNodeId(id)) {
        var currentNode = this._searchLocationById[id];
        currentNode && this.containerNode.set(this._getNodeData(currentNode));
      }
      this.listenTo(this.containerNode, "d2:savedsearch:rename", this.onSavedSearchCategoryRename).listenTo(this.containerNode, "change", this.refreshTreeState).listenTo(this.containerNode, "d2:node:removed", _.bind(this._removeTreeNode, this, true)).listenTo(this.savedSearchCollection, "d2:savedsearch:rename", this.onSavedSearchCategoryRename).listenTo(this.savedSearchCollection, "remove", this._onModelRemoved).listenTo(this.savedSearchCollection, "add", this._onModelAdded).listenTo(this.treeView, "d2:item:selected", this._onTreeItemSelection);
    },
    onSavedSearchCategoryRename: function(node) {
      var data = this._searchLocationById[node.get("id")], label = node.get("label");
      data.title = label;
      data.tooltip = label;
      this.treeView.updateTreeNode(node);
    },
    _onTreeItemSelection: function(ftNode) {
      if (this.getCurrentTreeNodeId() === ftNode.key) {
        this.trigger("refresh:collection");
      } else {
        this.containerNode.clear({
          silent: true
        });
        this.containerNode.set(this._getNodeData(ftNode));
      }
    },
    _createTreeNode: function(node) {
      return {
        key: node.get("id"),
        title: node.get("name"),
        tooltip: node.get("name"),
        parentId: node.get("parent_id"),
        category: node.get("search-category").toUpperCase(),
        icon: false
      };
    },
    _getNodeData: function(node) {
      var data = node.data || {}, key = node.key, isRootNode = this._isRootCategoryTreeNodeId(key), id = isRootNode ? "" : key, category = isRootNode ? key : node.category || data.category;
      var nodeData = {
        id: id,
        name: node.title,
        parent_id: node.parentId || data.parentId,
        "search-category": category,
        r_object_type: "d2c_query_category"
      };
      if (isRootNode) {
        nodeData.actions = [];
      }
      return nodeData;
    },
    _onModelAdded: function(model) {
      if (model.isCategoryNode()) {
        var ftNode;
        if (model.get("parent_id")) {
          ftNode = this.treeView._getTreeNode(model.get("parent_id"));
        } else {
          ftNode = this.treeView._getTreeNode(model.get("search-category").toUpperCase());
        }
        var ftChildren = ftNode.getChildren() || [], newNode = this._createTreeNode(model);
        var idx, childIdNames = _.map(ftChildren, function(item) {
          return {
            key: item.key,
            title: item.title
          };
        });
        childIdNames.push(newNode);
        childIdNames = _.sortBy(childIdNames, function(item) {
          return item.title.toLowerCase();
        });
        idx = _.findIndex(childIdNames, {
          key: newNode.key
        });
        if (idx < ftChildren.length) {
          ftNode.addChildren([ newNode ], idx === -1 ? null : idx);
        } else if (idx === ftChildren.length) {
          ftNode.addChildren([ newNode ]);
        }
        this._addModelToSource(newNode, ftNode.key);
      }
    },
    _onModelRemoved: function(model) {
      if (model.isCategoryNode()) {
        this._removeTreeNode(false, model.get("id"));
      }
    },
    _removeTreeNode: function(updateContainerInfo, id) {
      this.treeView._removeTreeNode(id);
      var node = this._searchLocationById[id];
      if (node) {
        this._removeNodeFromSource(node);
        var parentNode = this._searchLocationById[node.parentId] || this._searchLocationById[node.category], idx = parentNode.children.indexOf(node);
        if (idx !== -1) {
          parentNode.children.splice(idx, 1);
        }
        if (updateContainerInfo) {
          this.containerNode.set(this._getNodeData(parentNode));
        }
      }
    },
    _addModelToSource: function(node, parentId) {
      var sourceMap = this._searchLocationById;
      sourceMap[node.key] = node;
      sourceMap[parentId].children = sourceMap[parentId].children || [];
      sourceMap[parentId].children.push(node);
    },
    _removeNodeFromSource: function(node) {
      _.each(node.children, function(childNode) {
        childNode.children && this._removeNodeFromSource(childNode);
        delete this._searchLocationById[childNode.key];
      }, this);
    },
    refreshTreeState: function() {
      if (this._searchLocationById[this.getCurrentTreeNodeId()]) {
        this.refreshAncestorsPath();
      } else {
        this.refreshTreeData();
      }
    },
    refreshTreeData: function() {
      var me = this;
      this._fetchSavedSearchGroups().done(function() {
        var ftNodes = me.treeView._getExpandedNodes();
        _.each(ftNodes, function(ftNode) {
          var node = me._searchLocationById[ftNode.key];
          if (ftNode.isExpanded() && node) {
            node.expanded = true;
          }
        });
        me.refreshAncestorsPath();
        me.treeView.refreshTreeStructure(me._searchLocationById[0].children);
      });
    },
    refreshAncestorsPath: function() {
      this._ancestors.set("ancestors", this.getAncestorsPath(this._searchLocationById, this.getCurrentTreeNodeId()));
    },
    getCurrentTreeNodeId: function() {
      return this.containerNode.get("id") || this.containerNode.get("search-category");
    },
    getAncestorsPath: function(searchLocationsById, childId) {
      var path = [ childId ], parentNode = searchLocationsById[childId];
      if (parentNode) {
        var parentId = parentNode.parentId;
        while (parentId) {
          path.push(parentId);
          parentId = searchLocationsById[parentId].parentId;
        }
        var rootNode = searchLocationsById[path[path.length - 1]];
        if (rootNode && rootNode["category"] && rootNode["category"]) {
          path.push(rootNode["category"]);
        }
      }
      return path.reverse();
    },
    _isRootCategoryTreeNodeId: function(id) {
      return _.contains([ constants.AdvancedSearch.CATEGORY_PRIVATE, constants.AdvancedSearch.CATEGORY_PUBLIC ], id);
    },
    _onClickGoBack: function() {
      this.trigger("navigation:back");
    }
  });
});