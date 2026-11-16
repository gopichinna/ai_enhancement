/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/utils/log" ], function(module, _, $, log) {
  "use strict";
  log = log(module.id);
  var singleton = function() {
    var ExpirationWarningDlg = undefined;
    function isDisplayed() {
      return !!(ExpirationWarningDlg && ExpirationWarningDlg.isDisplayed());
    }
    function resetStartTime(timeSecs) {
      if (ExpirationWarningDlg) {
        ExpirationWarningDlg.resetStartTime(timeSecs);
      }
    }
    function closeDialog() {
      if (ExpirationWarningDlg) {
        ExpirationWarningDlg.closeDialog();
      }
    }
    function showExpirationWarningDialog(dlgOptions) {
      var deferred = $.Deferred();
      require([ "csui/utils/expiration.warning/expiration.warning.dialog" ], function(ExpWrnDlg) {
        ExpirationWarningDlg = ExpWrnDlg;
        ExpirationWarningDlg.showExpirationWarningDialog(dlgOptions).then(function success(result) {
          deferred.resolve(result);
        }, function failure(result) {
          deferred.reject(result);
        });
      });
      return deferred.promise();
    }
    return {
      showExpirationWarningDialog: showExpirationWarningDialog,
      isDisplayed: isDisplayed,
      resetStartTime: resetStartTime,
      closeDialog: closeDialog
    };
  };
  return singleton();
});