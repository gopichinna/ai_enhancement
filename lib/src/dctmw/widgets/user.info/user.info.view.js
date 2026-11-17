/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "dctmw/widgets/user.avatar/user.avatar.view", "i18n!dctmw/widgets/user.info/impl/nls/lang", "hbs!dctmw/widgets/user.info/impl/user.info", "css!dctmw/widgets/user.info/impl/user.info" ], function(_, Marionette, UserAvatarView, lang, template) {
  "use strict";
  return Marionette.LayoutView.extend({
    constructor: function UserInfoView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, "change", function() {
        this.render();
      }, this);
      this.listenTo(this, "show:profile:picture", this._showUserWidget.bind(this, true));
    },
    template: template,
    templateHelpers: function() {
      return {
        id: this.options.userInfoId ? this.model.get(this.options.userInfoId) : this.model.get("id"),
        user_address: this.model.get("user_address")
      };
    },
    className: "user-info",
    regions: {
      userAvatarRegion: ".user-avatar"
    },
    ui: {
      userId: ".user-id",
      userAddress: ".user-address"
    },
    onRender: function() {
      var fetchProfilePic = !this.options.showUserWidgetOnEvent;
      this._showUserWidget(fetchProfilePic);
      this.updateInfoText();
    },
    updateUserInfo: function(userData) {
      this.model.set(userData);
    },
    updateInfoText: function(searchRegex) {
      if (searchRegex) {
        this.options.searchRegex = searchRegex;
      }
      var userId = this.options.userInfoId ? this.model.get(this.options.userInfoId) : this.model.get("id"), userAddress = "", toolTip = userId;
      this._updateText(userId, this.ui.userId);
      if (!this.model.has("user_address") || this.model.get("isExternal")) {
        this.$el.addClass("only-id");
        toolTip = _.str.sformat(lang.userInfoOnlyIdToolTip, this.options.label, toolTip);
        toolTip = this.options.label ? toolTip : toolTip.substring(1);
      } else {
        this.$el.removeClass("only-id");
        userAddress = this.model.get("user_address");
        this._updateText(userAddress, this.ui.userAddress);
        toolTip = _.str.sformat(lang.userInfoToolTip, this.options.label, toolTip, userAddress);
        toolTip = this.options.label ? toolTip : toolTip.substring(1);
      }
      this.$el.attr({
        title: toolTip,
        "aria-label": toolTip,
        role: "button",
        tabindex: "0"
      });
    },
    isProfilePicturefetched: function() {
      return this.profilePictureFetched === true;
    },
    _updateText: function(text, $el) {
      if (this.options.searchRegex) {
        var updatedtext = text.replace(this.options.searchRegex, function(matchT) {
          return "<span class='dctmw-highlight-options'>" + matchT + "</span>";
        });
        $el.html(updatedtext);
      }
    },
    _showUserWidget: function(fetchProfilePic) {
      if (this.isProfilePicturefetched() && this.options.forceProfilePictureFetch !== true) {
        return;
      }
      var userId = this.options.userInfoId ? this.model.get(this.options.userInfoId) : this.model.get("id");
      if (userId && this.options.context) {
        var resolvePhoto = false;
        if (fetchProfilePic && !this.model.get("isExternal")) {
          resolvePhoto = true;
          this.profilePictureFetched = true;
          this.trigger("user:profile:picture:fetched");
        }
        var userAvatarView = new UserAvatarView({
          userId: userId,
          photoUrl: this.options.photoUrl,
          resolvePhoto: resolvePhoto
        });
        this.userAvatarRegion.show(userAvatarView);
      } else {
        this.userAvatarRegion.reset();
      }
    }
  });
});