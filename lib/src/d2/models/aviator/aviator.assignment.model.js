/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import NodeModel from "d2/sdk/models/node.model";

class AviatorAssignmentModel extends NodeModel {
  constructor(attr, options = {}) {
    super(attr, options);
  }
  parse(response, options) {
    const attrs = super.parse(response, options);
    const actions = attrs.actions || [];
    attrs.actions = [ {
      signature: "Aviator-GoToLocation"
    }, {
      signature: "Aviator-RemoveAssignment"
    }, ...actions ];
    return attrs;
  }
}

Object.defineProperty(AviatorAssignmentModel.prototype.constructor, "name", {
  value: "AviatorAssignmentModel"
});

export default AviatorAssignmentModel;