/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/models/command", "csui/utils/commandhelper", "dctmw/utils/rest.resources", "d2/dialogs/add.version/add.version.manager", "d2/utils/concurrency.manager", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, Backbone, CommandModel, CommandHelper, RestResources, AddVersionManager, ConcurrencyManager, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "AddVersion",
      command_key: "AddVersion",
      name: lang.CommandNameAddVersion,
      scope: "single",
      resetToolbar: true,
      verb: lang.CommandVerbAddVersion
    },
    enabled: function(status, options) {
      var enabled = CommandModel.prototype.enabled.call(this, status, options);
      var node = CommandHelper.getJustOneNode(status);
      if (node) {
        var currentLoggedInUserId = RestResources.getCurrentUser().id;
        var reservedUserId = node.get("reserved_user_id");
        if (reservedUserId && currentLoggedInUserId !== reservedUserId) {
          enabled = false;
        }
        if (node?.get("id")?.indexOf("81") === 0) {
          enabled = false;
        }
      }
      return enabled;
    },
    execute: function(status, options) {
      options = options || {};
      var deferred = $.Deferred(), secondaryPromise = $.Deferred();
      options.context = options.context || status.context;
      if (options.disableConcurrentProcess !== true) {
        if (ConcurrencyManager.isProcessPending(CommandHelper.getAtLeastOneNode(status))) {
          return $.Deferred().resolve().promise();
        }
        ConcurrencyManager.listenForProcessMinimize(status, options, this).always(() => {
          deferred.resolve(secondaryPromise);
        });
      }
      var addVersionManager = new AddVersionManager(status, options, this);
      addVersionManager.execute().done((...args) => {
        deferred.resolve.apply(deferred, args);
        secondaryPromise.resolve.apply(secondaryPromise, args);
      }).fail((...args) => {
        deferred.reject.apply(deferred, args);
        secondaryPromise.reject.apply(secondaryPromise, args);
      });
      return deferred.promise();
    }
  });
});