/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/utils/expiration.warning/impl/expiration.warning.view", "csui/dialogs/modal.alert/modal.alert", "i18n!csui/utils/expiration.warning/impl/nls/lang", "csui/utils/log", "css!csui/utils/expiration.warning/impl/expiration.warning" ], function(module, _, $, Marionette, ExpirationWarningView, ModalAlertView, lang, log) {
  "use strict";
  log = log(module.id);
  var dialogSize = "md", displayed = false, dlgOptions, buttonsData, expirationDialog = undefined;
  function _getButtonsData(doptions) {
    var buttonArr = [];
    if (doptions.startWithWarningContent === true) {
      buttonArr.push({
        showYes: true,
        labelYes: lang.dialogExpirationWarningButtonContinueSession,
        tooltipYes: lang.dialogExpirationWarningButtonContinueSessionTooltip,
        ariaYes: lang.dialogExpirationWarningButtonContinueSessionAria,
        clickYes: function(dialog) {
          var cloptions = _.extend({
            dialogOptions: doptions
          }, {
            dialog: dialog
          });
          if (cloptions.dialogOptions.authenticator.isAuthenticated() === true) {
            cloptions.dialogOptions.cbClearExpirationTimer();
          }
          if (cloptions.dialog && !cloptions.dialog.isDestroyed) {
            cloptions.dialog.updateButtons({
              disableYes: true,
              disableNo: true
            });
          }
          cloptions.dialogOptions.cbDestroyDialog();
          log.info("expiration.warning: User continued session, performing REST-call (Date: " + cloptions.dialogOptions.userSession.currentDateUTC() + ").") && console.log(log.last);
          cloptions.dialogOptions.userSession.continueSession(cloptions.dialogOptions.authenticator);
        }
      });
      buttonArr.push({
        showNo: true,
        labelNo: lang.dialogExpirationWarningButtonTerminateSession,
        tooltipNo: lang.dialogExpirationWarningButtonTerminateSessionTooltip,
        ariaNo: lang.dialogExpirationWarningButtonTerminateSessionAria,
        clickNo: function(dialog) {
          var cloptions = _.extend({
            dialogOptions: doptions
          }, {
            dialog: dialog
          });
          cloptions.dialogOptions.cbClearExpirationTimer();
          if (cloptions.dialog && !cloptions.dialog.isDestroyed) {
            cloptions.dialog.updateButtons({
              disableNo: true,
              disableYes: true
            });
          }
          cloptions.dialogOptions.cbDestroyDialog();
          log.info("expiration.warning: User terminated session, performing signOut (Date: " + cloptions.dialogOptions.userSession.currentDateUTC() + ").") && console.log(log.last);
          cloptions.dialogOptions.userSession.signOut(cloptions.dialogOptions.authenticator);
        }
      });
    } else {
      buttonArr.push({
        showYes: true,
        labelYes: lang.dialogExpirationWarningButtonLeave,
        tooltipYes: lang.dialogExpirationWarningButtonLeaveTooltip,
        ariaYes: lang.dialogExpirationWarningButtonLeaveAria,
        clickYes: function(dialog) {
          var cloptions = _.extend({
            dialogOptions: doptions
          }, {
            dialog: dialog
          });
          cloptions.dialogOptions.cbClearExpirationTimer();
          if (cloptions.dialog && !cloptions.dialog.isDestroyed) {
            cloptions.dialog.updateButtons({
              disableYes: true
            });
          }
          log.info("expiration.warning: Redirecting to target page...'") && console.log(log.last);
          cloptions.dialogOptions.userSession.redirectToTargetPage(cloptions.dialogOptions.authenticator);
        }
      });
    }
    var i, bLen = buttonArr.length, combined = {
      showYes: false,
      showNo: false,
      showCancel: false
    };
    for (i = 0; i < bLen; i++) {
      combined = _.extend(combined, buttonArr[i]);
    }
    return combined;
  }
  function _createExpirationWarningDialog(options) {
    options || (options = {});
    var UserSession = options.userSession;
    var authenticator = options.authenticator;
    if (!authenticator) {
      log.error("expiration.warning: createExpirationWarningDialog: Given authenticator is 'undefined'!") && console.error(log.last);
    }
    var startWithWarningContent = options.startWithWarningContent && options.startWithWarningContent === true ? true : false;
    var cbClearExpirationTimer = options.clearExpirationTimer;
    var cbDestroyDialog = options.closeDialog;
    var startTime = options.startTime;
    displayed = false;
    dlgOptions = {
      userSession: UserSession,
      authenticator: authenticator,
      startWithWarningContent: startWithWarningContent,
      startTime: startTime,
      cbClearExpirationTimer: cbClearExpirationTimer,
      cbDestroyDialog: cbDestroyDialog
    };
    buttonsData = _getButtonsData(dlgOptions);
    dlgOptions = _.extend(dlgOptions, {
      buttonsData: buttonsData
    });
    expirationDialog = new ModalAlertView(_.defaults({
      dialogSize: dialogSize
    }, {
      bodyView: ExpirationWarningView,
      bodyViewOptions: {
        userSession: UserSession,
        authenticator: authenticator,
        startTime: startTime,
        startWithWarningContent: startWithWarningContent,
        cbReportExpired: function() {
          if (expirationDialog && !expirationDialog.isDestroyed) {
            expirationDialog.updateButtons({
              disableNo: true,
              disableYes: true
            });
          }
          log.debug("expiration.warning: Timeout warning dialog reported that it has reached 0 (Date: " + UserSession.currentDateUTC() + ").") && console.log(log.last);
        }
      },
      title: lang.dialogExpirationWarningTitle,
      showTitleCloseButton: false,
      staticBackdrop: true,
      closeWithEsc: false,
      buttons: buttonsData
    }, ModalAlertView.defaultOptions.Warning));
    return expirationDialog;
  }
  function _showExpirationWarningDialog(dialog) {
    var deferred = $.Deferred();
    log.debug("expiration.warning: _showExpirationWarningDialog: setting displayed to true.") && console.log(log.last);
    displayed = true;
    dialog.show().then(function success(result) {
      buttonsData.clickYes(dialog);
      deferred.resolve(result);
    }, function failure(result) {
      if (result === false) {
        buttonsData.clickNo(dialog);
      }
      deferred.reject(result);
    }).always(function() {
      log.debug("expiration.warning: _showExpirationWarningDialog: setting displayed to false.") && console.log(log.last);
      displayed = false;
    });
    return deferred.promise();
  }
  function showExpirationWarningDialog(doptions) {
    var expWarnDlg = _createExpirationWarningDialog(doptions);
    return {
      promise: _showExpirationWarningDialog(expWarnDlg),
      expWarnDlg: expWarnDlg
    };
  }
  function isDisplayed() {
    return displayed;
  }
  function destroyDialog(dialog) {
    log.debug("expiration.warning: destroyDialog: called...") && console.log(log.last);
    if (dialog) {
      log.info("expiration.warning: destroyDialog: destroying dialog") && console.log(log.last);
      dialog.destroy();
    }
    displayed = false;
    dialog = undefined;
    return undefined;
  }
  function resetStartTime(dialog, doptions) {
    log.info("expiration.warning: resetStartTime: setting start time to '" + doptions.startTime + "' secs.") && console.log(log.last);
    if (dialog) {
      log.debug("expiration.warning: resetStartTime: creating new view and showing in 'bodyRegion'...") && console.log(log.last);
      var bodyView = new ExpirationWarningView(doptions);
      dialog.showChildView("bodyRegion", bodyView);
      dialog.updateButtons({
        disableNo: false,
        disableYes: false
      });
    }
  }
  function triggerClearTimer(dialog) {
    if (dialog) {
      log.debug("expiration.warning: triggerClearTimer: Sending event 'clear:timer' to expiration warning dialog...") && console.log(log.last);
      dialog.triggerMethod("clear:timer", "someValue");
    } else {
      log.debug("expiration.warning: triggerClearTimer: Skipping sending event 'clear:timer' to expiration warning dialog, because dialog is already destroyed.") && console.log(log.last);
    }
  }
  return {
    showExpirationWarningDialog: showExpirationWarningDialog,
    isDisplayed: isDisplayed,
    destroyDialog: destroyDialog,
    triggerClearTimer: triggerClearTimer,
    resetStartTime: resetStartTime
  };
});