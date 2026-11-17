/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/utils/url", "dctmw/server.adaptors/converters/user", "dctmw/utils/rest.linkrels", "dctmw/utils/rest.resources" ], function(_, Url, userConverter, RestLinkrels, RestResources) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        url: function() {
          var currRepoLinks = RestResources.getCurrentRepository().get("links");
          return Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), "users", this.get("id"));
        },
        parse: function(response) {
          return userConverter.convertUser(response);
        }
      });
    }
  };
});