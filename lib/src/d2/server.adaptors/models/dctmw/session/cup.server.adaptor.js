/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import RestResources from "dctmw/utils/rest.resources";

import RestLinkrels from "d2/utils/rest.linkrels";

import ctfUtils from "d2/ctf/utils";

import dateUtils from "d2/utils/date/date.utils";

const UserPreferenceServerAdaptor = {
  mixin: prototype => {
    const origSave = prototype.save;
    return Object.assign(prototype, {
      makeServerAdaptor: function() {
        return this;
      },
      url: function() {
        return RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_PREFERENCES);
      },
      parse: function(response) {
        var defaultPluginMode = ctfUtils.getDefaultPluginMode();
        if (defaultPluginMode) {
          response["sv_browser_plugin_mode"] = defaultPluginMode;
          response["user_client_experience"] = defaultPluginMode;
          RestResources.getProductInfo().set("browser_plugin_mode", [ defaultPluginMode ]);
        }
        var svDateFormat = dateUtils.getDateFormatFromDateTimeFormat(response.date_time_format), svDateTimeFormat = dateUtils.convertClassicToSVDateTimeFormat(response.date_time_format);
        require.config({
          config: {
            "d2/overrides/nuc/utils/types/date": {
              dateFormat: svDateFormat,
              dateTimeFormat: svDateTimeFormat
            }
          }
        });
        return response;
      },
      isNew: function() {
        return false;
      },
      save: function(key, val, options = {}) {
        if (key == null || typeof key === "object") {
          options = val;
        }
        if (typeof options !== "object") {
          options = {};
        }
        options.patch = true;
        return origSave.apply(this, _.reject([ key, val, options ], kk => kk === undefined));
      }
    });
  }
};

export default UserPreferenceServerAdaptor;