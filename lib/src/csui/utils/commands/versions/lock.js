/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "i18n!csui/utils/commands/nls/lang", "i18n!csui/utils/commands/nls/localized.strings", "csui/utils/commands/node", "csui/utils/commandhelper", "csui/utils/url", "csui/models/action" ], function(module, _, $, publicLang, lang, NodeCommand, CommandHelper, Url, ActionModel) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    parallelism: 2
  });
  var LockCommand = NodeCommand.extend({
    defaults: {
      signature: "lock",
      command_key: [ "lock", "versions_lock" ],
      name: publicLang.CommandNameLock,
      verb: lang.CommandVerbLock,
      pageLeavingWarning: lang.LockPageLeavingWarning,
      scope: "multiple",
      successMessages: {
        formatForNone: publicLang.LockItemsNoneMessage,
        formatForOne: publicLang.LockOneItemSuccessMessage,
        formatForTwo: publicLang.LockSomeItemsSuccessMessage,
        formatForFive: publicLang.LockManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: publicLang.LockItemsNoneMessage,
        formatForOne: publicLang.LockOneItemFailMessage,
        formatForTwo: publicLang.LockSomeItemsFailMessage,
        formatForFive: publicLang.LockManyItemsFailMessage
      }
    },
    _performAction: function(status, options) {
      var self = this, node = status, newVersion = node.clone(), connector = node.container && node.container.connector || newVersion.connector;
      var deferred = $.Deferred();
      node.isLockedClicked = true;
      require([ "csui/utils/contexts/factories/user" ], function(UserModelFactory) {
        var user = options.context.getModel(UserModelFactory);
        user.ensureFetched();
        var data = {};
        newVersion.save(undefined, {
          data: data,
          type: "POST",
          wait: true,
          url: Url.combine(connector.getConnectionUrl().getApiBase("v2"), "/nodes/" + newVersion.get("id") + "/versions/" + newVersion.get("version_number") + "/lock")
        }).done(function() {
          newVersion.fetch({
            url: `${connector.getConnectionUrl().getApiBase("v2")}/nodes/${newVersion.get("id")}/versions/${newVersion.get("version_number")}?expand=user&expand=versions{id,owner_id,locked_user_id}&actions`
          }).then(function(data) {
            self.updateVersionActions(node, Object.values(data?.results?.actions?.data));
            const {
              locked,
              locked_user_id_expand,
              locked_date
            } = data?.results?.data?.versions || {};
            node.set({
              locked: locked,
              locked_user_id_expand: locked_user_id_expand,
              locked_date: locked_date
            });
          });
        }).then(deferred.resolve, deferred.reject);
      }, deferred.reject);
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
  return LockCommand;
});