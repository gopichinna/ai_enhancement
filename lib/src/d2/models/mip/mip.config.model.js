/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import {
  Model
} from "nuc/lib/backbone";

import Url from "nuc/utils/url";

import ResourceMixin from "d2/sdk/models/mixins/resource.mixin";

import RestLinkrels from "d2/utils/rest.linkrels";

import RestResources from "dctmw/utils/rest.resources";

const methodMap = {
  create: "POST",
  update: "PUT",
  patch: "PATCH",
  delete: "DELETE",
  read: "GET"
};

class MipConfigModel extends Model {
  #serverAttributes = {};
  defaults() {
    return {
      is_mip_enabled: false
    };
  }
  constructor(attr, options = {}) {
    super(attr, options);
    this.makeResource(options);
    this.listenTo(this, "sync", this.#captureServerState);
  }
  url() {
    const url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.MIP_ADMIN_CONFIG), qParams = {
      inline: true,
      links: true
    };
    return Url.appendQuery(url, Url.combineQueryString(qParams));
  }
  parse(resp = {}) {
    return _.extend(resp, {
      is_enabled: resp.is_mip_enabled
    });
  }
  sync(method, model, options) {
    if (method === "patch") {
      method = "create";
      let type = methodMap[method];
      let beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader("X-HTTP-Method-Override", type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }
    return super.sync(method, model, options);
  }
  isNew() {
    let clientCredentials = this.getServerAttribute("client_credentials");
    if (!_.isUndefined(clientCredentials)) {
      if (_.isEmpty(clientCredentials["tenant_id"]) && _.isEmpty(clientCredentials["client_id"])) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
  reset(options) {
    options = _.extend({
      reset: true
    }, options);
    var attrs = _.defaults(_.extend({}, this.#serverAttributes || {}));
    this._reset(attrs, options);
    if (!options.silent) this.trigger("mip:model:reset", this, options);
    return $.Deferred().resolve(this).promise();
  }
  _reset(attrs, options) {
    this.clear({
      silent: true
    }).set(attrs, options);
  }
  #captureServerState() {
    _.extend(this.#serverAttributes, _.deepClone(this.attributes));
  }
  getServerAttribute(attrName) {
    return this.#serverAttributes[attrName];
  }
}

ResourceMixin.mixin(MipConfigModel.prototype);

Object.defineProperty(MipConfigModel.prototype.constructor, "name", {
  value: "MipConfigModel"
});

export default MipConfigModel;