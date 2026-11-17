/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/utils/contexts/factories/connector", "csui/utils/contexts/factories/member", "dctmw/lib/uri-templates", "dctmw/utils/authenticators/session" ], function($, _, ConnectorFactory, MemberModelFactory, UriTemplates, Session) {
  "use strict";
  var userAvatarBlobData = {};
  return {
    getUserProfileRepositoryLink: function() {
      throw new Error(`Override this method to return the API uri for getting user profile image`);
    },
    getUserPhotoUrl: function(userName) {
      return this.getUserProfileImageUrl(userName);
    },
    getUserProfileImageUrl: function(userName) {
      var templateUrl = this.getUserProfileRepositoryLink();
      if (templateUrl) {
        var templateParams = {
          "user-name": userName
        }, template = new UriTemplates(templateUrl);
        return template.fill(templateParams);
      }
    },
    getMemberModelForUser: function(userId) {
      var memberModel = Session.get().getContext().getModel(MemberModelFactory, {
        attributes: {
          id: userId
        },
        options: {
          connector: Session.get().getContext().getObject(ConnectorFactory)
        },
        temporary: true
      });
      return memberModel;
    },
    getUserAvatarBlobUrl: function(options) {
      options = options || {};
      if (!options.userId) {
        throw Error("User id is mandatory for resolving user avatar.");
      }
      if (!options.url) {
        throw Error("Photo URL is mandatory for resolving user avatar.");
      }
      var me = this, dfd = $.Deferred(), connector = Session.get().getContext().getObject(ConnectorFactory), userId = options.userId, cachedAvatarBlobUrl = userAvatarBlobData[userId];
      if (cachedAvatarBlobUrl) {
        if (cachedAvatarBlobUrl === "NOT_FOUND") {
          dfd.reject();
        } else {
          dfd.resolve(cachedAvatarBlobUrl);
        }
      } else {
        var url = options.url;
        $.ajax(connector.extendAjaxOptions({
          url: url,
          dataType: "binary",
          success: function(response) {
            let avatarBlobContentUrl = URL.createObjectURL(response);
            userAvatarBlobData[userId] = avatarBlobContentUrl;
            dfd.resolve(avatarBlobContentUrl);
          },
          error: function(xhr) {
            if (xhr.status === 404) {
              userAvatarBlobData[userId] = "NOT_FOUND";
            } else {
              me.clearUserAvatarBlobUrl(userId);
            }
            dfd.reject();
          }
        }));
      }
      return dfd.promise();
    },
    clearUserAvatarBlobUrl: function(userId) {
      delete userAvatarBlobData[userId];
    }
  };
});