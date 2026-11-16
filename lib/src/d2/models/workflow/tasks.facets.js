/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/models/facets", "csui/models/node.facets/facet.query.mixin" ], function(_, FacetCollection, FacetQueryMixin) {
  "use strict";
  var TaskFacetCollection = FacetCollection.extend({
    constructor: function TaskFacetCollection() {
      FacetCollection.prototype.constructor.apply(this, arguments);
    },
    ensureFetched: function() {
      return true;
    },
    clone: function() {
      return new this.constructor(this.models, {
        node: this.node,
        filters: _.deepClone(this.filters)
      });
    },
    isFetchable: function() {
      return false;
    },
    addFilter: function(filters, fetch, options) {
      var existingFilters = this.filters, newFilters = [], modified;
      if (!Array.isArray(filters)) {
        filters = [ filters ];
      }
      filters.forEach(function(filter) {
        var existingFilter = _.findWhere(existingFilters, {
          id: filter.id
        });
        if (existingFilter) {
          var existingValues = existingFilter.values, newValues = filter.values.filter(function(value) {
            var existingValue = _.findWhere(existingValues, {
              id: value.id
            });
            if (existingValue && existingValue.facetvalue !== value.facetvalue) {
              existingValue.facetvalue = value.facetvalue;
              modified = true;
            }
            return !existingValue;
          });
          if (newValues.length) {
            existingValues.push.apply(existingValues, newValues);
            modified = true;
          }
        } else {
          if (filter.values.length) {
            newFilters.push(filter);
          }
        }
      });
      if (newFilters.length) {
        existingFilters.push.apply(existingFilters, newFilters);
        modified = true;
      }
      if (modified) {
        if (fetch !== false && this.isFetchable()) {
          this.fetch(options);
        }
        return true;
      }
    }
  });
  FacetQueryMixin.mixin(TaskFacetCollection.prototype);
  return TaskFacetCollection;
});