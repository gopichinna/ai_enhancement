/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "dctmw/utils/rest.resources", "d2/commands/mip/reset.config", "csui/models/command", "d2/controls/globalmessage/globalmessage", "dctmw/utils/utils", "i18n!d2/widgets/admin/mip.config/impl/nls/lang" ], function(require, $, _, Backbone, RestResources, ResetConfig, CommandModel, GlobalMessage, Utils, lang) {
  "use strict";
  const SaveConfig = CommandModel.extend({
    defaults: {
      signature: "Mip-SaveConfig",
      command_key: "Mip-SaveConfig",
      name: lang.commandMipSaveConfig,
      scope: "single"
    },
    enabled: function() {
      return true;
    },
    execute: function(status) {
      const dfd = $.Deferred();
      require([ "d2/utils/contexts/factories/mip.config.model.factory" ], MipConfigModelFactory => {
        const context = status.context;
        status.configModel = status.configModel || context.getModel(MipConfigModelFactory);
        let configModel = status.configModel;
        delete configModel.attributes["is_enabled"];
        let changedAttr = this._findDifference(configModel);
        configModel.save(changedAttr, {
          patch: !configModel.isNew()
        }).done(function() {
          GlobalMessage.showMessage("success", lang.saveSuccessMessage);
          dfd.resolve;
        }).fail(function(xhr) {
          let errDetails = Utils.parseAjaxError(xhr);
          GlobalMessage.showMessage("error", errDetails.message, errDetails.details);
          dfd.reject;
        });
      }, dfd.reject);
      return dfd.promise();
    },
    _findDifference: function(configModel) {
      let changeAttribute = {};
      Object.keys(configModel.attributes).forEach(key => {
        if (!_.isEqual(configModel.getServerAttribute(key), configModel.attributes[key])) {
          changeAttribute[key] = configModel.attributes[key];
        }
      });
      return changeAttribute;
    }
  });
  return SaveConfig;
});