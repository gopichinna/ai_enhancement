/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define({
  // base
  ColumnMemberName2: '{1} {0}',
  ColumnMemberName3: '{1} {2} {0}',
  sizeInBytes: '{0} bytes',

  // errormessage, messagehelper
  ErrorUnknown: 'Unknown error.',
  InvalidResponse: 'Invalid response received.',
  ErrorStatusConfirm: 'Confirm',
  ErrorStatusError: 'Error',
  ErrorStatusWarning: 'Warning',
  ErrorStatusHint: 'Hint',
  ErrorStatusInformation: 'Information',
  ErrorHtmlTpl: "<span class='msgIcon <%= statusPlain %>Icon'><%= statusNice %>: <%= msg %></span><br>",
  ErrorStringTpl: '<%= statusNice %>: <%= msg %>;\n',

  // connector
  AuthenticationFailureDialogTitle: 'Authentication failure',
  SessionExpiredDialogTitle: 'Session expired',
  AuthenticationFailureDialogText: 'The page will be reloaded and you may need to sign in again.',

  NetworkError: 'Network communication failed.',
  resourceConflict:
    'Due to an edit conflict, your changes could not be saved. Another user has changed the same object. Reload the page to reflect the latest changes.'
});
