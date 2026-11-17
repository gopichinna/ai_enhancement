/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/moment", "nuc/utils/log" ], function(module, moment, log) {
  "use strict";
  log = log(module.id);
  const dateFormatsMap = {
    "M/d/yy": "l",
    "MMM d, y": "ll",
    "MMMM d, y": getLongDateOnlyFormat("LLL"),
    "EEEE, MMMM d, y": getLongDateOnlyFormat("LLLL"),
    "MM/dd/yyyy": "MM/DD/YYYY",
    "dd/MM/yyyy": "DD/MM/YYYY",
    "dd-MMM-yyyy": "DD-MMM-YYYY",
    "yyyy-MM-dd": "YYYY-MM-DD"
  };
  const dateTimeFormatsMap = {
    "M/d/yy, h:mm a": "l LT",
    "MMM d, y, h:mm:ss a": "ll LT",
    "MMMM d, y 'at' h:mm:ss a z": "LLL z",
    "EEEE, MMMM d, y 'at' h:mm:ss a zzzz": "LLLL z",
    "MM/dd/yyyy HH:mm:ss": "MM/DD/YYYY HH:mm:ss",
    "dd/MM/yyyy HH:mm:ss": "DD/MM/YYYY HH:mm:ss",
    "dd-MMM-yyyy HH:mm:ss": "DD-MMM-YYYY HH:mm:ss",
    "yyyy-MM-dd HH:mm:ss": "YYYY-MM-DD HH:mm:ss"
  };
  const dateTimeFormatToDateTimeMap = {
    "M/d/yy, h:mm a": "M/d/yy",
    "MMM d, y, h:mm:ss a": "MMM d, y",
    "MMMM d, y 'at' h:mm:ss a z": "MMMM d, y",
    "EEEE, MMMM d, y 'at' h:mm:ss a zzzz": "EEEE, MMMM d, y",
    "MM/dd/yyyy HH:mm:ss": "MM/dd/yyyy",
    "dd/MM/yyyy HH:mm:ss": "dd/MM/yyyy",
    "dd-MMM-yyyy HH:mm:ss": "dd-MMM-yyyy",
    "yyyy-MM-dd HH:mm:ss": "yyyy-MM-dd"
  };
  function getLongDateOnlyFormat(dateTimeFormat) {
    let longDateTimeFormat = moment.localeData().longDateFormat(dateTimeFormat), timeFormat = moment.localeData().longDateFormat("LT"), longDateOnlyFormat = "LL";
    if (longDateTimeFormat?.includes(timeFormat)) {
      longDateOnlyFormat = longDateTimeFormat.replaceAll(timeFormat, "")?.trim();
    } else if (moment.localeData().longDateFormat(dateTimeFormat.toLowerCase())?.includes(timeFormat)) {
      longDateOnlyFormat = moment.localeData().longDateFormat(dateTimeFormat.toLowerCase()).replaceAll(timeFormat, "")?.trim();
    }
    return longDateOnlyFormat;
  }
  function normalizeToDateTimeFormat(dateTimeFormat) {
    log.debug("Normalizing into SV date-time format from input format: {0}", dateTimeFormat) && console.log(log.last);
    const svDateTimeFormat = dateTimeFormatsMap[dateTimeFormat];
    if (svDateTimeFormat) {
      log.debug("Matching datetime format found: {0}", svDateTimeFormat) && console.log(log.last);
    } else {
      log.debug("No matching datetime format found. Returning undefined") && console.log(log.last);
    }
    return svDateTimeFormat;
  }
  function normalizeToDateFormat(dateTimeFormat) {
    log.debug("Normalizing into SV date format from input format: {0}", dateTimeFormat) && console.log(log.last);
    const dateFormatsKeys = Object.keys(dateFormatsMap);
    for (let i = 0; i < dateFormatsKeys.length; i++) {
      const key = dateFormatsKeys[i];
      if (dateTimeFormat.startsWith(key)) {
        log.debug("Matching date format found: {0}", dateFormatsMap[key]) && console.log(log.last);
        return dateFormatsMap[key];
      }
    }
    log.debug("No matching date format found. Returning undefined") && console.log(log.last);
    return;
  }
  function convertDateTimeFormatToDateFormat(dateTimeFormat) {
    return dateTimeFormatToDateTimeMap[dateTimeFormat] || dateTimeFormatToDateTimeMap["M/d/yy, h:mm a"];
  }
  return {
    dateFormatsMap: dateFormatsMap,
    dateTimeFormatsMap: dateTimeFormatsMap,
    normalizeToDateTimeFormat: normalizeToDateTimeFormat,
    normalizeToDateFormat: normalizeToDateFormat,
    convertDateTimeFormatToDateFormat: convertDateTimeFormatToDateFormat
  };
});