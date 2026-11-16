/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/underscore", "nuc/utils/url", "nuc/utils/base", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/server.adaptors/converters/comment", "d2/server.adaptors/models/esoc/comments.utils" ], function($, Backbone, _, Url, Base, RestResources, RestLinkrels, commentConverter, CommentsUtils) {
  "use strict";
  return {
    mixin: function(prototype) {
      var superSyncMethod = prototype.sync;
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        base: Base,
        url: function() {
          var url = RestLinkrels.getLink(this.currentNodeModel.get("links"), RestLinkrels.COMMENTS);
          if (url) {
            url = Url.appendQuery(url, Url.combineQueryString({
              inline: true,
              "include-total": true
            }));
            return url;
          }
        },
        fetch: function() {
          Backbone.Collection.prototype.fetch.apply(this, arguments);
        },
        sync: function(method, collection, options) {
          return superSyncMethod.call(this, method, collection, options).done(function() {
            if (collection.length > 0) {
              CommentsUtils.fetchTotalReplies(collection);
            }
          }.bind(this));
        },
        parse: function(response) {
          if (response.entries) {
            return _.map(response.entries.reverse(), function(entry) {
              return commentConverter.convertComment(entry);
            });
          }
        },
        getCurrentUserInfo: function() {
          var currentUser = RestResources.getCurrentUser();
          return {
            first_name: currentUser.get("first_name"),
            last_name: currentUser.get("last_name"),
            name: currentUser.get("display_name"),
            photo_id: currentUser.get("photo_url"),
            profile_image_url: currentUser.get("photo_url"),
            user_id: currentUser.get("id")
          };
        },
        getConfigSettings: function() {
          return {
            auditProfilePhotoFetch: "off",
            disableCommentsInWorkflowVolume: "off",
            disablePhotoCache: "off",
            disablePulseFromHere: "off",
            exnodetypeitems: "",
            feedGrowToMax: "60",
            feedsAutoRefreshWait: 1e4,
            masterSwitchEnabled: true,
            maxMessageLength: 1e3,
            maxNumOfEntries: 60,
            msgMaxLen: "1000",
            numConnects: "20",
            refreshInterval: "10",
            timelineItems: "20",
            visibility: "on"
          };
        }
      });
    }
  };
});