/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import ConnectorFactory from "nuc/contexts/factories/connector";

import Url from "nuc/utils/url";

import constants from "dctmw/utils/constants";

import RestLinkrels from "dctmw/utils/rest.linkrels";

import RestResources from "dctmw/utils/rest.resources";

import Session from "dctmw/utils/authenticators/session";

import utils from "dctmw/utils/utils";

import lang from "i18n!dctmw/server.adaptors/models/impl/nls/lang";

const DctmPrefStoreServerAdaptorMixin = {
  mixin(prototype) {
    Object.assign(prototype, {
      makePrefStore(options = {}) {
        this.storeName = options.storeName;
        if (!utils.isNonEmptyString(this.storeName)) {
          throw new Error("Missing store name");
        }
        return this;
      },
      _urlRoot() {
        return RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.CURRENT_USER_PREFERENCE);
      },
      _storeUrl() {
        return Url.combine(this._urlRoot(), this.storeName);
      },
      _noPreferenceSupportMessage() {
        return _.str.sformat(lang.noPreferenceSupport, RestResources.getCurrentRepository().get("name"));
      },
      _getConnector() {
        return Session.get().getContext().getObject(ConnectorFactory);
      },
      _createStore(options = {}) {
        const dfd = $.Deferred();
        const {
          data = {}
        } = options;
        const url = this._urlRoot();
        if (url) {
          const connector = this._getConnector();
          data["client"] = this.storeName;
          $.ajax(connector.extendAjaxOptions({
            url: url,
            type: "POST",
            contentType: constants.MediaTypes.JSON,
            data: JSON.stringify(data),
            success: dfd.resolve,
            error: dfd.reject
          }));
        } else {
          dfd.reject(this._noPreferenceSupportMessage());
        }
        return dfd.promise();
      },
      _fetchStore() {
        const dfd = $.Deferred();
        const url = this._storeUrl();
        if (url) {
          const connector = this._getConnector();
          $.ajax(connector.extendAjaxOptions({
            url: url,
            type: "GET",
            success: dfd.resolve,
            error: dfd.reject
          }));
        } else {
          dfd.reject(this._noPreferenceSupportMessage());
        }
        return dfd.promise();
      },
      _updateStore(options = {}) {
        const dfd = $.Deferred();
        const {
          data = {}
        } = options;
        const url = this._storeUrl();
        if (url) {
          const connector = this._getConnector();
          $.ajax(connector.extendAjaxOptions({
            url: url,
            type: "POST",
            contentType: constants.MediaTypes.JSON,
            data: JSON.stringify(data),
            success: dfd.resolve,
            error: dfd.reject
          }));
        } else {
          dfd.reject(this._noPreferenceSupportMessage());
        }
        return dfd.promise();
      },
      _removeStore() {
        const dfd = $.Deferred();
        const url = this._storeUrl();
        if (url) {
          const connector = this._getConnector();
          $.ajax(connector.extendAjaxOptions({
            url: url,
            type: "DELETE",
            success: dfd.resolve,
            error: dfd.reject
          }));
        } else {
          dfd.reject(this._noPreferenceSupportMessage());
        }
        return dfd.promise();
      }
    });
    return prototype;
  }
};

export default DctmPrefStoreServerAdaptorMixin;