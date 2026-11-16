/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "nuc/lib/underscore", "nuc/lib/moment", "nuc/utils/types/date" ], function(require, module, _, moment, nucDate) {
  "use strict";
  const config = _.extend({
    friendlyDateTime: true,
    friendlyTime: true,
    friendlyDate: true,
    formatIsoDateTimeInUtc: false,
    formatIsoDateTimeInTimeZone: undefined
  }, require.moduleConfig("nuc/utils/base"), module.config());
  var momentDateFormat = config.dateFormat || "L", momentTimeFormat = config.timeFormat || "LTS", momentDateTimeFormat = config.dateTimeFormat || momentDateFormat + " " + momentTimeFormat, exactDateFormat = getExactFormat(momentDateFormat), exactTimeFormat = getExactFormat(momentTimeFormat), exactDateTimeFormat = getExactFormat(momentDateTimeFormat);
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
  var origSerializeDate = nucDate.serializeDate, origSerializeDateTime = nucDate.serializeDateTime;
  nucDate.serializeDate = function(date, format, callback) {
    format = format || exactDateFormat;
    return origSerializeDate(date, format, callback);
  };
  nucDate.serializeDateTime = function(date, format, callback) {
    format = format || exactDateTimeFormat;
    return origSerializeDateTime(date, format, callback);
  };
  nucDate.formatExactDate = function(date) {
    return date ? createMoment(date).format(exactDateFormat) : "";
  };
  nucDate.formatExactTime = function(date) {
    return date ? createMoment(date).format(exactTimeFormat) : "";
  };
  nucDate.formatExactDateTime = function(date) {
    return date ? createMoment(date).format(exactDateTimeFormat) : "";
  };
  nucDate.exactDateFormat = exactDateFormat;
  nucDate.exactTimeFormat = exactTimeFormat;
  nucDate.exactDateTimeFormat = exactDateTimeFormat;
  nucDate.getExactFormat = getExactFormat;
});