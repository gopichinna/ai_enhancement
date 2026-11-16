/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['require', 'module', 'nuc/lib/underscore', 'nuc/lib/numeral', 'i18n!nuc/utils/impl/nls/lang'], function (
  require,
  module,
  _,
  numeral,
  lang
) {
  'use strict';

  const config = _.extend(
    {
      friendlyFileSize: true
    },
    require.moduleConfig('nuc/utils/base'),
    module.config()
  );

  // Number.MAX_SAFE_INTEGER and Number.MIN_SAFE_INTEGER are not available in IE
  var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
  var MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER || -9007199254740991;

  function formatInteger(value, format) {
    format || '0';
    return numeral(value).format(format);
  }

  function formatIntegerWithCommas(value) {
    return formatInteger(value, '0,0');
  }

  function formatFileSize(size) {
    return config.friendlyFileSize ? formatFriendlyFileSize(size) : formatExactFileSize(size);
  }

  function formatFriendlyFileSize(size) {
    if (!_.isNumber(size)) {
      return '';
    }
    return size >= 1024 ? numeral(size).format('0 b') : formatExactFileSize(size);
  }

  function formatExactFileSize(size) {
    if (!_.isNumber(size)) {
      return '';
    }
    size = formatIntegerWithCommas(size);
    return _.str.sformat(lang.sizeInBytes, size);
  }

  return {
    formatInteger: formatInteger,
    formatIntegerWithCommas: formatIntegerWithCommas,

    formatFileSize: formatFileSize,
    formatFriendlyFileSize: formatFriendlyFileSize,
    formatExactFileSize: formatExactFileSize,
    MAX_SAFE_INTEGER: MAX_SAFE_INTEGER,
    MIN_SAFE_INTEGER: MIN_SAFE_INTEGER
  };
});
