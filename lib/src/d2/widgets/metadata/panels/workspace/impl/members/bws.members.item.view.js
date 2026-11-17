/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  LayoutView
} from "nuc/lib/marionette";

import base from "nuc/utils/base";

import UserAvatarView from "dctmw/widgets/user.avatar/user.avatar.view";

import UserOrGroupComboSearchFormView from "d2/controls/userorgroupcombosearch.form/userorgroupcombosearch.form.view";

import template from "hbs!d2/widgets/metadata/panels/workspace/impl/members/bws.members.item";

import lang from "i18n!d2/widgets/metadata/panels/workspace/impl/nls/lang";

import "css!d2/widgets/metadata/panels/workspace/impl/members/bws.members.item";

class BWSMembersItemView extends LayoutView {
  template = template;
  className() {
    return "d2-bws-member" + (this.model.get("isNew") ? " d2-bws-new-member" : "");
  }
  attributes() {
    return {
      tabindex: "-1"
    };
  }
  templateHelpers() {
    return {
      saveLabel: lang.saveLabel,
      removeLabel: lang.removeLabel,
      cancelLabel: lang.cancelLabel,
      showRemove: base.isTouchBrowser()
    };
  }
  ui() {
    return {
      saveButton: ".d2-bws-save-icon",
      cancelButton: ".d2-bws-cancel-icon",
      removeButton: ".d2-bws-remove-member"
    };
  }
  regions() {
    return {
      rgnUserAvatar: ".d2-bws-member-avatar",
      rgnUserOrGroupComboSearchForm: ".d2-bws-add-member-search"
    };
  }
  events() {
    return {
      "click @ui.saveButton": "onSaveButtonClick",
      "click @ui.cancelButton": "onCancelButtonClick",
      "click @ui.removeButton": "onRemoveButtonClick",
      focusin: "onFocusIn"
    };
  }
  constructor(options) {
    super(options);
    this.#setupChildrenViews();
    this.listenTo(this.options.originatingView, "d2:bws:member:clear:new:highlight", () => {
      this.$el.removeClass("d2-bws-new-member");
      this.model.set("isNew", false);
    });
    this.listenTo(this.options.originatingView, "d2:bws:reset:tabindex", this.resetTabIndex);
    this.listenTo(this.options.originatingView, "d2:bws:show:remove:member:button", () => this.ui.removeButton.removeClass("binf-hidden"));
  }
  #setupChildrenViews() {
    if (this.model.get("isLocallyCreated")) {
      this.#setupUserOrGroupComboSearchFormView();
    } else {
      this.#setupUserAvatarView();
    }
  }
  #setupUserOrGroupComboSearchFormView() {
    this.userOrGroupComboSearchFormView = new UserOrGroupComboSearchFormView({
      model: this.model,
      context: this.options.context,
      userOrGroupSearchFieldOptions: {
        placeholder: lang.searchUserOrGroupPlaceholder
      },
      existingUsersOrGroups: () => {
        return this.model?.collection?.pluck("name").filter(v => !_.isEmpty(v)) || [];
      },
      customFilter: "((group_class='group' or group_class='role' and (is_dynamic=false and is_protected=false)) and not(starts-with(group_name, \"dm_\")) and not(starts-with(group_name, \"dmc_\"))) or r_is_group eq false"
    });
    this.listenTo(this.userOrGroupComboSearchFormView, "d2:userorgroup:search:value:change", this.#onMemberSelect);
  }
  #setupUserAvatarView() {
    this.userAvatarView = new UserAvatarView({
      userId: this.model.get("name"),
      resolvePhoto: true
    });
  }
  onShow() {
    this.#renderChildrenViews();
    this.userOrGroupComboSearchFormView && this.listenTo(this.userOrGroupComboSearchFormView, "render:form", () => {
      this.userOrGroupComboSearchFormView.$el.find("input").focus();
    });
  }
  #renderChildrenViews() {
    this.#renderUserAvatarView();
    this.#renderUserOrGroupComboSearchFormView();
  }
  #renderUserAvatarView() {
    this.rgnUserAvatar && this.userAvatarView && this.rgnUserAvatar.show(this.userAvatarView);
  }
  #renderUserOrGroupComboSearchFormView() {
    this.rgnUserOrGroupComboSearchForm && this.userOrGroupComboSearchFormView && this.rgnUserOrGroupComboSearchForm.show(this.userOrGroupComboSearchFormView);
  }
  #onMemberSelect(newUserOrGroup) {
    this.newUserOrGroup = newUserOrGroup;
    if (_.isEmpty(newUserOrGroup?.searchedUserOrGroupId) || _.isEmpty(newUserOrGroup?.searchedUserOrGroupName)) {
      this.ui.saveButton.attr("disabled", true);
    } else {
      this.ui.saveButton.removeAttr("disabled");
    }
  }
  onSaveButtonClick(event) {
    event.stopPropagation();
    event.preventDefault();
    this.options.originatingView.trigger("d2:bws:add:member:save", {
      newUserOrGroup: this.newUserOrGroup,
      model: this.model,
      keyboardEvent: event.originalEvent?.pointerType !== "mouse"
    });
  }
  onCancelButtonClick(event) {
    event.stopPropagation();
    event.preventDefault();
    this.options.originatingView.trigger("d2:bws:add:member:cancel", {
      model: this.model,
      keyboardEvent: event.originalEvent?.pointerType !== "mouse"
    });
  }
  onRemoveButtonClick(event) {
    event.stopPropagation();
    event.preventDefault();
    this.options.originatingView.trigger("d2:bws:remove:member", {
      model: this.model,
      keyboardEvent: event.originalEvent?.pointerType !== "mouse"
    });
  }
  onFocusIn() {
    this.resetTabIndex();
  }
  resetTabIndex() {
    this.$el.attr("tabindex", "-1");
  }
}

Object.defineProperty(BWSMembersItemView.prototype.constructor, "name", {
  value: "BWSMembersItemView"
});

export default BWSMembersItemView;