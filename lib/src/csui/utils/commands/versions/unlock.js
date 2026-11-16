/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "i18n!csui/utils/commands/nls/lang", "i18n!csui/utils/commands/nls/localized.strings", "csui/utils/commands/node", "csui/utils/commandhelper", "csui/utils/url", "csui/models/action" ], function(module, _, $, publicLang, lang, NodeCommand, CommandHelper, Url, ActionModel) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    parallelism: 2
  });
  var UnlockCommand = NodeCommand.extend({
    defaults: {
      signature: "unlock",
      command_key: [ "unlock", "versions_unlock" ],
      name: publicLang.CommandNameUnlock,
      verb: lang.CommandVerbUnlock,
      pageLeavingWarning: lang.UnlockPageLeavingWarning,
      scope: "multiple",
      successMessages: {
        formatForNone: publicLang.UnlockItemsNoneMessage,
        formatForOne: publicLang.UnlockOneItemSuccessMessage,
        formatForTwo: publicLang.UnlockSomeItemsSuccessMessage,
        formatForFive: publicLang.UnlockManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: publicLang.UnlockItemsNoneMessage,
        formatForOne: publicLang.UnlockOneItemFailMessage,
        formatForTwo: publicLang.UnlockSomeItemsFailMessage,
        formatForFive: publicLang.UnlockManyItemsFailMessage
      }
    },
    _performAction: function(status, options) {
      var self = this, node = status, newVersion = node.clone(), connector = node.container && node.container.connector || newVersion.connector;
      var deferred = $.Deferred();
      node.isUnreservedClicked = true;
      var data = {};
      newVersion.save(undefined, {
        data: data,
        type: "POST",
        wait: true,
        url: Url.combine(connector.getConnectionUrl().getApiBase("v2"), "/nodes/" + newVersion.get("id") + "/versions/" + newVersion.get("version_number") + "/unlock")
      }).done(function() {
        newVersion.fetch({
          url: `${connector.getConnectionUrl().getApiBase("v2")}/nodes/${newVersion.get("id")}/versions/${newVersion.get("version_number")}?expand=user&expand=versions{id,owner_id}&actions`
        }).then(function(data) {
          self.updateVersionActions(node, Object.values(data?.results?.actions?.data));
          node.set("locked", data?.results?.data?.versions?.locked);
        });
      }).then(deferred.resolve, deferred.reject);
      return deferred.promise();
    },
    updateVersionActions: function(version, apiActions) {
      if (apiActions.length === 0) return;
      var actionCollection = version.actions;
      var filterGeneration = actionCollection.filter(function(action) {
        return action.id === "makegeneration";
      });
      actionCollection.reset(filterGeneration || []);
      _.each(apiActions, function(action) {
        actionCollection.add(new ActionModel(action));
      });
    }
  });
  return UnlockCommand;
});