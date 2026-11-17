/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/utils/expiration.warning/impl/expiration.warning.dialog", "csui/utils/log" ], function(module, _, ExpirationWarningDlg, log) {
  "use strict";
  log = log(module.id);
  var singleton = function() {
    var dlgResult;
    var expWarnDlgOptions;
    function _init() {
      dlgResult = undefined;
      expWarnDlgOptions = undefined;
    }
    function isDisplayed() {
      return !!(dlgResult && ExpirationWarningDlg.isDisplayed());
    }
    function resetStartTime(timeSecs) {
      if (dlgResult && ExpirationWarningDlg) {
        _.extend(expWarnDlgOptions, {
          startTime: timeSecs
        });
        ExpirationWarningDlg.resetStartTime(dlgResult.expWarnDlg, expWarnDlgOptions);
      }
    }
    function closeDialog() {
      if (dlgResult && isDisplayed()) {
        log.info("expiration.warning.dialog: close dialog...") && console.log(log.last);
        ExpirationWarningDlg.destroyDialog(dlgResult.expWarnDlg);
      }
      _init();
    }
    function triggerClearTimer() {
      if (dlgResult && isDisplayed()) {
        log.info("expiration.warning.dialog: triggering 'clear:timer' event on dialog...") && console.log(log.last);
        ExpirationWarningDlg.triggerClearTimer(dlgResult.expWarnDlg);
      }
    }
    function showExpirationWarningDialog(dlgOptions) {
      if (!dlgResult || !dlgResult.expWarnDlg) {
        expWarnDlgOptions = dlgOptions;
        dlgResult = ExpirationWarningDlg.showExpirationWarningDialog(dlgOptions);
        return dlgResult.promise;
      } else {
        return dlgResult.promise;
      }
    }
    _init();
    return {
      showExpirationWarningDialog: showExpirationWarningDialog,
      isDisplayed: isDisplayed,
      resetStartTime: resetStartTime,
      triggerClearTimer: triggerClearTimer,
      closeDialog: closeDialog
    };
  };
  return singleton();
});