/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/models/browsable/impl/pagination.util'], function (_, paginationUtil) {
  'use strict';

  var BrowsableV2ResponseMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeBrowsableV2Response: function (options) {
          this.orderBy = options.orderBy;
          return this;
        },

        parseBrowsedState: function (response, _options) {
          var collection = response.collection || response,
            paging = collection.paging,
            sorting = collection.sorting,
            searching = collection.searching;

          if (paging) {
            paginationUtil.parsePaginationParameters(this, paging);
          } else {
            // Support limited v2 collections like favorites
            this.actualSkipCount = 0;
            this.filteredCount = this.totalCount = response.results.length;
          }

          // Need to initialize/reset 'sortingColumnKey' because the Collection is reused for some browsing scenarios
          // that may not have the paging.columns data with the app/container call, not same as app/container/page.
          // In such cases (e.g. go to page2 and then browse to a different folder), the collection.sortingColumnKey
          // still has the previous value.
          this.sortingColumnKey = undefined;
          if (sorting) {
            this.sorting = sorting;

            // The value in the 'sorting' object can either be the column key or the sort key, depending on the type of
            // column.  Search the array of columns for a column with a matching sort key.  We want to save the column
            // key for this column for later use (see _handleResponseSortBy() in table.view.js).
            if (paging.columns) {
              var sortValue = sorting.sort[0].value,
                markerIndex = sortValue.indexOf('_'),
                sortKey = sortValue.substring(markerIndex + 1);

              var foundColumn;
              _.each(paging.columns, function (column) {
                if (column.sort_key === sortKey) {
                  foundColumn = column;
                }
              });

              if (foundColumn) {
                this.sortingColumnKey = foundColumn.key;
              }
            }
          }

          if (searching) {
            this.searching = searching;
          }
        },

        parseBrowsedItems: function (response, _options) {
          return response.results;
        }
      });
    }
  };

  return BrowsableV2ResponseMixin;
});
