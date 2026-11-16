/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/utils/contexts/factories/connector", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/constants", "dctmw/utils/utils", "d2/ctf/utils" ], function($, _, ConnectorFactory, RestResources, RestLinkrels, constants, utils, ctfUtils) {
  "use strict";
  return {
    updateUserSettings: function(userpref, options) {
      var deferred = $.Deferred();
      var currRepoLinks = RestResources.getCurrentRepository().get("links");
      var url = RestLinkrels.getLink(currRepoLinks, RestLinkrels.D2_PREFERENCES);
      var connector = options.context ? options.context.getObject(ConnectorFactory) : options.connector;
      $.ajax(connector.extendAjaxOptions({
        url: url,
        type: "PATCH",
        data: JSON.stringify(userpref),
        contentType: constants.MediaTypes.DCTM_JSON,
        success: function(data) {
          var defaultPluginMode = ctfUtils.getDefaultPluginMode();
          if (defaultPluginMode) {
            data["sv_browser_plugin_mode"] = defaultPluginMode;
            data["user_client_experience"] = defaultPluginMode;
          }
          RestResources.getCurrentUser().set("preferences", data);
          deferred.resolve(data);
        },
        error: function(xhr) {
          deferred.reject(utils.parseAjaxError(xhr));
        }
      }));
      return deferred.promise();
    }
  };
});