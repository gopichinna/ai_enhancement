/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/backbone", "esoc/widgets/userwidget/chat/chatutil", "esoc/widgets/userwidget/chat/skype/skype.model", "esoc/widgets/userwidget/chat/skype/skypeucwa.attribute.model" ], function($, Backbone, ChatUtil, SkypeModel, skypeAttributeModel) {
  var SkypePluginModel = SkypeModel.extend({
    nameCtrl: null,
    constructor: function SkypePluginModel(options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },
    initialize: function() {},
    updateEventPresence: function(options) {
      this.showUserPresence(options);
    },
    showUserPresence: function(options) {
      if (skypeAttributeModel.getChatEnabled() && skypeAttributeModel.getPresenceEnabled()) {
        var chatOptions;
        if (options.email instanceof Array) {
          chatOptions = {
            status: false
          };
          var i = 0;
          for (i = 0; i < options.email.length; i++) {
            chatOptions.status = this.nameCtrl.GetStatus(options.email[i], String(options.presenceHolder[i]));
            ChatUtil.setIconColor(chatOptions, $("#" + options.presenceHolder[i]));
          }
        } else {
          chatOptions = {
            status: this.nameCtrl.GetStatus(options.email, options.presenceHolder)
          };
          ChatUtil.updatePresenceModel(options, chatOptions);
        }
      }
    },
    attachLyncPresenceChangeEvent: function() {
      if (!this.nameCtrl) {
        return;
      }
      this.nameCtrl.OnStatusChange = this.onLyncPresenceStatusChange;
    },
    onLyncPresenceStatusChange: function(userName, status, id) {
      var presenceIcon = $("#" + id), chatOptions = {
        status: status
      };
      ChatUtil.setIconColor(chatOptions, presenceIcon);
    },
    setNameCtrl: function(vNameCtrl) {
      this.nameCtrl = vNameCtrl;
    },
    getNameCtrl: function() {
      return this.nameCtrl;
    }
  });
  return new SkypePluginModel();
});