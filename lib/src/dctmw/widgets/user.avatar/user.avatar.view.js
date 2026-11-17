/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  ItemView
} from "nuc/lib/marionette";

import userUtils from "dctmw/utils/user.utils";

class UserAvatarView extends ItemView {
  constructor(options = {}) {
    if (!options.model && options.userId) {
      options.model = userUtils.getMemberModelForUser(options.userId);
    }
    if (!options.model) {
      throw Error("Member model is mandatory.");
    }
    super(options);
    this.#setAttributeForAvatar();
  }
  #setAttributeForAvatar() {
    let initials = this.#resolveInitial();
    this.$el.attr("initials", initials);
    if (this.options.size) {
      this.$el.attr("size", this.options.size);
    }
  }
  onRender() {
    this.#resolvePhoto();
  }
  #resolveInitial() {
    return this.model.get("initials") || this.model.get("id").substring(0, 1).toUpperCase();
  }
  #resolvePhoto() {
    let photoUrl = this.#getPhotoUrl();
    if (photoUrl) {
      userUtils.getUserAvatarBlobUrl({
        userId: this.model.get("id"),
        url: photoUrl
      }).done(avatarBlobUrl => {
        this.$el.attr("image", avatarBlobUrl);
        this.trigger("user:avatar:ready", true);
      }).fail(() => {
        this.$el.removeAttr("image");
        this.trigger("user:avatar:ready", false);
      });
    }
  }
  #getPhotoUrl() {
    let photoUrl = this.options.photoUrl;
    if (!photoUrl && this.options.resolvePhoto === true) {
      photoUrl = userUtils.getUserPhotoUrl(this.model.get("id"));
    }
    return photoUrl;
  }
}

Object.assign(UserAvatarView.prototype, {
  className: "dctm-user-avatar",
  template: false,
  tagName: "otc-avatar"
});

Object.defineProperty(UserAvatarView.prototype.constructor, "name", {
  value: "UserAvatarView"
});

export default UserAvatarView;