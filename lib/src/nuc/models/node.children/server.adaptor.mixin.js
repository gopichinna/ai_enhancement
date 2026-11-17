/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/utils/url',
  'nuc/models/browsable/v1.request.mixin',
  'nuc/models/browsable/v1.response.mixin'
], function (_, Url, BrowsableV1RequestMixin, BrowsableV1ResponseMixin) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      BrowsableV1ResponseMixin.mixin(prototype);
      BrowsableV1RequestMixin.mixin(prototype);

      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          this.makeBrowsableV1Request(options).makeBrowsableV1Response(options);
          return this;
        },

        url: function () {
          var includeActions = !!this.includeActions,
            query = Url.combineQueryString(
              {
                // Do not request the v1 actions, which are sent by default
                extra: includeActions,
                actions: includeActions
              },
              this.getBrowsableUrlQuery(),
              this.getExpandableResourcesUrlQuery(),
              this.getRequestedCommandsUrlQuery()
            );
          return Url.combine(this.node.urlBase(), query ? '/nodes?' + query : '/nodes');
        },

        // TODO: Remove this method and make the cache layer aware of node URLs.
        urlCacheBase: function () {
          return Url.combine(this.node.urlBase(), '/nodes?');
        },

        parse: function (response, options) {
          this.parseBrowsedState(response, options);
          this.columns && this.columns.resetColumns(response, this.options);
          return this.parseBrowsedItems(response, options);
        }
      });
    }
  };

  return ServerAdaptorMixin;
});
