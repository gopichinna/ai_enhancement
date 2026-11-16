/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/utils/base" ], function($, Base) {
  "use strict";
  var div;
  return {
    convertComment: function(entry) {
      var content = entry.content;
      if (!div) {
        div = document.createElement("div");
      }
      div.innerHTML = content["content-value"];
      var text = div.textContent;
      var creationDate = Base.formatFriendlyDateTimeNow(content["creation-date"]), modifyDate = Base.formatFriendlyDateTimeNow(content["modified-date"]);
      var userName = entry.author[0].name;
      if (modifyDate === creationDate) {
        modifyDate = "";
      }
      return {
        id: content["comment-id"],
        data_id: content["comment-id"],
        created_at: creationDate,
        created_at_iso8601: creationDate,
        modified_at: modifyDate,
        modified_at_iso8601: modifyDate,
        text: $.trim(text),
        links: entry.content.links,
        feed_event_type: 0,
        user: {
          id: userName,
          name: userName,
          screen_name: userName,
          profile_image_url: "-"
        },
        noMoreData: true,
        actions: this.getActionsFromContent(content),
        extended_info: {}
      };
    },
    getActionsFromContent: function(content) {
      var actions = {};
      if (content["can-delete"]) {
        actions.deleteAction = {
          body: "",
          content_type: "",
          href: "/pulse/statuses/destroy",
          href_form: "/pulse/statuses/destroy",
          method: "DELETE",
          name: "Delete"
        };
      }
      if (content["can-reply"]) {
        actions.reply = {
          body: "",
          can_addAttachment: false,
          can_addShortcut: false,
          can_reply: true,
          content_type: "",
          href: "/pulse/statuses/show_conversation?includes=actions,reply_count&count=5&conversation_id=32365&item_id=32365",
          href_form: "",
          method: "GET",
          name: "Reply"
        };
      }
      if (content["can-edit"]) {
        actions.edit = {
          body: "",
          content_type: "",
          href: "/pulse/comment",
          href_form: "",
          method: "PUT",
          name: "Edit"
        };
      }
      if (content["can-addattachment"]) {
        actions.addattachment = {
          body: "",
          content_type: "",
          href: "/pulse/comment",
          href_form: "",
          method: "PUT",
          name: "AddAttachment"
        };
      }
      if (content["can-addshortcut"]) {
        actions.addshortcut = {
          body: "",
          content_type: "",
          href: "/pulse/comment",
          href_form: "",
          method: "PUT",
          name: "AddShortcut"
        };
      }
      return actions;
    }
  };
});