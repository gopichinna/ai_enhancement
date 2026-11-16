/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import ServerTypeModelFactory from "dctmw/contexts/factories/server.type.model.factory";

import ResourceMixin from "dctmw/models/mixins/resource.mixin";

import CommandableMixin from "dctmw/models/mixins/commandable.mixin";

import TypedBaseMixin from "dctmw/models/mixins/typed.base.mixin";

import constants from "dctmw/utils/constants";

import serverQueryUtils from "dctmw/utils/lw.server.query.utils";

import utils from "dctmw/utils/utils";

import TypedAttributeMapper from "dctmw/utils/typed.attribute.mapper";

import Session from "dctmw/utils/authenticators/session";

const TypedModelResourceMixin = {
  mixin(prototype) {
    ResourceMixin.mixin(prototype);
    CommandableMixin.mixin(prototype);
    TypedBaseMixin.mixin(prototype);
    const originalFetch = prototype.fetch, originalUrl = prototype.url, originalSync = prototype.sync, originalParse = prototype.parse, originalGetServerSideFilters = prototype._getServerSideFilters;
    Object.assign(prototype, {
      makeTypedModelResource(options = {}) {
        options.context ??= Session.get().getContext();
        this.options ??= options;
        this.makeResource(options).makeCommandable(options).makeTyped(options);
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
      url(baseUrl) {
        const url = utils.isNonEmptyString(baseUrl) ? baseUrl : _.isFunction(originalUrl) ? originalUrl.call(this) : originalUrl;
        const serverSideFilters = this._getServerSideFilters();
        return serverQueryUtils.appendQueryParams(url, {
          scope: this,
          filter: !_.isEmpty(serverSideFilters),
          fetchesAllServerAttributes: true
        });
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
        const content = resp.content ?? {};
        const attrs = Object.assign(TypedAttributeMapper.convertServerToClientAttrs(options.dataType ?? this.dataType, content?.properties), {
          links: content.links ?? []
        });
        return Object.assign(attrs, originalParse.call(this, resp, options));
      }
    });
    return prototype;
  }
};

export default TypedModelResourceMixin;