/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "csui/utils/contexts/factories/connector", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, CommandModel, ConnectorFactory, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-UserSettings",
      name: lang.CommandNameUserSettings,
      scope: "single"
    },
    execute: function(status) {
      var deferred = $.Deferred();
      require([ "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/user.settings/user.settings.dialog.view" ], function(StepperWizard, UserSettingsDialogView) {
        var context = status.context, userSettingsData = {}, connector = context.getObject(ConnectorFactory), wizard = new StepperWizard({
          className: "d2-user-settings",
          suppressHeader: true,
          suppressFooter: true,
          showPageLeavingWarning: false,
          steps: [ {
            id: "userSettings",
            nextStepId: function() {
              return "finish";
            },
            viewClass: UserSettingsDialogView
          } ],
          data: {
            context: context,
            connector: connector,
            userSettingsData: userSettingsData
          }
        });
        wizard.show().on("wizard:closed", function(isCancel) {
          if (isCancel) {
            deferred.reject();
            if (userSettingsData["forceRefresh"] === true) {
              window.location.reload();
            }
          } else {
            deferred.resolve();
          }
        });
      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise();
    }
  });
});