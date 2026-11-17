/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "smart/dialogs/modal.alert/modal.alert", "csui/models/command", "dctmw/utils/client.location", "dctmw/utils/persistent.store", "dctmw/utils/utils", "i18n!dctmw/commands/nls/lang" ], function(_, $, ModalAlert, CommandModel, clientLocation, persistentStore, utils, lang) {
  "use strict";
  const CMDResetUserPersonalizations = CommandModel.extend({
    defaults: {
      signature: "D4-ResetUserPersonalization",
      name: lang.CMDResetUserPersonalizations
    },
    enabled() {
      return true;
    },
    execute(status) {
      status.suppressSuccessMessage = true;
      status.suppressFailMessage = true;
      const dfd = $.Deferred();
      this.showConfirmationDialog().fail(dfd.reject).done(() => {
        persistentStore.resetStore().fail(e => {
          console.log(`Failed resetting user personalization due to ${e}`);
          dfd.reject();
        }).done(() => {
          clientLocation.reload();
        });
      });
      return dfd.promise();
    },
    showConfirmationDialog() {
      const dfd = $.Deferred();
      ModalAlert.confirmWarning(lang.CMDRUPConfirmationAlertMessage, lang.CMDResetUserPersonalizations, {
        buttons: {
          labelYes: lang.CMDRUPConfirmationYesLabel,
          labelNo: lang.CMDRUPConfirmationNoLabel
        }
      }).done(dfd.resolve).fail(dfd.reject);
      return dfd.promise();
    }
  });
  return CMDResetUserPersonalizations;
});