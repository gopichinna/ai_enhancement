/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "dctmw/lib/uri-templates", "dctmw/utils/rest.resources", "dctmw/utils/rest.linkrels" ], function(UriTemplates, RestResources, RestLinkrels) {
  "use strict";
  function getUserProfileImageUrl(userName) {
    var templateUrl = RestLinkrels.getLinkTemplate(RestResources.getCurrentRepository().get("links"), RestLinkrels.USER_PROFILE_IMAGE);
    if (templateUrl) {
      var templateParams = {
        "user-name": userName
      }, template = new UriTemplates(templateUrl);
      return template.fill(templateParams);
    }
  }
  return {
    convertUser: function(response) {
      var properties = response.properties, name = properties.user_name;
      return {
        business_email: properties.user_address,
        business_phone: "",
        name: name,
        first_name: "",
        id: name,
        initials: name.substr(0, 1).toUpperCase(),
        last_name: name,
        display_name: name,
        office_location: "",
        photo_url: getUserProfileImageUrl(name),
        type: 0,
        links: response.links,
        properties: properties
      };
    }
  };
});