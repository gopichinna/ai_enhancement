/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Model
} from "nuc/lib/backbone";

import Url from "nuc/utils/url";

import ResourceMixin from "d2/sdk/models/mixins/resource.mixin";

import RestResources from "dctmw/utils/rest.resources";

import RestLinkrels from "d2/utils/rest.linkrels";

class AviatorConfigModel extends Model {
  #serverAttributes = {};
  defaults() {
    return {};
  }
  constructor(attr, options = {}) {
    super(attr, options);
    this.listenTo(this, "sync", this.#captureServerState);
  }
  url() {
    const url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.AVIATOR_CONFIG), qParams = {
      inline: true,
      links: true
    };
    return Url.appendQuery(url, Url.combineQueryString(qParams));
  }
  parse(resp = {}) {
    return _.extend(resp, {
      is_enabled: resp.aviator_enabled
    });
  }
  #captureServerState() {
    _.extend(this.#serverAttributes, _.deepClone(this.attributes));
  }
  getServerAttribute(attrName) {
    return this.#serverAttributes[attrName];
  }
}

ResourceMixin.mixin(AviatorConfigModel.prototype);

Object.defineProperty(AviatorConfigModel.prototype.constructor, "name", {
  value: "AviatorConfigModel"
});

export default AviatorConfigModel;