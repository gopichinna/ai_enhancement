/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import Url from "nuc/utils/url";

import RestLinkrels from "dctmw/utils/rest.linkrels";

import RestResources from "dctmw/utils/rest.resources";

const DCTMTypeModelServerAdaptor = {
  mixin(prototype) {
    Object.assign(prototype, {
      makeServerAdaptor() {
        return this;
      },
      url() {
        const qP = {
          "include-mapping-tables": true
        };
        const url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.TYPES);
        return Url.appendQuery(Url.combine(url, this.get(this.idAttribute)), Url.combineQueryString(qP));
      }
    });
    return prototype;
  }
};

export default DCTMTypeModelServerAdaptor;