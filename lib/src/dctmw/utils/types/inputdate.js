/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "nuc/lib/underscore", "nuc/lib/moment" ], function(require, module, _, moment) {
  "use strict";
  const config = _.extend({
    friendlyDateTime: true,
    friendlyTime: true,
    friendlyDate: true,
    formatIsoDateTimeInUtc: false,
    formatIsoDateTimeInTimeZone: undefined
  }, require.moduleConfig("nuc/utils/base"), module.config());
  var momentDateFormat = config.dateInputFormat || "L", momentTimeFormat = config.timeInputFormat || "LTS", momentDateTimeFormat = config.dateTimeInputFormat || momentDateFormat + " " + momentTimeFormat, exactDateInputFormat = getExactFormat(momentDateFormat), exactTimeInputFormat = getExactFormat(momentTimeFormat), exactDateTimeInputFormat = getExactFormat(momentDateTimeFormat);
  function getExactFormat(momentFormat) {
    var formatters = /\w+/g, explicitFormat = momentFormat, shift = 0, match, part, partFormat, index;
    while (match = formatters.exec(momentFormat)) {
      part = match[0];
      partFormat = moment.localeData().longDateFormat(part);
      if (partFormat) {
        index = match.index + shift;
        explicitFormat = explicitFormat.substring(0, index) + partFormat + explicitFormat.substring(index + part.length);
        shift += partFormat.length - part.length;
      }
    }
    return explicitFormat !== momentFormat ? getExactFormat(explicitFormat) : explicitFormat;
  }
  function createMoment(text) {
    function includesTimeZone(text) {
      var length = text.length;
      if (length > 19) {
        if (text.charAt(length - 1) === "Z") {
          return true;
        }
        var direction = text.charAt(length - 5);
        if (direction === "+" || direction === "-") {
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
    return config.formatIsoDateTimeInTimeZone && !includesTimeZone(text) ? moment.tz(text, config.formatIsoDateTimeInTimeZone) : moment(text);
  }
  function formatExactDateInput(date) {
    return date ? createMoment(date).format(exactDateInputFormat) : "";
  }
  function formatExactTimeInput(date) {
    return date ? createMoment(date).format(exactTimeInputFormat) : "";
  }
  function formatExactDateTimeInput(date) {
    return date ? createMoment(date).format(exactDateTimeInputFormat) : "";
  }
  return {
    exactDateInputFormat: exactDateInputFormat,
    exactTimeFormat: exactTimeInputFormat,
    exactDateTimeInputFormat: exactDateTimeInputFormat,
    formatExactDateInput: formatExactDateInput,
    formatExactTimeInput: formatExactTimeInput,
    formatExactDateTimeInput: formatExactDateTimeInput
  };
});