/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "dctmw/server.adaptors/converters/node", "d2/utils/server.query.utils", "d2/utils/constants", "dctmw/utils/utils" ], function($, _, RestResources, RestLinkrels, NodeConverter, serverQueryUtils, constants, utils) {
  "use strict";
  function isMultiSelect(type) {
    var multiSelectables = [ constants.SEARCH.FACETTYPE_STRING, constants.SEARCH.FACETTYPE_DOUBLE, constants.SEARCH.FACETTYPE_INTEGER ];
    if (_.contains(multiSelectables, type)) {
      return true;
    } else {
      return false;
    }
  }
  function makeTopics(topics, topic, level, pid, multiselect) {
    var topicid = pid ? pid + constants.SEARCH.TOPIC_SEPARATOR + topic["facet-value-id"] : topic["facet-value-id"];
    var newtopic = {
      id: topicid,
      multiselect: multiselect,
      label: topic["facet-label"],
      name: topic["facet-value-label"],
      total: topic["facet-value-count"],
      value: topicid,
      "facet-value": _.isUndefined(topic["facet-value"]) ? topic["facet-value-id"] : topic["facet-value"],
      checked: false,
      level: level,
      "facet-id": topic["facet-id"],
      "parent-id": pid,
      "facet-item-view": topic["facet-item-view"],
      validator: topic["validator"],
      type: "facet",
      children: []
    };
    topics.push(newtopic);
    var children = topic["facets"];
    var nlevel = ++level;
    for (var key in children) {
      if (Object.prototype.hasOwnProperty.call(children, key)) {
        newtopic.children.push(makeTopics(topics, children[key], nlevel, topicid, isMultiSelect(children[key]["facet-type"])));
      }
    }
    return newtopic;
  }
  return {
    parseFacets: function(facetArr) {
      var results = [];
      for (var key in facetArr) {
        if (Object.prototype.hasOwnProperty.call(facetArr, key)) {
          var topicsArr = [];
          var facet = facetArr[key];
          var newfacet = {
            id: "",
            name: facet["facet-label"],
            type: facet["facet-type"],
            "facet-bar-item-view": facet["facet-bar-item-view"],
            "show-search": facet["show-search"],
            "items-to-show": facet["items-to-show"],
            "fixed-position": facet["fixed-position"],
            topics: topicsArr,
            children: []
          };
          const topics = facet["facet-value"];
          topics.forEach(topic => {
            newfacet.id = topic["facet-id"] || facet["facet-id"];
            topic["facet-id"] = newfacet.id;
            newfacet.children.push(makeTopics(topicsArr, topic, 0, "", isMultiSelect(topic["facet-type"])));
          });
          results.push(newfacet);
        }
      }
      return results;
    },
    parseNewFacets: function(facetArr) {
      return this.parseFacets(facetArr);
    },
    processChildFacets: function(baseNodes, resultNodes, selectionIds, hideFacetCount, showAllTopics, isFixedOrder, selectedFacets) {
      if (!baseNodes) {
        let results = resultNodes?.filter(node => {
          const hasParent = !_.isEmpty(node["parent-id"]);
          node.showTotal = !(hideFacetCount || node.type === "filter");
          if (showAllTopics) {
            node.hideTopic = hasParent;
            node.children = this.processChildFacets(null, node.children, selectionIds, hideFacetCount, showAllTopics, isFixedOrder, selectedFacets);
            return true;
          } else {
            node.children = [];
            return !hasParent;
          }
        });
        return results;
      } else {
        const resultIdToNode = {};
        let orderedList = [], resultSelected = [], baseSelected = [], resultArr = [], baseArr = [];
        resultNodes?.forEach(node => {
          resultIdToNode[node.id] = node;
        });
        baseNodes.forEach(node => {
          let resultNode = resultIdToNode[node.id], isSelected = selectionIds.has(node.id), isParentSelected = selectionIds.has(node["parent-id"]), canInclude = !node["parent-id"] || isParentSelected;
          let itemToPush = null, arrToPush = null;
          if (resultNode) {
            resultNode.checked = isSelected;
            resultNode.showTotal = !(hideFacetCount || node.type === "filter");
          } else {
            node.checked = isSelected;
            node.showTotal = false;
          }
          itemToPush = resultNode || node;
          if (!canInclude && showAllTopics) {
            itemToPush.hideTopic = true;
            canInclude = true;
          }
          if (node.level === 0 && !resultNode && selectionIds.size === 0) {
            node.showTotal = false;
            node.children = [];
            if (isFixedOrder) {
              orderedList.push(node);
            } else if (_.contains(selectedFacets, node["facet-id"]) || selectedFacets.length === 0) {
              baseArr.push(node);
            }
          } else if (canInclude) {
            if (isFixedOrder) {
              arrToPush = orderedList;
            } else if (resultNode) {
              arrToPush = isSelected ? resultSelected : resultArr;
            } else {
              arrToPush = isSelected ? baseSelected : baseArr;
            }
            arrToPush.push(itemToPush);
            const nodes = this.processChildFacets(node.children, resultNode?.children, selectionIds, hideFacetCount, showAllTopics, isFixedOrder, selectedFacets);
            itemToPush.children = nodes;
          }
        });
        return isFixedOrder ? orderedList : [ ...resultSelected, ...baseSelected, ...resultArr, ...baseArr ];
      }
    },
    _generateFlatList: function(nodes) {
      let res = [];
      nodes?.forEach(node => {
        res.push(node);
        res.push(...this._generateFlatList(node.children));
        delete node.children;
      });
      return res;
    },
    constructFlatList: function(facetCategory) {
      facetCategory.forEach(cat => {
        if (cat.id !== "filter") {
          cat.topics = this._generateFlatList(cat.children);
        }
      });
      return facetCategory;
    },
    computeFacets: function(results, baseFacets, filterArr, hideFacetCount, showAllTopics) {
      showAllTopics = showAllTopics || utils.isMobile();
      let computedFacets = null;
      const selectedFacets = [], cat2SelectionIdsMap = {};
      if (filterArr) {
        _.each(filterArr, function(filter) {
          let selectionItems = new Set(), id = filter.id;
          _.each(filter.values, value => selectionItems.add(value.id));
          selectedFacets.push(id);
          cat2SelectionIdsMap[id] = selectionItems;
        });
      }
      if (!baseFacets) {
        results.forEach(cat => {
          const selectionIdSet = cat2SelectionIdsMap[cat.id] || new Set(), nodes = this.processChildFacets(null, cat.children, selectionIdSet, hideFacetCount, showAllTopics, false, selectedFacets);
          cat.children = nodes;
        });
        computedFacets = results;
      } else {
        const clone = _.deepClone(baseFacets), resultId2CategoryMap = {};
        results.forEach(cat => {
          resultId2CategoryMap[cat.id] = cat;
        });
        clone.forEach(facet => {
          const resultCategory = resultId2CategoryMap[facet.id], selectionIdSet = cat2SelectionIdsMap[facet.id] || new Set(), nodes = this.processChildFacets(facet.children, resultCategory?.children, selectionIdSet, hideFacetCount, showAllTopics, facet["fixed-position"], selectedFacets);
          facet.children = nodes;
        });
        computedFacets = clone;
      }
      return this.constructFlatList(computedFacets);
    },
    fcssescape: function(ch, asCodePoint) {
      if (asCodePoint) {
        if (ch === "\0") {
          return "";
        }
        return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
      }
      return "\\" + ch;
    },
    escape: function(sel) {
      var rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g;
      return (sel + "").replace(rcssescape, this.fcssescape);
    },
    getExprPostBody: function(values) {
      var exprobj = {};
      exprobj["expression-set"] = {};
      exprobj["expression-set"].operator = constants.SEARCH.FACETOPERATOR_AND;
      exprobj["expression-set"].expressions = [];
      var expression = {};
      expression["expression-type"] = "property-list";
      expression["name"] = "r_object_id";
      expression["operator"] = constants.SEARCH.FACETOPERATOR_IN;
      expression["values"] = values;
      exprobj["expression-set"].expressions.push(expression);
      return exprobj;
    }
  };
});