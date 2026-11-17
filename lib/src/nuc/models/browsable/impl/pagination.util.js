/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(function () {
  return {
    parsePaginationParameters: function (collection, paging) {
      // CS uses a combination of item- and page- based pagination.
      // Parameters `limit` and `total_count` resemble `top` and `count`
      // from OData, but `page` and `page_total` contain page index
      // and page count, unlike `skip` and `count` from OData.
      var page = paging.page;
      var limit = paging.limit;
      if (page != null) {
        collection.actualSkipCount = (page - 1) * (limit || 0);
      } else {
        collection.actualSkipCount = null;
      }

      var totalCount = paging.total_count;
      var pageTotal = paging.page_total;
      // Total count can be hidden by a "security" setting, not to reveal
      // how many items are in the container, because not all of them may
      // be visible. However, the total count is essential for the random
      // pagination. The simplest fix to keep the random pagination working
      // is to approximate the total count using the page count.
      // The `totalCountComputed` property can be used to detect
      // the approximation.
      if (totalCount == null && pageTotal != null && limit != null) {
        totalCount = pageTotal * limit;
        collection.totalCountComputed = true;
      } else {
        collection.totalCountComputed = false;
      }
      collection.totalCount = totalCount;

      var filteredCount = paging.filtered_count;
      collection.filteredCount = filteredCount != null ? filteredCount : totalCount;
    }
  };
});
