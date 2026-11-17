/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Collection
} from "nuc/lib/backbone";

import Url from "nuc/utils/url";

import BWSRoleMemberModel from "d2/models/bws/bws.role.member.model";

import RestLinkrels from "d2/utils/rest.linkrels";

class BWSRoleMembersCollection extends Collection {
  constructor(models, options) {
    super(models, options);
    this.node = options.node;
  }
  model = BWSRoleMemberModel;
  url() {
    let qParams = {
      inline: true,
      links: true
    };
    return Url.appendQuery(RestLinkrels.getLink(this.node.get("links"), RestLinkrels.D2_BUSINESS_WORKSPACE_ROLE_MEMBERS), Url.combineQueryString(qParams));
  }
  parse(response, options) {
    options.node = this.node;
    return response.entries || [];
  }
}

Object.defineProperty(BWSRoleMembersCollection.prototype.constructor, "name", {
  value: "BWSRoleMembersCollection"
});

export default BWSRoleMembersCollection;