/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/underscore", "nuc/utils/url", "d2/utils/rest.linkrels", "d2/server.adaptors/converters/comment" ], function($, Backbone, _, Url, RestLinkrels, commentConverter) {
  "use strict";
  function getReplyLinkCountElement(item_id) {
    return document.getElementById("reply_link_count_" + item_id);
  }
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        url: function() {
          var parentCommentModel = this.options.parentCommentModel, links = parentCommentModel.get("links");
          var url = RestLinkrels.getLink(links, RestLinkrels.REPLIES);
          url = Url.appendQuery(url, Url.combineQueryString({
            inline: true,
            "include-total": true
          }));
          return url;
        },
        fetch: function(options) {
          if (options && options.params) {
            delete options.params["data_id"];
            delete this.defaults.params["data_id"];
          }
          options.params = $.extend(this.defaults.params, options.params);
          Backbone.Collection.prototype.fetch.apply(this, arguments);
        },
        remove: function() {
          if (Backbone.Collection.prototype.remove.apply(this, arguments)) {
            this.updateReplyCount(this.models.length);
          }
        },
        updateReplyCount: function(replyCount) {
          var item_id = this.options.parentCommentModel.id, replyLinkCountElement;
          if (replyCount !== 0) {
            replyLinkCountElement = getReplyLinkCountElement(item_id);
            if (replyLinkCountElement) {
              replyLinkCountElement.innerHTML = "(" + replyCount + ")";
            } else {
              var countDivId = "reply_link_count_" + item_id;
              document.getElementById("reply_link_" + item_id).innerHTML += "<span id =" + countDivId + ">(" + replyCount + ")</span>";
            }
            this.options.parentCommentModel.attributes.reply_count = replyCount;
          } else {
            replyLinkCountElement = getReplyLinkCountElement(item_id);
            if (replyLinkCountElement) {
              replyLinkCountElement.innerHTML = "";
            }
          }
        },
        parse: function(response) {
          var replyCount = response.total;
          this.updateReplyCount(replyCount);
          if (response.entries) {
            return _.map(response.entries.reverse(), function(entry) {
              return commentConverter.convertComment(entry);
            });
          }
        },
        fetchSuccess: function(collection, response, options) {
          var totalReplies = response.total;
          var replies = response.entries;
          $(".esoc-social-reply-seemore").hide();
          $(options.selEle).parent().parent().next().find("a:first").trigger("focus");
          if (replies && totalReplies > 0 && replies[totalReplies - 1] && replies[totalReplies - 1].noMoreData === false) {
            $(".esoc-social-reply-seemore:last").show();
          }
          var showMoreLinks = totalReplies > 0 && replies[totalReplies - 1].noMoreData;
          for (var colItem = 0; colItem < collection.models.length; colItem++) {
            collection.models[colItem].attributes.noMoreData = showMoreLinks;
          }
        },
        fetchError: function() {}
      });
    }
  };
});