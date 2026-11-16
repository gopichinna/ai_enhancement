/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import RestLinkrels from "dctmw/utils/rest.linkrels";

import RestResources from "dctmw/utils/rest.resources";

export default {
  mixin: prototype => {
    return Object.assign(prototype, {
      makeServerAdaptor: function() {
        return this;
      },
      url: function() {
        return RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.CURRENT_USER);
      }
    });
  }
};