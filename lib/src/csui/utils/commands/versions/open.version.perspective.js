/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/models/command", "csui/utils/commandhelper", "i18n!csui/utils/commands/versions/nls/localized.strings" ], function($, _, CommandModel, CommandHelper, lang) {
  "use strict";
  var OpenVersionPerspectiveCommand = CommandModel.extend({
    defaults: {
      signature: "OpenVersionPerspective",
      command_key: [ "OpenSpecificNodePerspective" ]
    },
    enabled: function(status) {
      var version = CommandHelper.getJustOneNode(status);
      return version && version.get("id") && version.get("version_number");
    },
    execute: function(status, options) {
      var deferred = $.Deferred();
      status.suppressSuccessMessage = true;
      var context = status.context || options && options.context, nextVersion = context.getModel("nextVersion"), version = CommandHelper.getJustOneNode(status);
      if (!version || !version.get("id") || !version.get("version_number")) {
        deferred.reject({
          message: lang.MissingVersionInfo
        });
        return;
      }
      nextVersion.set({
        id: version.get("id"),
        version_number: version.get("version_number")
      });
      deferred.resolve();
      return deferred.promise();
    }
  });
  return OpenVersionPerspectiveCommand;
});