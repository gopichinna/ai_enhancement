/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Model
} from "nuc/lib/backbone";

import RestLinkrels from "d2/utils/rest.linkrels";

class BWSRoleMemberModel extends Model {
  constructor(attributes, options) {
    super(attributes, options);
    this.node = options.node;
  }
  url() {
    let url = RestLinkrels.getLink(this.node.get("links"), this.get("isGroup") || this.get("r_is_group") ? RestLinkrels.GROUPS : RestLinkrels.USERS);
    return this.deleting ? url + "/" + this.get("name") : url;
  }
  parse(response) {
    if (response?.content?.properties) {
      response.content.properties.links = response.content.links;
      response.content.properties.id = response.id;
    }
    return response?.content?.properties || {};
  }
}

Object.defineProperty(BWSRoleMemberModel.prototype.constructor, "name", {
  value: "BWSRoleMemberModel"
});

export default BWSRoleMemberModel;