/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  extend
} from "nuc/lib/underscore";

import UploadableMixin from "nuc/models/mixins/uploadable/uploadable.mixin";

import BrowsableV2ResponseMixin from "nuc/models/browsable/v2.response.mixin";

import Url from "nuc/utils/url";

export default {
  mixin: function(prototype) {
    const originalSync = prototype.sync;
    BrowsableV2ResponseMixin.mixin(prototype);
    return extend(prototype, {
      makeServerAdaptor(options) {
        this.makeBrowsableV2Response(options);
        return this;
      },
      url() {
        const apiUrl = this.connector.getConnectionUrl().getApiBase(2);
        const url = Url.combine(apiUrl, "nodes/list");
        return url;
      },
      sync(method, model, options) {
        const body = {
          ids: this.ids,
          fields: {
            properties: {
              fields: [ "id", "name", "type", "container", "image_url", "mime_type" ]
            }
          }
        };
        let data = JSON.stringify(body);
        let contentType;
        if (UploadableMixin.useJSON || UploadableMixin.mock) {
          contentType = "application/json";
        } else {
          data = `body=${encodeURIComponent(data)}`;
          contentType = "application/x-www-form-urlencoded";
        }
        options = extend({
          type: "POST",
          contentType: contentType,
          data: data
        }, options);
        return originalSync.call(this, method, model, options);
      },
      parse(response, options) {
        return this.parseBrowsedItems(response, options);
      }
    });
  }
};