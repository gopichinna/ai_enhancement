/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'csui/dialogs/modal.alert/modal.alert'
], function (ModalAlertImpl) {
  'use strict';

  /**
   * Shows a modal alert.
   *
   * Different static methods could be used to show different type of modal alerts.
   *
   * @example <caption>A sample invocation to show a confirmation alert</caption>
   * define([
   *  'd2/sdk/controls/modal.alert'
   * ], function(ModalAlert){
   *  'use strict';
   *
   *  var buttonOptions = {
   *    showYes: true,
   *    labelYes: 'Ok',
   *    showNo: false,
   *    showCancel: true,
   *    labelCancel: 'Cancel'
   *  };
   *
   *  ModalAlert.confirmQuestion(function(result){
   *    if(result) {
   *      console.log('Clicked OK');
   *    } else {
   *      console.log('Clicked Cancel');
   *    }
   *  }, 'sample message', 'Sample Title', {
   *     buttons: buttonOptions
   *  });
   * });
   *
   * @module {d2/sdk/controls/modal.alert} d2/sdk/controls/"modal.alert"
   * @name ModalAlert
   * @extends {external:Marionette.View}
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */
  function showModal(options) {
    var alert = new ModalAlert(options);
    return alert.show();
  }

  var ModalAlert = ModalAlertImpl.extend({
    constructor: function ModalAlert(options) {
      options = options || {};
      ModalAlert.__super__.constructor.call(this, options);
    }
  }, {
    _show: showModal,

    /**
     * A few pre-configured button options to ease up modal creation with preset
     * @memberOf module:ModalAlert
     * @todo Describe different button options
     */
    ButtonOptions: Object.freeze(ModalAlertImpl.buttons),

    /**
     * Callback type invoked, when the modal dissolves.
     *
     * @callback AlertDissolveCallback
     * @param {boolean|undefined} result - `true` indicates 'Yes' button, `false` indicates 'No' and `undefined` indicates the modal was cancelled.
     * @returns {void}
     */

    /**
     * Return type. Associated `jQuery.Promise` instance is  `resolve()`-ed or `reject()`-ed to indicate whether user pressed 'Yes' or some other button respectively.
     * @typedef {jQuery.Promise} PromiseReturnType
     */

    /**
     * Customize modal's title, message, button labels and configuration
     * @typedef {Object} OptionsType
     * @todo Enumerate different properties
     */

    /**
     * Shows a success modal alert
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    showSuccess: function (callback, message, title, options) {
      return ModalAlertImpl.showSuccess(callback, message, title, options);
    },

    /**
     * Shows a info modal alert
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    showInformation: function (callback, message, title, options) {
      return ModalAlertImpl.showInformation(callback, message, title, options);
    },

    /**
     * Shows a warning modal alert
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    showWarning: function (callback, message, title, options) {
      return ModalAlertImpl.showWarning(callback, message, title, options);
    },

    /**
     * Shows an error modal alert
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    showError: function (callback, message, title, options) {
      return ModalAlertImpl.showError(callback, message, title, options);
    },

    /**
     * Shows a generic modal alert without associating with a type
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    showMessage: function (callback, message, title, options) {
      return ModalAlertImpl.showMessage(callback, message, title, options);
    },

    /**
     * Shows an interrogative modal alert representing success
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    confirmSuccess: function (callback, message, title, options) {
      return ModalAlertImpl.confirmSuccess(callback, message, title, options);
    },

    /**
     * Shows an interrogative modal alert representing information
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    confirmInformation: function (callback, message, title, options) {
      return ModalAlertImpl.confirmInformation(callback, message, title, options);
    },

    /**
     * Shows an interrogative modal alert representing warning
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    confirmWarning: function (callback, message, title, options) {
      return ModalAlertImpl.confirmWarning(callback, message, title, options);
    },

    /**
     * Shows an interrogative modal alert representing error
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    confirmError: function (callback, message, title, options) {
      return ModalAlertImpl.confirmError(callback, message, title, options);
    },

    /**
     * Shows a generic interrogative modal alert
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    confirmQuestion: function (callback, message, title, options) {
      return ModalAlertImpl.confirmQuestion(callback, message, title, options);
    },

    /**
     * Shows a generic interrogative modal alert representing a message
     * @param {AlertDissolveCallback} [callback] - Executed with a hint about user interaction.
     * @param {string} [message] - The message to be shown.
     * @param {string} [title] - Title of the alert.
     * @param {OptionsType} [options] - A single option hash to customize the modal title, message & button options
     * @returns {PromiseReturnType}
     * @memberOf module:ModalAlert
     */
    confirmMessage: function (callback, message, title, options) {
      return ModalAlertImpl.confirmMessage(callback, message, title, options);
    }
  });

  return ModalAlert;
});