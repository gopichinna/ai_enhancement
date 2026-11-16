/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/utils/constants" ], function(_, $, constants) {
  "use strict";
  var FacetQueryMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeFacetQuery: function(options) {
          this.filterQueryParameterName = options.filterQueryParameterName;
          return this;
        },
        getFilterQuery: function(filters) {
          if (filters && filters.length) {
            return getFilterQuery(filters);
          } else {
            return {};
          }
        }
      });
    }
  };
  function getFilterQuery(filters) {
    return getFilterQueryValue(filters);
  }
  function getFilterQueryValue(filters) {
    var results = [];
    var map = {};
    var i, j, data;
    function getQuery(pid, query) {
      var obj = map[pid];
      query = query.concat(obj["query"]);
      return query;
    }
    function getExpression(name, value) {
      var expobj = {};
      expobj["expression-type"] = constants.SEARCH.FACET_PROPERTY;
      expobj["name"] = name;
      expobj["operator"] = constants.SEARCH.FACETOPERATOR_EQUAL;
      expobj["value"] = value;
      return expobj;
    }
    function makeExpressionSet(expArr, operator) {
      var exprobj = {};
      exprobj["expression-type"] = constants.SEARCH.FACET_EXPRESSIONSET;
      exprobj["operator"] = operator;
      exprobj["expressions"] = [];
      for (j in expArr) {
        if (Object.prototype.hasOwnProperty.call(expArr, j)) {
          exprobj["expressions"].push(expArr[j]);
        }
      }
      return exprobj;
    }
    function makeFinalExpression(exprsetArr) {
      var exprobj = {};
      exprobj["expression-set"] = {};
      exprobj["expression-set"].operator = constants.SEARCH.FACETOPERATOR_AND;
      exprobj["expression-set"].expressions = [];
      for (j in exprsetArr) {
        if (Object.prototype.hasOwnProperty.call(exprsetArr, j)) {
          exprobj["expression-set"].expressions.push(exprsetArr[j]);
        }
      }
      return exprobj;
    }
    function isLeafNode(data, id) {
      var children = data.filter(function(item) {
        return item["parentid"] === id;
      });
      return children.length === 0;
    }
    for (i in filters) {
      if (Object.prototype.hasOwnProperty.call(filters, i)) {
        var filter = filters[i];
        var filterResults = [];
        var dataArr = filter.values;
        for (j in dataArr) {
          if (Object.prototype.hasOwnProperty.call(dataArr, j)) {
            data = dataArr[j];
            data.query = [];
            data.query.push(getExpression(data["facetid"], data["facetvalue"]));
            map[data["id"]] = data;
          }
        }
        for (j in dataArr) {
          if (Object.prototype.hasOwnProperty.call(dataArr, j)) {
            data = dataArr[j];
            if (data["parentid"]) {
              data.query = getQuery(data["parentid"], data.query);
            }
            if (isLeafNode(dataArr, data.id)) {
              if (data.query.length > 1) {
                filterResults.push(makeExpressionSet(data.query, constants.SEARCH.FACETOPERATOR_AND));
              } else {
                filterResults.push(data.query[0]);
              }
            }
          }
        }
        filterResults = filterResults.length > 1 ? results.push(makeExpressionSet(filterResults, constants.SEARCH.FACETOPERATOR_OR)) : results.push(filterResults[0]);
      }
    }
    var finalResult = results.length > 1 ? makeFinalExpression(results) : makeFinalExpression(results);
    return finalResult;
  }
  return FacetQueryMixin;
});