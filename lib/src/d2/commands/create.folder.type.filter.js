/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui-ext!d2/commands/create.folder.type.filter" ], function(_, extraFilters) {
  var filters = [];
  if (extraFilters) {
    filters = _.flatten(extraFilters, true);
  }
  function filter(types) {
    if (filters.length) {
      _.each(filters, function(filterFn) {
        types = _.filter(types, filterFn);
      });
    }
    return types;
  }
  function addFilters(newFilters) {
    _.each(newFilters, function(filter) {
      if (_.isFunction(filter)) {
        filters.push(filter);
      }
    });
  }
  return {
    filter: filter,
    addFilters: addFilters
  };
});