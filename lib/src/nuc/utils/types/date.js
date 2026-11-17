/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['require', 'module', 'nuc/lib/underscore', 'nuc/lib/moment', 'nuc/lib/moment-timezone'], function (
  require,
  module,
  _,
  moment
) {
  'use strict';

  const config = _.extend(
    {
      friendlyDateTime: true,
      friendlyTime: true,
      friendlyDate: true,
      formatIsoDateTimeInUtc: false,
      formatIsoDateTimeInTimeZone: undefined
    },
    require.moduleConfig('nuc/utils/base'),
    module.config()
  );

  var momentDateFormat = config.dateFormat || 'L',
    momentTimeFormat = config.timeFormat || 'LTS',
    momentDateTimeFormat = config.dateTimeFormat || momentDateFormat + ' ' + momentTimeFormat,
    exactDateFormat = getExactFormat(momentDateFormat),
    exactTimeFormat = getExactFormat(momentTimeFormat),
    exactDateTimeFormat = getExactFormat(momentDateTimeFormat);

  // Moment's longDateFormat need the formatting parts like "L" otr "LTS"
  // separately; it does not accept a combined string
  function getExactFormat(momentFormat) {
    var formatters = /\w+/g,
      explicitFormat = momentFormat,
      shift = 0,
      match,
      part,
      partFormat,
      index;
    while ((match = formatters.exec(momentFormat))) {
      part = match[0];
      partFormat = moment.localeData().longDateFormat(part);
      // Skip words in the format, which are not moment's tokens
      if (partFormat) {
        index = match.index + shift;
        explicitFormat =
          explicitFormat.substring(0, index) + partFormat + explicitFormat.substring(index + part.length);
        shift += partFormat.length - part.length;
      }
    }
    // If the format was expanded, try it once more, in case moment
    // placeholders were used recursively like "LT:ss"
    return explicitFormat !== momentFormat ? getExactFormat(explicitFormat) : explicitFormat;
  }

  // static helper methods

  function pad(n) {
    return n < 10 ? '0' + n : n;
  }

  // Creates a new moment object in the local (client) time zone
  // from a string in the ISO 8601 format sent by the server, or
  // from a Date object instance, or from a Moment instance.
  function createMoment(text) {
    // Checks if the text, which should be in the ISO 8601 format,
    // ends with the UTC identifier or a time zone offset.
    function includesTimeZone(text) {
      var length = text.length;
      if (length > 19) {
        if (text.charAt(length - 1) === 'Z') {
          return true;
        }
        var direction = text.charAt(length - 5);
        if (direction === '+' || direction === '-') {
          return true;
        }
      }
    }

    if (text instanceof moment) {
      return text;
    }
    if (text instanceof Date) {
      return moment(text);
    }
    return config.formatIsoDateTimeInTimeZone && !includesTimeZone(text)
      ? moment.tz(text, config.formatIsoDateTimeInTimeZone)
      : moment(text);
  }

  // Parses the text in the ISO 8601 format as sent by the server
  // to a Date object instance in the local (client) time zone.
  function deserializeDate(text) {
    return text && createMoment(text).toDate();
  }

  // Formats the date in the local (client) time zone to a sub-set
  // of ISO 8601 for the server.
  function serializeDateTime(date, format, callback) {
    function formatDateTime(date, suffix) {
      // CS does not accept te standard ISO value returned
      // by toISOString, which includes milliseconds.
      return (
        date.year() +
        '-' +
        pad(date.month() + 1) +
        '-' +
        pad(date.date()) +
        'T' +
        pad(date.hours()) +
        ':' +
        pad(date.minutes()) +
        ':' +
        pad(date.seconds()) +
        suffix
      );
    }

    format || (format = exactDateTimeFormat);
    var parsed = moment(date, format, true);
    if (!parsed.isValid()) {
      if (callback) {
        callback();
      } else {
        throw new Error('Parsing date value "' + date + '" as "' + format + '" failed.');
      }
    }

    if (config.formatIsoDateTimeInUtc) {
      return formatDateTime(parsed.utc(), 'Z');
    }

    if (config.formatIsoDateTimeInTimeZone) {
      return formatDateTime(parsed.tz(config.formatIsoDateTimeInTimeZone), '');
    }

    return formatDateTime(parsed, '');
  }

  // Formats the date to a sub-set of ISO 8601 - only the date part.
  function serializeDate(date, format, callback) {
    format || (format = exactDateFormat);
    var parsed = moment(date, format, true);
    if (!parsed.isValid()) {
      if (callback) {
        callback();
      } else {
        throw new Error('Parsing date value "' + date + '" as "' + format + '" failed.');
      }
    }
    return parsed.year() + '-' + pad(parsed.month() + 1) + '-' + pad(parsed.date());
  }

  function validateDate(date, format) {
    return moment(date, format || exactDateFormat, true).isValid();
  }

  function validateDateTime(date, format) {
    return moment(date, format || exactDateTimeFormat, true).isValid();
  }

  function formatDate(date) {
    return config.friendlyDate ? formatFriendlyDate(date) : formatExactDate(date);
  }

  function formatDateTime(date) {
    return config.friendlyDateTime ? formatFriendlyDateTime(date) : formatExactDateTime(date);
  }

  function formatExactDate(date) {
    return date ? createMoment(date).format(exactDateFormat) : '';
  }

  function formatExactTime(date) {
    return date ? createMoment(date).format(exactTimeFormat) : '';
  }

  function formatExactDateTime(date) {
    return date ? createMoment(date).format(exactDateTimeFormat) : '';
  }

  function formatFriendlyDate(date) {
    return date ? createMoment(date).calendar() : '';
  }

  function formatFriendlyDateTime(date) {
    return date ? createMoment(date).calendar() : '';
  }

  function formatFriendlyDateTimeNow(date) {
    return date ? createMoment(date).fromNow() : '';
  }

  function formatISODate(date) {
    return date ? moment.utc(date).toISOString() : '';
  }

  function formatISODateTime(date) {
    return date ? moment(date).toISOString() : '';
  }

  return {
    exactDateFormat: exactDateFormat,
    exactTimeFormat: exactTimeFormat,
    exactDateTimeFormat: exactDateTimeFormat,

    deserializeDate: deserializeDate,
    serializeDate: serializeDate,
    serializeDateTime: serializeDateTime,

    validateDate: validateDate,
    validateDateTime: validateDateTime,

    formatDate: formatDate,
    formatDateTime: formatDateTime,
    formatExactDate: formatExactDate,
    formatExactTime: formatExactTime,
    formatExactDateTime: formatExactDateTime,
    formatFriendlyDate: formatFriendlyDate,
    formatFriendlyDateTime: formatFriendlyDateTime,
    formatFriendlyDateTimeNow: formatFriendlyDateTimeNow,
    formatISODateTime: formatISODateTime,
    formatISODate: formatISODate
  };
});
