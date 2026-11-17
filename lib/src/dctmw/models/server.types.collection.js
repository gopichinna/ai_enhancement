/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import {
  Collection
} from "nuc/lib/backbone";

import ServerTypeModel from "dctmw/models/server.type.model";

import ResourceMixin from "dctmw/models/mixins/resource.mixin";

import ReadonlyMixin from "dctmw/models/mixins/readonly.mixin";

class ServerTypesCollection extends Collection {
  model = ServerTypeModel;
  constructor(models, options = {}) {
    super(models, options);
    this.makeResource(options).makeReadonly(options);
  }
  isFetchable() {
    return this.some(this.#needToFetchModel);
  }
  #needToFetchModel(model) {
    return !model.fetched && !model.fetching;
  }
  fetch(options = {}) {
    const promises = [], dfd = $.Deferred();
    this.each(m => {
      if (this.#needToFetchModel(m)) {
        promises.push(m.fetch());
      }
    });
    $.whenAll.apply($, promises).done(function() {
      _.isFunction(options.success) && options.success.call(options.context, this, {}, options);
      this.trigger("sync", this, {}, options);
      dfd.resolve.apply(dfd, arguments);
    }).fail(function() {
      _.isFunction(options.error) && options.error.call(options.context, this, {}, options);
      this.trigger("error", this, {}, options);
      dfd.reject.apply(this, arguments);
    });
    return dfd.promise();
  }
}

ResourceMixin.mixin(ServerTypesCollection.prototype);

ReadonlyMixin.mixin(ServerTypesCollection.prototype);

Object.defineProperty(ServerTypesCollection.prototype.constructor, "name", {
  value: "ServerTypesCollection"
});

export default ServerTypesCollection;