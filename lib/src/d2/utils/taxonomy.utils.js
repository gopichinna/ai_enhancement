/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/mass.update.utils" ], function(_, MassUpdateUtils) {
  "use strict";
  return {
    getTaxonomySelection: function(taxoTree, control) {
      var level = this._findNodeTaxonomyLevel(taxoTree, control);
      var childDetails = this._getNodeDetails(taxoTree, control.taxonomyChildren);
      var leaflevel = taxoTree.total_levels - 1, selectedNodes = [], self = this;
      _.each(taxoTree.normalizedMap[leaflevel], function(node) {
        self._getParentDetails(taxoTree, node, childDetails, level, selectedNodes);
      });
      return this._formatComboOptions(selectedNodes);
    },
    getTaxonomyOptions: function(taxoTree, control) {
      var level = this._findNodeTaxonomyLevel(taxoTree, control);
      var parentDetails = this._getNodeDetails(taxoTree, control.taxonomyAncestors);
      if (control.backward && !control.forward || level === 0 || _.isEmpty(parentDetails)) {
        return this._formatComboOptions(taxoTree.normalizedMap[level]);
      } else {
        var resultNodes = [];
        this._getNodeOptions(taxoTree.taxnomy_nodes, parentDetails, level, resultNodes);
        return this._formatComboOptions(resultNodes);
      }
    },
    _getNodeOptions: function(nodeList, parentDetails, level, resultNodes) {
      var self = this;
      if (nodeList && nodeList.length > 0) {
        _.each(nodeList, function(node) {
          var currentLevel = node.level;
          if (currentLevel === level) {
            resultNodes.push(node);
          } else {
            if (parentDetails[currentLevel] === "" || parentDetails[currentLevel] === node.dictionary_value || parentDetails[currentLevel].toString() === node.dictionary_value) {
              self._getNodeOptions(node.taxnomy_nodes, parentDetails, level, resultNodes);
            }
          }
        });
      }
    },
    _findNodeTaxonomyLevel: function(taxoTree, control) {
      var level = -1;
      _.each(taxoTree["dictionary_levels"], function(nodesLevel) {
        if (nodesLevel["dictionary_name"] === control.options.ds.taxonomyLevel) {
          level = nodesLevel["level"];
        }
      });
      return level;
    },
    _formatComboOptions: function(nodes) {
      return _.map(nodes, function(node) {
        return {
          value: node.dictionary_value,
          text: node.dictionary_label,
          s: node.is_default
        };
      });
    },
    _getNodeDetails: function(taxoTree, controlList) {
      var self = this;
      return _.reduce(controlList, function(obj, parent) {
        var parentLevel = self._findNodeTaxonomyLevel(taxoTree, parent);
        var value = "";
        if (parent.data !== "") {
          if (MassUpdateUtils.fieldHasMultipleValues(parent.getValue())) {
            value = "";
          } else if (parent.data !== null) {
            value = parent.data;
          }
        }
        obj[parentLevel] = value;
        return obj;
      }, {});
    },
    _getParentDetails: function(taxoTree, node, childDetails, level, selectedNodes) {
      if (node.level === level) {
        var exists = _.filter(selectedNodes, function(selection) {
          return node.dictionary_value === selection.dictionary_value;
        });
        if (_.isEmpty(exists)) {
          selectedNodes.push(node);
        }
      } else {
        if (childDetails[node.level] === "" || childDetails[node.level] === node.dictionary_value) {
          this._getParentDetails(taxoTree, node.parent, childDetails, level, selectedNodes);
        }
      }
    }
  };
});