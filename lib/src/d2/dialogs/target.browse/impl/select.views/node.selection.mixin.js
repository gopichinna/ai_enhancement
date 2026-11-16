/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/controls/table/cells/select/select.view" ], function(_, $, Backbone, SelectCellView) {
  "use strict";
  var MultiSelectCollection = Backbone.Collection.extend({
    modelId: function(attr) {
      return attr.id;
    }
  });
  return {
    initSelectionMixin: function(options, collection) {
      var allSelectedNodes = this.getCollectionWithSpecificModelId(collection);
      this.getAllSelectedNodes = function() {
        return allSelectedNodes;
      };
      this.getCollection = function() {
        return collection;
      };
      this.listenTo(allSelectedNodes, "remove", this.removeItemToAllSelectedItems).listenTo(allSelectedNodes, "add", this.addItemToAllSelectedItems).listenTo(allSelectedNodes, "reset", this.resetAllSelectedItems);
      this.listenTo(this.collection, "sync", this.resetAllSelectedItems);
    },
    getCollectionWithSpecificModelId: function(collection) {
      var allSelectedCollection = new MultiSelectCollection();
      if (collection && collection.modelId) {
        allSelectedCollection.modelId = collection.modelId;
      }
      return allSelectedCollection;
    },
    removeItemToAllSelectedItems: function(node) {
      var model = this.findNodeFromCollection(this.getCollection(), node);
      if (model) {
        model.set(SelectCellView.isSelectedModelAttributeName, false);
      } else {
        node.set(SelectCellView.isSelectedModelAttributeName, false);
      }
    },
    findNodeFromCollection: function(collection, node) {
      return collection.get(node) || collection.findWhere({
        id: node.get("id")
      });
    },
    addItemToAllSelectedItems: function(node) {
      var model = this.findNodeFromCollection(this.getCollection(), node);
      if (model) {
        model.set(SelectCellView.isSelectedModelAttributeName, true);
      } else {
        node.set(SelectCellView.isSelectedModelAttributeName, true);
      }
    },
    resetAllSelectedItems: function() {
      var allSelectedNodes = this.getAllSelectedNodes();
      this.getCollection().each(function(node) {
        var selectedNode = allSelectedNodes.get(node);
        node.set(SelectCellView.isSelectedModelAttributeName, selectedNode !== undefined);
      });
    },
    clearAllSelectedNodes: function() {
      var selectedNodes = this.getAllSelectedNodes();
      selectedNodes && selectedNodes.reset([]);
    },
    addNodesToSelection: function(nodes) {
      if (nodes) {
        var selectedNodes = this.getAllSelectedNodes();
        var selectedModels = selectedNodes.models;
        _.each(nodes, function(node) {
          if (!selectedNodes.get(node) && node.get("id") !== undefined) {
            selectedModels.push(node);
          }
        }, this);
        selectedNodes.reset(selectedModels);
      }
    },
    removeNodesFromSelection: function(nodes) {
      if (nodes) {
        var selectedNodes = this.getAllSelectedNodes();
        selectedNodes.remove(nodes, {
          silent: true
        });
        selectedNodes.reset(_.clone(selectedNodes.models));
      }
    }
  };
});