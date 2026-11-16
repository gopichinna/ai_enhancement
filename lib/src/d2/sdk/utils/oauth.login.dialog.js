/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'dctmw/dialogs/authentication/oauth.login.dialog'
], function(OAuthLoginDialogImpl){
  'use strict';

  /**
   * Authenticate with an external IDP using OAuth2 and acquire access token. Requires popup to be enabled in browser.
   *
   * @example <caption>A sample authentication with OTDS could look like</caption>
   * define([
   *    'd2/sdk/utils/contexts/context.utils',
   *    'd2/sdk/utils/contexts/factories/connector'
   *    'd2/sdk/utils/oauth.login.dialog'
   * ], function(contextUtil, ConnectorFactory, OAuthLoginDialog){
   *    'use strict';
   *
   *    var dlg = new OAuthLoginDialog({
   *      connector: contextUtil.getPerspectiveContext().getObject(ConnectorFactory),
   *      url: 'https://<OTDS_SERVER_IP>:8443/otdsws/oauth2/auth',
   *      clientId: 'sample_system',
   *      strings: {
   *        title: 'Sign in to Sample System', //could be localized using i18n
   *        authError: 'Authentication failed for Sample System' //could be localized using i18n
   *      }
   *    });
   *
   *    dlg
   *      .login()
   *      .then(function(accessToken, expiresIn){
   *        console.log('Acquired token:' + accessToken + ' that is valid for ' + expiresIn + ' ms.'); //Even though console logging sensitive data is a bad idea, but it's always handy for a code snippet :-)
   *      })
   *      .catch(function(){
   *        console.log('Auth failed');
   *      });
   * });
   *
   * @module {d2/sdk/utils/oauth.login.dialog} d2/sdk/utils/"oauth.login.dialog"
   * @name OAuthLoginDialog
   * @extends {Object}
   */

  /**
   * @constructs
   * @alias module:OAuthLoginDialog
   * @param {object} options - Construction options holder
   * @param {Connector} options.connector - AJAX transport. See {@link ./contexts/factories/connector|Connector}.
   * @param {string} options.url - Base URL of IDP
   * @param {string} options.clientId - Client ID of the system for which token is being requested.
   * @param {Object.<string, string>} [options.strings] - To control different displayable labels associated with the dialog.
   * @param {string} [options.strings.title] - Login dialog's title.
   * @param {string} [options.strings.message] - Login dialog's message.
   * @param {string} [options.strings.cancelBtn] - Login dialog's Cancel button label.
   * @param {string} [options.strings.authError] - Message to be shown if authentication fails.
   * @param {string} [options.strings.popupTitle] - Alert dialog's title if popup is disabled.
   * @param {string} [options.strings.popupWarning] - Alert dialog's message if popup is disabled.
   *
   * @throws Error if any of `options.connector` & `options.url` is missing.
   */
  var OAuthLoginDialog = function OAuthLoginDialog(options) {
    options = options || {};
    this._oAuthDialogImpl = new OAuthLoginDialogImpl(options);
  };

  /**
   * Perform login to the external IDP. It checks existence of a valid access token first, if not found then login screen is shown.
   * @returns {jQyery.Promise} resolves and invokes `OAuthLoginSuccessCallback` on successful login, rejects otherwise
   */
  OAuthLoginDialog.prototype.login = function() {
    return this._oAuthDialogImpl.login();
  };

  /**
   * @callback OAuthLoginSuccessCallback
   * @param {string} accessToken - The access token
   * @param {number} expiresIn - Token expiration time in milliseconds.
   */

  return OAuthLoginDialog;
});