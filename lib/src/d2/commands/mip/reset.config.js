/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "csui/models/command", "i18n!d2/widgets/admin/mip.config/impl/nls/lang" ], function(require, $, CommandModel, lang) {
  "use strict";
  const ResetConfig = CommandModel.extend({
    defaults: {
      signature: "Mip-ResetConfig",
      command_key: "Mip-ResetConfig",
      name: lang.commandMipResetConfig,
      scope: "single"
    },
    enabled: function() {
      return true;
    },
    execute: function(status) {
      const dfd = $.Deferred();
      require([ "d2/utils/contexts/factories/mip.config.model.factory" ], function(MipConfigModelFactory) {
        const context = status.context;
        const configModel = status.container || context.getModel(MipConfigModelFactory);
        configModel.reset({
          silent: false
        }).done(dfd.resolve).fail(dfd.reject);
      }, dfd.reject);
      return dfd.promise();
    }
  });
  return ResetConfig;
});