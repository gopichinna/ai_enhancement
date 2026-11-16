/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "dctmw/server.adaptors/converters/node", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels" ], function($, _, Url, nodeConverter, RestResources, RestLinkrels) {
  "use strict";
  var commentingEnabled = false;
  function updateCommentCount(nodeModel, commentCount) {
    nodeModel.set("wnd_comments", commentCount);
  }
  function updateRepliesCount(comment, replyCount) {
    comment.set("reply_count", replyCount);
  }
  return {
    fetchTotalCommentsGeneric: function(ids, connector) {
      var deferred = $.Deferred(), currentRepo = RestResources.getCurrentRepository(), url = Url.combine(RestLinkrels.getLink(currentRepo.get("links"), RestLinkrels.SELF), "comments-count");
      url = Url.appendQuery(url, Url.makeMultivalueParameter("object-ids", ids));
      $.ajax(connector.extendAjaxOptions({
        url: url,
        success: function(response, textStatus, request) {
          try {
            deferred.resolve(response, textStatus, request);
          } catch (e) {
            console.error(e);
          }
        }.bind(this),
        error: function(request, textStatus, error) {
          deferred.reject(error);
        }
      }));
      return deferred.promise();
    },
    fetchTotalComments: function(nodeChildrenArr, connector) {
      var ids = _.compact(nodeChildrenArr.map(function(nodeModel) {
        return nodeConverter.isNonDCTMNode(nodeModel) ? null : nodeModel.get("id");
      }));
      var deferred = $.Deferred();
      this.fetchTotalCommentsGeneric(ids, connector).done(function(response) {
        if (_.isArray(response.entries)) {
          var totalEntries = response.entries.length;
          response.entries.forEach(function(entry) {
            var nodeModel = _.find(nodeChildrenArr, function(data) {
              return data.get("id") === entry.content.r_object_id;
            });
            if (nodeModel && response.entries && response.entries.length) {
              if (entry.content.comments_count > 0) {
                if (totalEntries < 20) {
                  updateCommentCount(nodeModel, entry.content.comments_count);
                } else {
                  setTimeout(updateCommentCount.bind(this, nodeModel, entry.content.comments_count), 100);
                }
              } else if (nodeModel.get("wnd_comments")) {
                nodeModel.set("wnd_comments", null);
              }
            }
          });
        }
        try {
          deferred.resolve(response);
        } catch (e) {
          console.error(e);
        }
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    fetchTotalReplies: function(commentsCollection) {
      var ids = commentsCollection.pluck("id"), deferred = $.Deferred(), currentRepo = RestResources.getCurrentRepository(), url = Url.combine(RestLinkrels.getLink(currentRepo.get("links"), RestLinkrels.SELF), "objects", commentsCollection.nodeID, "comments-replies-count");
      url = Url.appendQuery(url, Url.makeMultivalueParameter("comment-ids", ids));
      $.ajax(commentsCollection.connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          response.entries.forEach(function(entry) {
            var comment = commentsCollection.find({
              id: entry.content.comment_id.toString()
            });
            if (comment && response.entries && response.entries.length) {
              updateRepliesCount(comment, entry.content.replies_count);
            }
          });
          deferred.resolve();
        }.bind(this),
        error: function(request, textStatus, error) {
          deferred.reject(error);
        }
      }));
      return deferred.promise();
    },
    setCommentingEnabled: function(flag) {
      commentingEnabled = flag;
    },
    isCommentingEnabled: function() {
      return commentingEnabled;
    }
  };
});