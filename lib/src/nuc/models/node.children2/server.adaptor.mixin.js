/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/utils/url',
  'nuc/models/browsable/v1.request.mixin',
  'nuc/models/browsable/v2.response.mixin',
  'nuc/models/mixins/appcontainer/appcontainer.mixin'
], function (_, Url, BrowsableV1RequestMixin, BrowsableV2ResponseMixin, AppContainerMixin) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      BrowsableV2ResponseMixin.mixin(prototype);
      BrowsableV1RequestMixin.mixin(prototype);
      AppContainerMixin.mixin(prototype);

      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          this.useSpecialPaging = options.useSpecialPaging;
          this.makeBrowsableV1Request(options).makeBrowsableV2Response(options).makeAppContainer(options);
          return this;
        },

        url: function () {
          var url;
          var apiUrl = new Url(this.node.connector.connection.url).getApiBase(2);

          var query;
          if (this.useSpecialPaging) {
            // special fast browse paging
            url = Url.combine(apiUrl, 'app/container', this.node.get('id'), 'page');
            // needs less parameters
            var resourceFieldsQuery = {
              fields: _.without(this.getResourceFieldsUrlQuery().fields, 'properties')
            };
            query = Url.combineQueryString(this.getBrowsableUrlQuery(), resourceFieldsQuery);
          } else {
            // nodes-based paging
            url = Url.combine(apiUrl, 'nodes', this.node.get('id'), 'nodes');
            query = Url.combineQueryString(
              this.getBrowsableUrlQuery(),
              this.getResourceFieldsUrlQuery(),
              this.getExpandableResourcesUrlQuery(),
              this.getStateEnablingUrlQuery(),
              this.getAdditionalResourcesUrlQuery(),
              this.getRequestedCommandsUrlQuery()
            );
          }

          return Url.appendQuery(url, query);
        },

        parse: function (response, options) {
          if (this.useSpecialPaging) {
            var self = this;
            response.results = response.results.map(function (props) {
              return self.massageResponse(props);
            });
          }

          this.parseBrowsedState(response, options);
          return this.parseBrowsedItems(response, options);
        }
      });
    }
  };

  return ServerAdaptorMixin;
});
