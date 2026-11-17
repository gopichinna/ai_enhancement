/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/handlebars", "hbs!d2/dialogs/new.file/link.document/impl/link.document.relation.msg", "hbs!d2/dialogs/new.file/link.document/impl/link.document.relation.msg.content" ], function($, Marionette, Handlebars, template, msgTemplate) {
  "use strict";
  var LinkDocumentRelationMessageView = Marionette.ItemView.extend({
    className: "link-document-relation-message",
    template: template,
    modelEvents: {
      change: "render"
    },
    ui: {
      messageIcon: ".message-icon"
    },
    events: {
      mouseenter: "showPopover",
      mouseleave: "hidePopover"
    },
    constructor: function LinkDocumentRelationMessageView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    canShowPopover: function() {
      return !!this.model.get("message");
    },
    onRender: function() {
      if (this.canShowPopover()) {
        var self = this;
        var content = msgTemplate.call(this, {
          message: this.model.get("message")
        });
        self.ui.messageIcon.binf_popover({
          content: content,
          html: true,
          placement: function() {
            var popOverSource = self.ui.messageIcon, maxWidth = popOverSource.width(), maxHeight = popOverSource.height(), offset = popOverSource.offset(), window_left = offset.left, window_top = offset.top, window_right = $(window).width() - (window_left + popOverSource.outerWidth(true)), window_bottom = $(window).height() - (window_top + popOverSource.outerHeight(true));
            if (window_right > maxWidth) {
              return "right";
            } else if (window_left > maxWidth) {
              return "left";
            } else if (window_bottom > maxHeight) {
              return "bottom";
            } else {
              return "top";
            }
          }
        });
      }
    },
    showPopover: function(e) {
      if (this.canShowPopover()) {
        e.preventDefault();
        e.stopPropagation();
        this.ui.messageIcon.binf_popover("show");
      }
    },
    hidePopover: function(e) {
      if (this.canShowPopover()) {
        e.preventDefault();
        e.stopPropagation();
        this.ui.messageIcon.binf_popover("hide");
      }
    }
  });
  return LinkDocumentRelationMessageView;
});