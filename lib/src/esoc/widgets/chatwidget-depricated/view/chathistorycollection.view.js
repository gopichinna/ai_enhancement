/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "esoc/widgets/chatwidget/view/chathistory.view" ], function($, Backbone, Marionette, ChatHistory) {
  var ChatHistotyCollection = Marionette.CollectionView.extend({
    tagName: "ul",
    className: "chat-history-list",
    childView: ChatHistory,
    constructor: function ChatHistotyCollection() {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },
    events: {},
    onRender: function() {
      this.$el.find(".esoc-social-chat-history-item").hide();
    },
    loadMoreItems: function(e) {}
  });
  return ChatHistotyCollection;
});