/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['module', 'nuc/utils/log', 'nuc/utils/namedstorage'], function (module, log, NamedStorage) {
  if (sessionStorage === undefined) {
    log.warn(
      'Session storage is not available.' +
        '  Some information will not be able to save temporarily;' +
        ' authenticated state, for example.'
    ) && console.warn(log.last);
  }

  var NamedSessionStorage = NamedStorage.extend({
    constructor: function NamedSessionStorage(name) {
      NamedStorage.prototype.constructor.call(this, sessionStorage, name);
    }
  });

  NamedSessionStorage.version = '1.0';

  return NamedSessionStorage;
});
