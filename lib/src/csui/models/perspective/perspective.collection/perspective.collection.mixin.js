/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/url" ], function(_, Url) {
  "use strict";
  const PerspectiveCollectionMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        url: function() {
          const apiUrl = new Url(this.connector.connection.url).getApiBase(2);
          let url;
          url = Url.combine(apiUrl, "perspectives/list");
          return url;
        },
        parse: function(response) {
          let perspectiveCollection = [];
          for (let perspective of response.results) {
            perspectiveCollection.push({
              av_id: perspective.dataid,
              title: perspective.name,
              perspective: {
                type: perspective.layoutType
              },
              hasOnlybasicPerspectiveInfo: true
            });
          }
          return perspectiveCollection;
        }
      });
    }
  };
  return PerspectiveCollectionMixin;
});