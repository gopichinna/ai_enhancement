/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/command", "dctmw/utils/client.location", "dctmw/events/oah/dctm.oah.handler", "d2/utils/contexts/context.controller", "dctmw/events/oah/events.constants", "i18n!d2/commands/nls/localized.strings" ], function(CommandModel, clientLocation, DctmOahHandler, D2ContextController, eventsConstants, lang) {
  "use strict";
  var ExecuteSavedSearchCommand = CommandModel.extend({
    defaults: {
      signature: "D2-ExecuteSavedSearch",
      command_key: "D2-ExecuteSavedSearch",
      name: lang.CommandNameExecuteSavedSearch,
      scope: "single"
    },
    enabled: function() {
      return true;
    },
    execute: function(status) {
      var savedSearchId = status.savedSearchId, triggerOnNavigate = !status.disableTriggerOnNavigate, activeRoute = status.context && status.context.viewStateModel && status.context.viewStateModel.get("activeRouterInstance");
      if (activeRoute && activeRoute.searchQuery) {
        activeRoute.searchQuery.clear({
          silent: true
        });
        if (triggerOnNavigate === true) {
          activeRoute.searchQuery.set("forcePerspectiveChange", true, {
            silent: true
          });
        }
      }
      clientLocation.navigate(clientLocation.modularizeFragment("#search/by-id/" + savedSearchId), {
        trigger: triggerOnNavigate
      });
    },
    subscribeEvents: function() {
      DctmOahHandler.subscribeEvent({
        event: "D2_ACTION_SEARCH_DOCUMENT",
        callbackFunction: function(event, message) {
          var status = {
            context: D2ContextController.getContext(),
            savedSearchId: message.get(eventsConstants.OAM.PARAM_ID)
          };
          this.execute(status, {});
        }.bind(this)
      });
    }
  });
  return ExecuteSavedSearchCommand;
});