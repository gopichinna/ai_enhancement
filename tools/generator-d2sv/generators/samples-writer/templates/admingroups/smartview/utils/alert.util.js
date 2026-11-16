define([
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'd2/sdk/controls/alerts/modal.alert'
], function($, _, ModalAlert){
  'use strict';

  function showConfirmationAlert(title, message, yesButtonLabel, cancelButtonLabel, hasTitle) {
    var dfd = $.Deferred(), buttonOptions = {
      showYes: true,
      labelYes: yesButtonLabel,
      showNo: false,
      showCancel: true
    };

    hasTitle = _.isBoolean(hasTitle) ? hasTitle : false;

    if (_.isString(cancelButtonLabel) && !_.isEmpty(cancelButtonLabel)) {
      buttonOptions['labelCancel'] = cancelButtonLabel;
    }

    ModalAlert.confirmQuestion(function (result) {
      if (result) {

        dfd.resolve();
      } else {
        dfd.reject('cancel');
      }
    }, (hasTitle ? message : ''), (hasTitle ? title : message), {
      buttons: buttonOptions
    });

    return dfd.promise();
  }

  return {
    showConfirmationAlert: showConfirmationAlert
  };
});