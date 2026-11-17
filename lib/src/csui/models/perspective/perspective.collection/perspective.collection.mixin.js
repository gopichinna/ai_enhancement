/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/url" ], function(Url) {
  "use strict";
  const PerspectiveCollectionMixin = {
    mixin: function(prototype) {
      return Object.assign(prototype, {
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
          if (Array.isArray(response.results)) {
            for (let perspective of response.results) {
              perspectiveCollection.push({
                av_id: perspective.dataid,
                title: perspective.name,
                perspective: {
                  type: perspective.layoutType
                },
                default: perspective.isDefault,
                hasOnlybasicPerspectiveInfo: true,
                enabled: perspective.enabled,
                departmentId: perspective.departmentId
              });
            }
          }
          return perspectiveCollection;
        }
      });
    }
  };
  return PerspectiveCollectionMixin;
});