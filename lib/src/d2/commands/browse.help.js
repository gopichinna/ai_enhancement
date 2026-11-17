/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "csui/lib/othelp", "i18n", "csui/models/command", "csui/models/server.module/server.module.collection", "dctmw/utils/rest.resources", "d2/utils/documentation.utils", "i18n!d2/commands/nls/localized.strings" ], function(module, _, $, OTHHUrlBuilder, i18n, CommandModel, ServerModuleCollection, RestResources, DocumentationUtils, lang) {
  "use strict";
  const config = module.config();
  var CommandBrowseHelp = CommandModel.extend({
    defaults: {
      signature: "D2-BrowseHelp",
      command_key: "D2-BrowseHelp",
      name: lang.CommandNameHelp
    },
    enabled: function(status) {
      if (status && status.toolItem) {
        var menuActions = RestResources.getCurrentUser().get("MenuActions");
        var helpAction = menuActions && menuActions.get(this.get("signature"));
        if (helpAction) {
          return true;
        }
      }
      return false;
    },
    execute: function(status) {
      var deferred = $.Deferred();
      const {
        moduleNamePattern,
        activeHelpModuleName
      } = _.defaults({}, status.data, config, {
        moduleNamePattern: "^d2",
        activeHelpModuleName: "d2"
      });
      this.openHelp({
        commandData: status.data,
        moduleNamePattern: moduleNamePattern,
        activeHelpModuleName: activeHelpModuleName,
        onSuccess: deferred.resolve,
        onError: deferred.reject
      });
      return deferred.promise();
    },
    openHelp: function(options) {
      DocumentationUtils.getHelpUrl(options).done(function(helpURL) {
        var browserTab = window.open(helpURL, "D2HELP");
        browserTab && browserTab.focus();
        if (_.isFunction(options.onSuccess)) {
          options.onSuccess();
        }
      }).fail(function() {
        if (_.isFunction(options.onError)) {
          options.onError();
        }
      });
    }
  });
  return CommandBrowseHelp;
});