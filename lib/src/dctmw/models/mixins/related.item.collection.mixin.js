/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import {
  Model
} from "nuc/lib/backbone";

import RestLinkrels from "dctmw/utils/rest.linkrels";

import constants from "dctmw/utils/constants";

import utils from "dctmw/utils/utils";

function relationSourceChangeListener(model, prevId) {
  this._relationSourceChanged = true;
  if (!model || utils.isNonEmptyString(prevId) && model.get(model.idAttribute || "id") !== prevId) {
    this.reset([]);
    _.isFunction(this.invalidateFetch) && this.invalidateFetch();
  }
}

const RelatedItemCollectionMixin = {
  mixin(prototype) {
    const originalFetch = prototype.fetch, oParse = prototype.parse, oSync = prototype.sync, oSyncRelationRemovals = prototype.syncRelationRemovals, oSyncRelationAdditions = prototype.syncRelationAdditions, oUrlRelatedItemRemove = prototype.urlRelatedItemRemove, oSetHTTPRequestMethod4RelatedItemRemove = prototype.setHTTPRequestMethod4RelatedItemRemove, oSetHTTPRequestBody4RelatedItemRemove = prototype.setHTTPRequestBody4RelatedItemRemove, oUrlRelatedItemAdd = prototype.urlRelatedItemAdd, oSetHTTPRequestMethod4RelatedItemAdd = prototype.setHTTPRequestMethod4RelatedItemAdd, oSetHTTPRequestBody4RelatedItemAdd = prototype.setHTTPRequestBody4RelatedItemAdd;
    Object.assign(prototype, {
      makeRelatedItemCollection(options = {}) {
        this.node ??= options.node;
        if (!this.node) {
          throw new Error(`Relation source node missing in instance of ${this.constructor.name}[cid=${this.cid}]`);
        }
        this.listenTo(this.node, "changeId", relationSourceChangeListener).listenTo(this, "sync", () => {
          this._relationSourceChanged = false;
        });
        return this;
      },
      resetRelationSource(node) {
        if (node instanceof Model && this.node !== node) {
          this.stopListening(this.node);
          this.node = node;
          this.listenTo(this.node, "changeId", relationSourceChangeListener);
          relationSourceChangeListener.call(this);
        }
      },
      fetch(options = {}) {
        if (this._relationSourceChanged === true) {
          Object.assign(options, {
            reload: true,
            skipSWCache: true
          });
        }
        options.handleMissingURLGracefully = true;
        return originalFetch && originalFetch.call(this, options);
      },
      parse(resp, options) {
        (resp.entries ?? []).forEach(entry => {
          const eLinks = _.isArray(entry.links) ? entry.links : [];
          const linkRelDelete = eLinks.find(link => link.rel === RestLinkrels.DELETE);
          const content = entry.content ?? {};
          if (linkRelDelete) {
            const contentLinks = _.isArray(content.links) ? content.links : [];
            if (!contentLinks.find(link => link.rel === RestLinkrels.DELETE_RELATED_ITEM)) {
              contentLinks.push(Object.assign({}, linkRelDelete, {
                rel: RestLinkrels.DELETE_RELATED_ITEM
              }));
            }
            content.links = contentLinks;
          }
        });
        return _.isFunction(oParse) ? oParse.call(this, resp, options) : resp;
      },
      save(options = {}) {
        const error = options.error;
        const success = options.success;
        options.success = (col, resp) => {
          _.isFunction(success) && success.call(options.context, this, resp, options);
          this.trigger("sync", this, resp, options);
        };
        options.error = resp => {
          _.isFunction(error) && error.call(options.context, this, resp, options);
          this.trigger("error", this, resp, options);
        };
        return this.sync("update", this, options);
      },
      sync(method, col, options) {
        if (method === "read") {
          return oSync.call(this, method, col, options);
        } else if (method === "update") {
          const modelsRemoved = _.isArray(options.modelsRemoved) ? options.modelsRemoved : [];
          const modelsAdded = _.isArray(options.modelsAdded) ? options.modelsAdded : [];
          const removalHandler = _.isFunction(options.syncRelationRemovals) ? options.syncRelationRemovals : this.syncRelationRemovals;
          const additionHandler = _.isFunction(options.syncRelationAdditions) ? options.syncRelationAdditions : this.syncRelationAdditions;
          const initPromise = $.Deferred().resolve().promise();
          this.trigger("request", this, null, options);
          return initPromise.then(() => {
            if (modelsRemoved.length) {
              return removalHandler.call(this, modelsRemoved);
            } else {
              return $.Deferred().resolve().promise();
            }
          }).then(removalResponse => {
            const dfd = $.Deferred();
            if (modelsAdded.length) {
              additionHandler.call(this, modelsAdded).fail(dfd.reject).done(additionResponse => {
                dfd.resolve(removalResponse, additionResponse);
              });
            } else {
              dfd.resolve();
            }
            return dfd.promise();
          }).then((removalResponse, additionResponse) => {
            _.isFunction(options.success) && options.success.call(options.context, this, {
              removed: removalResponse,
              added: additionResponse
            }, options);
          }).catch((...args) => {
            _.isFunction(options.error) && options.error.apply(options.context, args);
          });
        } else {
          throw new Error(`${method} is not supported for ${this.constructor.name}[${this.cid}]`);
        }
      },
      syncRelationRemovals(modelsRemoved) {
        if (_.isFunction(oSyncRelationRemovals)) {
          return oSyncRelationRemovals.call(this, modelsRemoved);
        }
        const combinedResponse = {};
        return modelsRemoved.reduce((promise, model) => {
          const dfd = $.Deferred();
          promise.always(() => {
            const url = this.urlRelatedItemRemove(model);
            if (url) {
              const type = this.setHTTPRequestMethod4RelatedItemRemove(model);
              const rBody = this.setHTTPRequestBody4RelatedItemRemove(model);
              const ajaxOptions = this.connector.extendAjaxOptions({
                url: url,
                type: utils.isValidHTTPMethod(type) ? type : "DELETE",
                success: resp => {
                  combinedResponse[model.get(model.idAttribute ?? "id")] = resp;
                  dfd.resolve(combinedResponse);
                },
                error: dfd.reject
              });
              if (_.isObject(rBody) && !_.isEmpty(rBody)) {
                ajaxOptions.data = JSON.stringify(rBody);
                ajaxOptions.contentType = constants.MediaTypes.JSON;
              }
              $.ajax(ajaxOptions);
            } else {
              dfd.reject(`URL not found for removing related item model ${model.constructor.name}[${model.cid}]`);
            }
          });
          return dfd.promise();
        }, $.Deferred().resolve().promise());
      },
      syncRelationAdditions(modelsAdded) {
        if (_.isFunction(oSyncRelationAdditions)) {
          return oSyncRelationAdditions.call(this, modelsAdded);
        }
        const combinedResponse = {};
        return modelsAdded.reduce((promise, model) => {
          const dfd = $.Deferred();
          promise.always(() => {
            const url = this.urlRelatedItemAdd(model);
            if (url) {
              const type = this.setHTTPRequestMethod4RelatedItemAdd(model);
              const rBody = this.setHTTPRequestBody4RelatedItemAdd(model);
              const ajaxOptions = this.connector.extendAjaxOptions({
                url: url,
                type: utils.isValidHTTPMethod(type) ? type : "POST",
                success: resp => {
                  combinedResponse[model.get(model.idAttribute ?? "id")] = resp;
                  dfd.resolve(combinedResponse);
                },
                error: dfd.reject
              });
              if (_.isObject(rBody) && !_.isEmpty(rBody)) {
                ajaxOptions.data = JSON.stringify(rBody);
                ajaxOptions.contentType = constants.MediaTypes.JSON;
              }
              $.ajax(ajaxOptions);
            } else {
              dfd.reject(`URL not found for adding related item model ${model.constructor.name}[${model.cid}]`);
            }
          });
          return dfd.promise();
        }, $.Deferred().resolve().promise());
      },
      urlRelatedItemRemove(model) {
        return _.isFunction(oUrlRelatedItemRemove) ? oUrlRelatedItemRemove.call(this, model) : RestLinkrels.getLink(model.get("links") ?? [], RestLinkrels.DELETE_RELATED_ITEM);
      },
      setHTTPRequestMethod4RelatedItemRemove(model) {
        return _.isFunction(oSetHTTPRequestMethod4RelatedItemRemove) ? oSetHTTPRequestMethod4RelatedItemRemove.call(this, model) : "DELETE";
      },
      setHTTPRequestBody4RelatedItemRemove(model) {
        return _.isFunction(oSetHTTPRequestBody4RelatedItemRemove) ? oSetHTTPRequestBody4RelatedItemRemove.call(this, model) : {};
      },
      urlRelatedItemAdd(model) {
        return _.isFunction(oUrlRelatedItemAdd) ? oUrlRelatedItemAdd.call(this, model) : this.url();
      },
      setHTTPRequestMethod4RelatedItemAdd(model) {
        return _.isFunction(oSetHTTPRequestMethod4RelatedItemAdd) ? oSetHTTPRequestMethod4RelatedItemAdd.call(this, model) : "POST";
      },
      setHTTPRequestBody4RelatedItemAdd(model) {
        if (_.isFunction(oSetHTTPRequestBody4RelatedItemAdd)) {
          return oSetHTTPRequestBody4RelatedItemAdd.call(this, model);
        }
        const selfRef = RestLinkrels._getLinkMeta(model.get("links") ?? [], RestLinkrels.SELF)?.href;
        return selfRef ? {
          href: selfRef
        } : {};
      }
    });
  }
};

export default RelatedItemCollectionMixin;