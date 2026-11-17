/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import ConnectorFactory from "nuc/contexts/factories/connector";

import ServerTypeModelFactory from "dctmw/contexts/factories/server.type.model.factory";

import ResourceMixin from "dctmw/models/mixins/resource.mixin";

import CommandableMixin from "dctmw/models/mixins/commandable.mixin";

import TypedBaseMixin from "dctmw/models/mixins/typed.base.mixin";

import DelayedDataMixin from "dctmw/models/mixins/model.delayed.data.mixin";

import SQUDelayedDataFetcherMixin from "dctmw/models/mixins/squ.delayed.data.fetcher.mixin";

import constants from "dctmw/utils/constants";

import serverQueryUtils from "dctmw/utils/lw.server.query.utils";

import RestLinkrels from "dctmw/utils/rest.linkrels";

import utils from "dctmw/utils/utils";

import TypedAttributeMapper from "dctmw/utils/typed.attribute.mapper";

import Session from "dctmw/utils/authenticators/session";

function findAnyOfRestLink(...linkIdentifiers) {
  let url;
  const links = this.get("links") ?? [];
  if (links.length) {
    url = linkIdentifiers.filter(linkId => utils.isNonEmptyString(linkId)).map(linkId => RestLinkrels.getLink(links, linkId)).find(link => utils.isNonEmptyString(link));
  }
  return url;
}

const TypedModelResourceMixin = {
  mixin(prototype) {
    TypedBaseMixin.mixin(prototype);
    DelayedDataMixin.mixin(prototype);
    SQUDelayedDataFetcherMixin.mixin(prototype);
    CommandableMixin.mixin(prototype);
    ResourceMixin.mixin(prototype);
    const originalFetch = prototype.fetch, originalUrl = prototype.url, oUrlCreate = prototype.urlCreate, oUrlFetch = prototype.urlFetch, oUrlUpdate = prototype.urlUpdate, oUrlDelete = prototype.urlDelete, oSetHTTPRequestMethod = prototype.setHTTPRequestMethod, oSetHTTPRequestBody = prototype.setHTTPRequestBody, originalSync = prototype.sync, originalParse = prototype.parse, originalGetServerSideFilters = prototype._getServerSideFilters;
    Object.assign(prototype, {
      makeTypedModelResource(options = {}) {
        options.context ??= Session.get().getContext();
        options.connector ??= options.context.getObject(ConnectorFactory);
        this.options ??= options;
        this.makeTyped(options).enableDelayedDataFetch(options).makeCommandable(options).makeResource(options);
        _.extend(this.options, options);
        this.dataType ??= this.options.dataType;
        if (!this.dataType) {
          throw new Error("Unknown dataType while instantiating typed.model.resource");
        }
        this.dataTypeModel = this.options.context.getModel(ServerTypeModelFactory, ServerTypeModelFactory.createModelFactoryOptions({
          name: this.dataType
        }, {
          permanent: true
        }));
        return this;
      },
      url() {
        return _.isFunction(originalUrl) ? originalUrl.call(this) : originalUrl;
      },
      urlCreate() {
        return _.isFunction(oUrlCreate) ? oUrlCreate.call(this) : this.url();
      },
      urlFetch() {
        const url = _.isFunction(oUrlFetch) ? oUrlFetch.call(this) : this.url();
        const serverSideFilters = this._getServerSideFilters();
        return utils.isNonEmptyString(url) ? serverQueryUtils.appendQueryParams(url, {
          scope: this,
          filter: !_.isEmpty(serverSideFilters),
          fetchesAllServerAttributes: true
        }) : url;
      },
      urlUpdate() {
        let url = _.isFunction(oUrlUpdate) ? oUrlUpdate.call(this) : findAnyOfRestLink.call(this, RestLinkrels.EDIT, RestLinkrels.SELF);
        url = url ?? this.url();
        return utils.isNonEmptyString(url) ? serverQueryUtils.appendQueryParams(url, {
          scope: this,
          inline: false,
          fetchesAllServerAttributes: true
        }) : url;
      },
      urlDelete() {
        if (_.isFunction(oUrlDelete)) {
          return oUrlDelete.call(this);
        }
        const url = findAnyOfRestLink.call(this, RestLinkrels.DELETE, RestLinkrels.EDIT, RestLinkrels.SELF);
        return url ?? this.url();
      },
      _getServerSideFilters() {
        const extFilters = _.isFunction(originalGetServerSideFilters) ? originalGetServerSideFilters.call(this) : {};
        return Object.assign({
          id: this.attributes[this.idAttribute ?? "id"]
        }, this.filters ?? {}, extFilters);
      },
      fetch(options) {
        return originalFetch.call(this, options);
      },
      sync(method, model, options) {
        const dfd = $.Deferred();
        const args = arguments;
        this.dataTypeModel.ensureFetched().done(() => {
          if (!utils.isNonEmptyString(options.url)) {
            switch (method) {
             case "delete":
              options.url = this.urlDelete();
              break;

             case "create":
              options.url = this.urlCreate();
              break;

             case "patch":
             case "update":
              options.url = this.urlUpdate();
              break;

             case "read":
             default:
              options.url = this.urlFetch();
              break;
            }
          }
          if (!(utils.isValidHTTPMethod(options.type) || utils.isValidHTTPMethod(options.method))) {
            delete options.method;
            options.type = _.isFunction(this.setHTTPRequestMethod) ? this.setHTTPRequestMethod(method) : null;
            if (!utils.isValidHTTPMethod(options.type)) {
              delete options.type;
            }
          }
          if (!options.data) {
            const rBody = this.setHTTPRequestBody(method, TypedAttributeMapper.convertClientToServerAttrs(options.dataType ?? this.dataType, options.attrs));
            if (!_.isEmpty(rBody)) {
              options.data = JSON.stringify(rBody);
              options.contentType = constants.MediaTypes.JSON;
            }
          }
          this.fetchData(args, options).done(function() {
            dfd.resolve();
          }).fail(function() {
            dfd.reject.apply(dfd, arguments);
          });
        }).fail(function() {
          dfd.reject.apply(dfd, arguments);
        });
        return dfd.promise();
      },
      fetchData(args, options) {
        const dfd = $.Deferred();
        const success = options.success, error = options.error;
        options.success = function(results) {
          success && success.call(options.context, results, "success", {});
          dfd.resolve();
        };
        options.error = function() {
          error && error.apply(options.context, arguments);
          dfd.reject.apply(dfd, arguments);
        };
        const beforesend = options.beforeSend, me = this;
        options.beforeSend = function(request, settings) {
          options.request = request;
          request.settings = settings;
          request.setRequestHeader("Accept", me?.options?.responseMediaType || constants.MediaTypes.DCTM_JSON);
          if (beforesend) {
            beforesend.apply(this, arguments);
          }
        };
        originalSync.apply(this, args);
        return dfd.promise();
      },
      parse(resp, options = {}) {
        if (_.isArray(resp.entries) && resp.entries.length) {
          resp = resp.entries[0];
        }
        const content = _.isObject(resp.properties) ? resp : resp.content ?? {};
        const dataType = options.dataType ?? this.dataType;
        const attrs = Object.assign(TypedAttributeMapper.convertServerToClientAttrs(dataType, content?.properties) ?? {}, {
          links: content.links ?? []
        });
        const retVal = Object.assign(attrs, originalParse.call(this, resp, options));
        if (!retVal[TypedAttributeMapper.constants.CLIENT_ATTR_NAME_TYPE]) {
          retVal[TypedAttributeMapper.constants.CLIENT_ATTR_NAME_TYPE] = retVal[TypedAttributeMapper.constants.SERVER_ATTR_TYPE] || dataType;
        }
        const dataTypeModel = options.dataTypeModel ?? this.dataTypeModel;
        const typeName = dataTypeModel?.get("label");
        if (!retVal[TypedAttributeMapper.constants.CLIENT_ATTR_NAME_TYPE_LABEL] && typeName) {
          retVal[TypedAttributeMapper.constants.CLIENT_ATTR_NAME_TYPE_LABEL] = typeName;
        }
        return retVal;
      },
      setHTTPRequestMethod(operation) {
        return _.isFunction(oSetHTTPRequestMethod) ? oSetHTTPRequestMethod.call(this, operation) : null;
      },
      setHTTPRequestBody(method, attrs) {
        return _.isFunction(oSetHTTPRequestBody) ? oSetHTTPRequestBody.call(this, method, attrs) : attrs;
      },
      hasRESTLink(linkrelId) {
        return !!findAnyOfRestLink.call(this, linkrelId);
      }
    });
    return prototype;
  }
};

export default TypedModelResourceMixin;