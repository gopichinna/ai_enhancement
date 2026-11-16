/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/utils/letter-avatar-random-color/letter-avatar-colors", "d2/controls/typeahead/impl/typeahead.option.item.view", "hbs!d2/dialogs/share.to.core/impl/share.to.core.assignee.option" ], function(_, $, Backbone, Marionette, LetterAvatarColor, TypeaheadOptionItemView, template) {
  "use strict";
  var ShareToCoreAssigneeOptionView = TypeaheadOptionItemView.extend({
    constructor: function ShareToCoreAssigneeOptionView() {
      TypeaheadOptionItemView.prototype.constructor.apply(this, arguments);
    },
    template: template,
    templateHelpers: function() {
      return {
        itemTitle: this.getItemTitle()
      };
    },
    ui: {
      assigneeAvatar: ".assignee-avatar"
    },
    getInitial: function() {
      return this.model.get("name").substr(0, 1).toUpperCase();
    },
    getItemTitle: function() {
      return this.model.get("name") + "\n" + this.model.get("id");
    },
    updateViewElementAttribute: function() {
      TypeaheadOptionItemView.prototype.updateViewElementAttribute.apply(this, arguments);
      var initial = this.getInitial();
      var profileAvatarBGColor = LetterAvatarColor.getLetterAvatarColor(initial);
      this.ui.assigneeAvatar.css("background-color", profileAvatarBGColor);
      this.ui.assigneeAvatar.text(initial);
    }
  });
  return ShareToCoreAssigneeOptionView;
});