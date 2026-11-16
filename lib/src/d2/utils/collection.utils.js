/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "csui/utils/contexts/factories/connector", "csui/utils/commandhelper", "nuc/models/member/member.model", "d2/utils/constants", "dctmw/utils/utils", "d2/utils/user.utils", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "i18n!d2/utils/impl/nls/lang" ], function($, _, Url, ConnectorFactory, CommandHelper, UserModel, constants, utils, userUtils, RestResources, RestLinkrels, lang) {
  "use strict";
  return {
    getUserData: function(model, url, filter) {
      var dfd = $.Deferred();
      if (!url) {
        dfd.reject();
      }
      var queryMap = {
        inline: true
      };
      if (filter) {
        queryMap["filter"] = filter;
      }
      url = Url.appendQuery(url, Url.combineQueryString(queryMap));
      $.ajax(model.connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          var options = [], userData = {};
          if (response && response.entries) {
            _.each(response.entries, function(entry) {
              var id = entry["id"] || entry.content.properties.r_object_id;
              if (entry && entry.content && entry.content.properties) {
                var userObject = userUtils.getUserObject(entry.content);
                userData[id] = userObject;
              }
              options.push({
                value: id,
                text: entry.content.properties.object_name
              });
            });
          }
          dfd.resolve({
            options: options,
            userData: userData,
            "has-more-records": response["has-more-records"]
          });
        },
        error: dfd.reject
      }));
      return dfd.promise();
    },
    getUserForDigitalSignature: function(model, filter) {
      var url = RestLinkrels.getLink(model.get("links"), RestLinkrels.D2_DIGITAL_SIGNATURE_SIGNEES);
      return this.getUserData(model, url, filter);
    },
    getCollections: function(collection, filter, options) {
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF);
      url = Url.combine(url, "collections/my-collections?page=-1");
      return this.getUserData(collection, url, filter);
    },
    getUserDump: function(users) {
      var self = this;
      if (users && users.length > 0) {
        return _.reduce(users, function(map, item) {
          var userObject = self.getUserObject(item);
          map[userObject.id] = userObject;
          return map;
        }, {});
      }
    },
    getUserObject: function(userResponse) {
      return userUtils.getUserObject(userResponse);
    }
  };
});