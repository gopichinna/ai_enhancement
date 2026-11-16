/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/models/member", "csui/utils/contexts/factories/connector", "esoc/controls/userwidget/userwidget.view", "d2/utils/user.utils", "i18n!d2/widgets/user.info/impl/nls/lang", "hbs!d2/widgets/user.info/impl/user.info", "css!d2/widgets/user.info/impl/user.info" ], function($, _, Backbone, Marionette, Member, ConnectorFactory, UserWidgetView, userUtils, lang, template) {
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
          return "<span class='d2-highlight-options'>" + matchT + "</span>";
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
        var photoUrl;
        if (fetchProfilePic && !this.model.get("isExternal")) {
          photoUrl = userUtils.getUserPhotoUrl(userId);
          this.profilePictureFetched = true;
          this.trigger("user:profile:picture:fetched");
        }
        var member = new Member({
          id: userId,
          name: userId,
          display_name: userId,
          type: 0,
          initials: userId.substr(0, 1).toUpperCase(),
          photo_url: photoUrl,
          connector: this.options.context.getObject(ConnectorFactory)
        }), userWidgetView = new UserWidgetView({
          userid: userId,
          connector: this.options.context.getObject(ConnectorFactory),
          context: this.options.context,
          model: member,
          showMiniProfile: false,
          showUserProfileLink: false,
          showUserWidgetFor: "profilepic",
          userWidgetWrapperClass: "d2-userinfo-profile-pic"
        });
        userWidgetView.once("show", function() {
          userWidgetView.$el.find(".d2-userinfo-profile-pic").attr({
            disabled: true,
            tabindex: -1
          }).removeAttr("href");
        });
        this.userAvatarRegion.show(userWidgetView);
      } else {
        this.userAvatarRegion.reset();
      }
    }
  });
});