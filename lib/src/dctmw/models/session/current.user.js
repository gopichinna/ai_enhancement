/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import MemberModel from "nuc/models/member";

import ServerAdaptorMixin from "dctmw/models/session/cu.server.adaptor";

class CurrentUser extends MemberModel {
  constructor(attr, options) {
    super(attr, options);
    this.makeServerAdaptor(options);
  }
}

ServerAdaptorMixin.mixin(CurrentUser.prototype);

Object.defineProperty(CurrentUser.prototype.constructor, "name", {
  value: "CurrentUser"
});

export default CurrentUser;