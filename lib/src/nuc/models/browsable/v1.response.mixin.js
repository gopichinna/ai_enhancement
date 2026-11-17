/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/models/browsable/impl/pagination.util'], function (_, paginationUtil) {
  'use strict';

  var BrowsableV1ResponseMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeBrowsableV1Response: function (_options) {
          return this;
        },

        parseBrowsedState: function (response, _options) {
          paginationUtil.parsePaginationParameters(this, response);
        },

        parseBrowsedItems: function (response, _options) {
          return response.data;
        }
      });
    }
  };

  return BrowsableV1ResponseMixin;
});
