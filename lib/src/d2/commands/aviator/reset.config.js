/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "csui/models/command", "i18n!d2/commands/nls/localized.strings" ], function(require, $, CommandModel, lang) {
  "use strict";
  const ResetConfig = CommandModel.extend({
    defaults: {
      signature: "Aviator-ResetConfig",
      command_key: "Aviator-ResetConfig",
      name: lang.CommandAviatorResetConfig,
      scope: "single"
    },
    enabled: function() {
      return true;
    },
    execute: function(status) {
      const dfd = $.Deferred();
      require([ "d2/utils/contexts/factories/aviator.config.model.factory", "d2/utils/contexts/factories/aviator.assignments.collection.factory" ], function(AviatorConfigModelFactory, AviatorAssignmentsCollectionFactory) {
        const context = status.context;
        const configModel = status.container || context.getModel(AviatorConfigModelFactory);
        const assignmentsCollection = status.collection || context.getCollection(AviatorAssignmentsCollectionFactory);
        configModel.fetch({
          reload: true,
          skipSWCache: true
        }).then(() => {
          return assignmentsCollection.fetch({
            reload: true,
            skipSWCache: true
          });
        }).done(dfd.resolve).fail(dfd.reject);
      }, dfd.reject);
      return dfd.promise();
    }
  });
  return ResetConfig;
});