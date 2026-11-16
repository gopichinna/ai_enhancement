/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/lib/handlebars", "hbs!esoc/widgets/chatwidget/impl/chatminimize", "csui/lib/binf/js/binf" ], function($, Backbone, Marionette, Handlebars, ChatMinimizeTemplate) {
  var self = null;
  var ChatMinimizeView = Marionette.ItemView.extend({
    initialize: function(options) {
      this.options = options;
      self = this;
    },
    options: {},
    template: ChatMinimizeTemplate,
    _elements: {},
    tagName: "div",
    events: {
      "click .esoc-social-chat-minimized-icon": "onMaximize"
    },
    onMaximize: function(e) {
      $("#esoc-social-chat-minimized-view").remove();
      $("#esoc-social-chat-widget").show();
    }
  });
  return ChatMinimizeView;
});