/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/url", "csui/utils/perspective/perspective.util" ], function(Url, PerspectiveUtil) {
  "use strict";
  const PersonalizationCollectionMixin = {
    mixin: function(prototype) {
      return Object.assign(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        url: function() {
          const apiUrl = new Url(this.connector.connection.url).getApiBase(2);
          let url;
          url = Url.combine(apiUrl, "perspectives/myperspectives");
          return url;
        },
        parse: function(response) {
          let personalizationCollection = [];
          if (Array.isArray(response.results)) {
            for (let perspective of response.results) {
              if (this.options.removeUnsupportedPagesForPersonalization && !PerspectiveUtil.canPersonalizePage(perspective.layoutType)) continue;
              personalizationCollection.push({
                perspective_id: perspective.dataid,
                title: perspective.name,
                type: perspective.layoutType,
                default: perspective.isDefault,
                hasOnlybasicPerspectiveInfo: true
              });
            }
          }
          return personalizationCollection;
        }
      });
    }
  };
  return PersonalizationCollectionMixin;
});