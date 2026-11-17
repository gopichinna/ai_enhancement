/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import NodeModel from "nuc/models/node/node.model";

import NextNodeModelFactory from "csui/utils/contexts/factories/next.node";

import constants from "d2/utils/constants";

class BusinessWorkspaceModel extends NodeModel {
  constructor(attributes, options) {
    super(attributes, options);
    this.resolveWorkspaceId(options);
  }
  resolveWorkspaceId(options) {
    this.nextNodeModel = options.context.getModel(NextNodeModelFactory);
    let type = this.nextNodeModel.get("type"), workspaceId = this.nextNodeModel.get("bws_id");
    if (type === constants.Types.BWS) {
      this.set(this.nextNodeModel.attributes);
      this.fetched = true;
    } else if (workspaceId) {
      if (_.isArray(workspaceId) && workspaceId.length > 0) {
        workspaceId = workspaceId[0];
      }
      this.set("id", workspaceId);
    }
  }
  isFetchable() {
    return this.fetched !== true;
  }
}

Object.defineProperty(BusinessWorkspaceModel.prototype.constructor, "name", {
  value: "BusinessWorkspaceModel"
});

export default BusinessWorkspaceModel;