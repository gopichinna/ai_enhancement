/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import Url from "nuc/utils/url";

import nodeConverter from "dctmw/server.adaptors/converters/node";

import RestResources from "dctmw/utils/rest.resources";

import RestLinkrels from "dctmw/utils/rest.linkrels";

export default {
  mixin: function(prototype) {
    return Object.assign(prototype, {
      makeServerAdaptor: function() {
        return this;
      },
      isFetchableDirectly: function() {
        var id = this.get("id");
        return id && id !== "volume";
      },
      urlBase: function() {
        var id = this.get("id"), url;
        if (!id) {
          throw new Error("Node creation not supported via model");
        } else {
          url = Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF), "objects", id);
        }
        return url;
      },
      url: function() {
        return this.urlBase();
      },
      parse: function(resp) {
        return nodeConverter.convertNode(resp);
      },
      canBeOpened: function(nodeData) {
        return nodeData && nodeData.basePermissions && nodeData.basePermissions.read;
      }
    });
  }
};