/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import {
  Model,
  Collection
} from "nuc/lib/backbone";

import {
  CompositeView
} from "nuc/lib/marionette";

import ConnectorFactory from "nuc/contexts/factories/connector";

import BlockingView from "smart/controls/progressblocker/blocker";

import GlobalMessage from "d2/controls/globalmessage/globalmessage";

import BWSMembersItemView from "d2/widgets/metadata/panels/workspace/impl/members/bws.members.item.view";

import RestLinkrels from "d2/utils/rest.linkrels";

import RestResources from "dctmw/utils/rest.resources";

import template from "hbs!d2/widgets/metadata/panels/workspace/impl/members/bws.members.card";

import lang from "i18n!d2/widgets/metadata/panels/workspace/impl/nls/lang";

import "css!d2/widgets/metadata/panels/workspace/impl/members/bws.members.card";

class BWSMembersCardView extends CompositeView {
  template = template;
  childView = BWSMembersItemView;
  childViewContainer = ".d2-bws-members-list";
  childViewOptions() {
    return {
      originatingView: this,
      context: this.options.context
    };
  }
  className() {
    return "d2-bws-members-card";
  }
  ui() {
    return {
      roleName: ".d2-bws-role-name",
      card: ".d2-bws-members-list",
      addMember: ".d2-bws-add-member"
    };
  }
  events() {
    return {
      "click @ui.addMember": "onAddMemberClick",
      "open @ui.card": "onCardExpandCollapse",
      "close @ui.card": "onCardExpandCollapse",
      keydown: "onKeyDown"
    };
  }
  templateHelpers() {
    return {
      addLabel: lang.addMemberLabel,
      expanded: this.options.expanded,
      tabIndex: this.options.addTabIndex ? 0 : -1
    };
  }
  constructor(options) {
    options.collection = options.model?.members || new Collection();
    options.collection.allModels = _.clone(options.collection.models);
    super(options);
    this.showAddButton = !!RestLinkrels.getLink(this.model.get("links"), RestLinkrels.EDIT);
    this.showRemoveButton = !!RestLinkrels.getLink(this.model.get("links"), RestLinkrels.DELETE);
    if (!this.showAddButton || !this.showRemoveButton) {
      let adminRoleUsers = this.options.adminRoleUsers || [];
      (_.isArray(adminRoleUsers) ? $.Deferred().resolve(adminRoleUsers).promise() : adminRoleUsers).done(users => {
        this.showAddButton = this.showAddButton || users?.includes(RestResources.getCurrentUser()?.id);
        this.showRemoveButton = this.showRemoveButton || users?.includes(RestResources.getCurrentUser()?.id);
        this.#updateButtons();
      });
    }
    this.listenTo(this, "d2:bws:add:member:save", this.#onMemberAddSave);
    this.listenTo(this, "d2:bws:add:member:cancel", this.#onMemberAddCancel);
    this.listenTo(this, "d2:bws:remove:member", this.#onMemberRemove);
    if (options.blockingParentView) {
      BlockingView.delegate(this, this.options.blockingParentView);
    } else {
      BlockingView.imbue(this);
    }
  }
  onShow() {
    if (this.ui.card[0].shadowRoot) {
      $(this.ui.card[0].shadowRoot).find("otc-button").attr("tabindex", "-1");
      this.children.findByIndex(0)?.$el.trigger("focusin");
    } else {
      setTimeout(this.onShow.bind(this));
      return;
    }
    this.#updateButtons();
  }
  onCardExpandCollapse() {
    this.trigger("d2:bws:member:clear:new:highlight");
  }
  onAddMemberClick(event) {
    event.stopPropagation();
    event.preventDefault();
    var model = new Model();
    model.connector = this.options.context.getObject(ConnectorFactory);
    model.set("isLocallyCreated", true);
    this.collection.unshift(model);
    this.ui.card.attr("expanded", "true");
    this.ui.addMember.addClass("binf-hidden");
    this.trigger("d2:bws:member:clear:new:highlight");
    setTimeout(() => $(this.ui.card[0].shadowRoot).find("otc-button").attr("tabindex", "-1"));
    setTimeout(() => this.trigger("d2:bws:reset:tabindex"));
  }
  #onMemberAddSave({
    newUserOrGroup,
    model,
    keyboardEvent
  }) {
    var me = this;
    this.blockActions();
    this.model.addMember(newUserOrGroup).done(() => {
      me.unblockActions();
      me.collection.remove(model);
      me.collection.allModels.unshift(me.collection.at(0));
      me.ui.addMember.removeClass("binf-hidden");
      me.options.originatingView.trigger("d2:bws:update:member:search");
      keyboardEvent && $(me.$el.find(".d2-bws-member")[0]).focus();
      setTimeout(() => me.trigger("d2:bws:reset:tabindex"));
      me.#updateButtons();
    }).fail(err => {
      me.unblockActions();
      me.ui.addMember.removeClass("binf-hidden");
      _.isString(err) && !_.isEmpty(err) && GlobalMessage.showMessage("error", err);
    });
  }
  #onMemberAddCancel({
    model,
    keyboardEvent
  }) {
    this.collection.remove(model);
    this.ui.addMember.removeClass("binf-hidden");
    setTimeout(() => this.trigger("d2:bws:reset:tabindex"));
    if (!keyboardEvent) {
      return;
    }
    if (this.collection.length) {
      $(this.$el.find(".d2-bws-member")[0]).focus();
    } else {
      this.$el.find(".d2-bws-role-name").focus();
    }
  }
  #onMemberRemove({
    model,
    keyboardEvent
  }) {
    var me = this;
    this.blockActions();
    this.model.removeMember(model).done(() => {
      me.unblockActions();
      const index = me.collection.allModels.indexOf(model);
      if (index > -1) {
        me.collection.allModels.splice(index, 1);
      }
      me.options.originatingView.trigger("d2:bws:update:member:search");
      me.trigger("d2:bws:member:clear:new:highlight");
      setTimeout(() => me.trigger("d2:bws:reset:tabindex"));
      if (!keyboardEvent) {
        return;
      }
      if (me.collection.length) {
        $(me.$el.find(".d2-bws-member")[index === me.collection.length ? index - 1 : index]).focus();
      } else {
        me.$el.find(".d2-bws-role-name").focus();
      }
    }).fail(err => {
      me.unblockActions();
      _.isString(err) && !_.isEmpty(err) && GlobalMessage.showMessage("error", err);
    });
  }
  onMembersSearchChange(searchValue = "") {
    this.trigger("d2:bws:member:clear:new:highlight");
    this.collection.reset(this.collection.allModels.filter(model => model.get("name")?.toLowerCase().includes(searchValue.toLowerCase())));
    this.showAddButton && this.ui.addMember[_.isEmpty(searchValue) ? "removeClass" : "addClass"]("binf-hidden");
    this.showRemoveButton && this.children.each(childView => childView.ui.removeButton[_.isEmpty(searchValue) ? "removeClass" : "addClass"]("binf-hidden"));
    if (_.isUndefined(this.ui.card.attr("expanded"))) {
      this.initialCollapsed = true;
    }
    if (_.isEmpty(searchValue) && this.initialCollapsed) {
      this.ui.card.removeAttr("expanded");
      this.initialCollapsed = false;
    } else if (!_.isEmpty(searchValue)) {
      this.ui.card.attr("expanded", true);
    }
    $(this.ui.card[0].shadowRoot).find("otc-button").attr("tabindex", "-1");
    this.ui.roleName.attr("tabindex", this.options.isFirst ? "0" : "-1");
    setTimeout(() => this.trigger("d2:bws:reset:tabindex"));
  }
  onKeyDown(event) {
    var memberList = this.$el.find(".d2-bws-member");
    if (event.which === 9 && !event.shiftKey && !$(event.target).closest(".d2-bws-member").length && this.collection.length && !_.isUndefined(this.ui.card.attr("expanded"))) {
      if ($(memberList[0]).has("input").length) {
        $(memberList[0]).find("input").focus();
      } else {
        $(memberList[0]).focus();
      }
      event.stopPropagation();
      event.preventDefault();
    }
    if (!$(event.target).closest(".d2-bws-member").length) {
      return;
    }
    $(event.target).find(".d2-bws-remove-member").removeClass("d2-bws-show-remove");
    $(event.target).removeClass("d2-bws-show-remove");
    switch (event.which) {
     case 33:
     case 36:
      event.stopPropagation();
      event.preventDefault();
      if ($(memberList[0]).has("input").length) {
        $(memberList[0]).find("input").focus();
      } else {
        $(memberList[0]).focus();
      }
      break;

     case 34:
     case 35:
      event.stopPropagation();
      event.preventDefault();
      if ($(memberList[memberList.length - 1]).has("input").length) {
        $(memberList[memberList.length - 1]).find("input").focus();
      } else {
        $(memberList[memberList.length - 1]).focus();
      }
      break;

     case 37:
      event.stopPropagation();
      event.preventDefault();
      if ($(event.target).closest(".d2-bws-member").has("input").length) {
        var prevElement;
        if ($(event.target).prev().hasClass(".d2-bws-add-member-search")) {
          prevElement = $(event.target).prev().find("input");
        } else {
          prevElement = $(event.target).prev();
        }
        while (prevElement.length && prevElement.attr("disabled")) {
          prevElement = prevElement.prev();
        }
        prevElement = prevElement.hasClass("d2-bws-add-member-search") ? prevElement.find("input") : prevElement;
        prevElement.focus();
      } else {
        $(event.target).closest(".d2-bws-member").focus();
      }
      break;

     case 39:
      event.stopPropagation();
      event.preventDefault();
      if ($(event.target).closest(".d2-bws-member").has("input").length) {
        var nextElement;
        if ($(event.target).is("input")) {
          nextElement = $(event.target).closest(".d2-bws-add-member-search").next();
        } else {
          nextElement = $(event.target).next();
        }
        while (nextElement.length && nextElement.attr("disabled")) {
          nextElement = nextElement.next();
        }
        nextElement.focus();
      } else {
        $(event.target).hasClass("d2-bws-remove-member") && $(event.target).addClass("d2-bws-show-remove");
        $(event.target).find(".d2-bws-remove-member").addClass("d2-bws-show-remove");
        $(event.target).find(".d2-bws-remove-member").focus();
      }
      break;
    }
  }
  #updateButtons() {
    this.showAddButton && this.ui.addMember.removeClass("binf-hidden");
    this.showRemoveButton && this.trigger("d2:bws:show:remove:member:button");
  }
}

Object.defineProperty(BWSMembersCardView.prototype.constructor, "name", {
  value: "BWSMembersCardView"
});

export default BWSMembersCardView;