/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import require from "require";

import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import RestResources from "dctmw/utils/rest.resources";

import RestLinkrels from "d2/utils/rest.linkrels";

import ctfUtils from "d2/ctf/utils";

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
      savePreferences: function(preference) {
        var dfd = $.Deferred();
        require([ "d2/dialogs/user.settings/user.settings.utils" ], UserSettingsUtils => {
          UserSettingsUtils.updateUserSettings(preference, {
            connector: this.connector
          }).done(dfd.resolve).fail(dfd.reject);
        });
        return dfd.promise();
      },
      getPreferredDateTimeDisplayFormat: function() {
        return this.get("date_time_format");
      },
      parse: function(response) {
        var defaultPluginMode = ctfUtils.getDefaultPluginMode();
        if (defaultPluginMode) {
          response["sv_browser_plugin_mode"] = defaultPluginMode;
          response["user_client_experience"] = defaultPluginMode;
          RestResources.getProductInfo().set("browser_plugin_mode", [ defaultPluginMode ]);
        }
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