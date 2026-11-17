/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import {
  Model
} from "nuc/lib/backbone";

import BWSRoleMemberCollection from "d2/models/bws/bws.role.member.collection";

import BWSRoleMemberModel from "d2/models/bws/bws.role.member.model";

import constants from "d2/utils/constants";

class BWSRoleModel extends Model {
  constructor(attributes, options) {
    super(attributes, options);
    this.connector = options.connector;
  }
  initialize(attributes, options) {
    this.members = options.collection.findWhere({
      r_object_id: attributes.id
    })?.members || new BWSRoleMemberCollection([], {
      node: this
    });
  }
  parse(response) {
    response?.content?.properties && (response.content.properties.links = response.content.links);
    return response?.content?.properties || {};
  }
  fetchMembers() {
    return this.members.fetch();
  }
  addMember(data) {
    let member = new BWSRoleMemberModel(data, {
      node: this
    }), dfd = $.Deferred(), postData = {
      href: data.href.slice(data.href.startsWith("/") ? data.href.indexOf("/", data.href.indexOf("/") + 1) : 0, data.href.lastIndexOf("/")) + "/" + data.searchedUserOrGroupName
    }, me = this;
    member.collection = this.members;
    member.save(null, this.connector.extendAjaxOptions({
      headers: {
        "Content-Type": constants.MediaTypes.DCTM_JSON
      },
      data: JSON.stringify(postData),
      dataType: undefined,
      success: () => {
        member.clear();
        member.set({
          id: data.searchedUserOrGroupName,
          name: data.searchedUserOrGroupName,
          r_is_group: data.isGroup,
          isNew: true
        });
        me.members.unshift(member);
        dfd.resolve();
      },
      error: (model, xhr) => {
        dfd.reject(xhr?.responseJSON?.message || "");
      }
    }));
    return dfd.promise();
  }
  removeMember(member) {
    let dfd = $.Deferred(), me = this;
    if (!member) {
      console.error("No member provided for remove.");
      return $.Deferred().reject("").promise();
    }
    member.deleting = true;
    member.destroy(this.connector.extendAjaxOptions({
      headers: {
        "Content-Type": constants.MediaTypes.DCTM_JSON
      },
      success: () => {
        delete member.deleting;
        me.members.remove(member);
        dfd.resolve();
      },
      error: (model, xhr) => {
        delete member.deleting;
        dfd.reject(xhr?.responseJSON?.message || "");
      },
      wait: true
    }));
    return dfd.promise();
  }
}

Object.defineProperty(BWSRoleModel.prototype.constructor, "name", {
  value: "BWSRoleModel"
});

export default BWSRoleModel;