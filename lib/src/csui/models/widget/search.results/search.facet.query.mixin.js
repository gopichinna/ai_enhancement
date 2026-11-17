/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery" ], function(_, $) {
  "use strict";
  var FacetQueryMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeFacetQuery: function(options) {
          return this;
        },
        getFilterParam: function(filters) {
          return getFilterParam(filters || this.filters, this.filterQueryParameterName);
        },
        getFilterQuery: function(filters) {
          return getFilterQuery(filters || this.filters, this.filterQueryParameterName);
        },
        getFilterQueryValue: function(filters) {
          return getFilterQueryValue(filters || this.filters);
        },
        getStateFilterQueryValue: function(filters) {
          return getStateFilterQueryValue(filters || this.filters);
        }
      });
    }
  };
  function getFilterParam(filters, parameterName) {
    var value = getFilterQueryValue(filters), parameters = {};
    if (value.length) {
      parameters[parameterName] = value;
    }
    return parameters;
  }
  function getFilterQuery(filters, parameterName) {
    var parameters = getFilterParam(filters, parameterName);
    return $.param(parameters, true);
  }
  function getFilterQueryValue(filters) {
    return filters && _.map(filters, getFilterValue) || [];
  }
  function getFilterValue(filter) {
    return filter.id + ":{" + _.reduce(filter.values, function(result, value) {
      if (result) {
        result += "|";
      }
      return result + value.id.toString();
    }, "") + "}";
  }
  function getStateFilterQueryValue(filters) {
    return filters && _.map(filters, getStateFilterValue) || [];
  }
  function getStateFilterValue(filter) {
    return filter.id + ":" + _.reduce(filter.values, function(result, value) {
      if (result) {
        result += "|";
      }
      return result + value.id.toString();
    }, "");
  }
  return FacetQueryMixin;
});