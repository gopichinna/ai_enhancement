/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import {
  Collection
} from "nuc/lib/backbone";

import Url from "nuc/utils/url";

import RestLinkrels from "dctmw/utils/rest.linkrels";

import BWSRoleModel from "d2/models/bws/bws.role.model";

class BWSRoleCollection extends Collection {
  constructor(models, options) {
    super(models, options);
    this.node = options.node;
    this.connector = options.connector;
  }
  model = BWSRoleModel;
  url() {
    let qParams = {
      inline: true,
      links: true
    };
    return Url.appendQuery(RestLinkrels.getLink(this.node.get("links"), RestLinkrels.D2_BUSINESS_WORKSPACE_ROLES), Url.combineQueryString(qParams));
  }
  parse(response, options) {
    options.connector = this.connector;
    return response.entries || [];
  }
  fetch(options = {}) {
    options = _.extend(options, {
      parse: true,
      reset: options.reset === undefined ? true : options.reset
    });
    let includeMembers = options.includeMembers, originalSuccess = options.success, originalError = options.error, collection = this, deferred = $.Deferred();
    options.success = resp => {
      if (!includeMembers) {
        collection.#onFetchSuccess(resp, options, originalSuccess);
        deferred.resolve(resp);
        return;
      }
      collection.reset(resp, _.extend({
        silent: true
      }, options));
      let memberFetches = collection.map(role => role.fetchMembers());
      Promise.all(memberFetches).then(() => {
        collection.#onFetchSuccess(resp, _.extend({}, options, {
          reset: false
        }), originalSuccess);
        deferred.resolve(resp);
      }).catch(xhr => {
        collection.#onFetchError(xhr, options, originalError);
        deferred.reject(xhr);
      });
    };
    options.error = xhr => {
      collection.#onFetchError(xhr, options, originalError);
      deferred.reject(xhr);
    };
    this.sync("read", this, options);
    return deferred;
  }
  #onFetchSuccess(resp, options, originalSuccess) {
    var method = options.reset ? "reset" : "set";
    this[method](resp, options);
    _.isFunction(originalSuccess) && originalSuccess.call(options.context, this, resp, options);
    this.trigger("sync", this, resp, options);
  }
  #onFetchError(xhr, options, originalError) {
    _.isFunction(originalError) && originalError.call(options.context, this, xhr, options);
    this.trigger("error", this, xhr, options);
  }
}

Object.defineProperty(BWSRoleCollection.prototype.constructor, "name", {
  value: "BWSRoleCollection"
});

export default BWSRoleCollection;