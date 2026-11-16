/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/moment", "nuc/utils/types/date", "dctmw/utils/rest.resources", "d2/utils/constants", "i18n!d2/utils/impl/nls/lang" ], function(_, moment, date, RestResources, constants, lang) {
  "use strict";
  function formatValueForServer(dateInput, format) {
    let isTimezoneAware = RestResources.getD2Options().is_client_tz_aware, preferredTimezone = RestResources.getProductInfo().get("preferred_tz"), serverDate;
    if (!isTimezoneAware && preferredTimezone) {
      serverDate = moment.utc(dateInput).tz(preferredTimezone);
    } else {
      serverDate = moment.utc(dateInput).local();
    }
    return serverDate.format(format);
  }
  return {
    isDateValue: function(val) {
      return moment(val).isValid();
    },
    isValidDate: function(val) {
      return val && val !== "" && !_.isNumber(val) && !_.isArray(val) && this.isDateValue(val);
    },
    convertDateFormat: function(dateformat) {
      if (!_.isUndefined(dateformat) && !_.isNull(dateformat)) {
        dateformat = dateformat.replace(/y/g, "Y");
        dateformat = dateformat.replace(/d/g, "D");
        dateformat = dateformat.replace(/E/g, "d");
        dateformat = dateformat.replace(/z/g, "Z");
      }
      return dateformat;
    },
    convertToMoment: function(dateValue, dateFormat) {
      if (dateValue) {
        if (dateFormat) {
          return moment(dateValue, this.convertDateFormat(dateFormat));
        } else {
          return moment(dateValue);
        }
      }
      return "";
    },
    convertToMomentUTC: function(dateValue, dateFormat) {
      return dateValue ? moment.utc(dateValue, this.convertDateFormat(dateFormat)) : "";
    },
    isDateType: function(type) {
      return type === "date" || type === "datetime";
    },
    formatDate: function(val) {
      return this.isValidDate(val) ? moment.utc(val, [ date.exactDateFormat, date.exactDateTimeFormat, "YYYY-MM-DD'T'HH:mm:ss.SSSZZ", "YYYY-MM-DD" ]) : "";
    },
    formatDueDate: function(val, ignoreDuePrefix, ignoreOverduePrefix) {
      if (!this.isValidDate(val)) {
        return null;
      }
      var today = this._getCurrentDate().startOf("day"), dt = moment(val).startOf("day"), diff = dt.diff(today, "days"), fmtVal = "", overdue = false, datetimeInClientFormat = date.formatExactDateTime(date.deserializeDate(val)), overdueDisplay = "";
      if (diff === 0) {
        if (ignoreDuePrefix || ignoreOverduePrefix) {
          fmtVal = lang.formatDateDueTodayWOPrefix;
        } else {
          fmtVal = lang.formatDateDueToday;
        }
      } else if (diff === 1) {
        if (ignoreDuePrefix) {
          fmtVal = lang.formatDateDueTomorrowWOPrefix;
        } else {
          fmtVal = lang.formatDateDueTomorrow;
        }
      } else if (diff === -1) {
        if (ignoreOverduePrefix) {
          fmtVal = lang.formatDateYesterdayWOPrefix;
        } else {
          overdue = true;
          fmtVal = lang.formatDateOverdueOneDay;
          overdueDisplay = lang.formatDateOverdueOneDayMobile;
        }
      } else if (diff > 1 && diff <= 7) {
        if (ignoreDuePrefix) {
          fmtVal = _.str.sformat(lang.formatDateDueInDaysWOPrefix, diff);
        } else {
          fmtVal = _.str.sformat(lang.formatDateDueInDays, diff);
        }
      } else if (diff < -1 && diff >= -7) {
        if (ignoreOverduePrefix) {
          fmtVal = _.str.sformat(lang.formatDateDaysAgo, diff * -1);
        } else {
          overdue = true;
          fmtVal = _.str.sformat(lang.formatDateOverdueDays, diff * -1);
          overdueDisplay = _.str.sformat(lang.formatDateOverdueDaysMobile, diff * -1);
        }
      } else if (diff < 0) {
        if (ignoreOverduePrefix) {
          fmtVal = date.formatExactDate(val);
        } else {
          overdue = true;
          fmtVal = _.str.sformat(lang.formatDateOverdueDate, date.formatExactDate(val));
          overdueDisplay = _.str.sformat(lang.formatDateOverdueDateMobile, date.formatExactDate(val));
        }
      } else {
        if (ignoreDuePrefix) {
          fmtVal = _.str.sformat(lang.formatDateDueDateWOPrefix, date.formatExactDate(val));
        } else {
          fmtVal = _.str.sformat(lang.formatDateDueDate, date.formatExactDate(val));
        }
      }
      return {
        display: fmtVal,
        overdue: overdue,
        datetimeInClientFormat: datetimeInClientFormat,
        overdueDisplay: overdueDisplay
      };
    },
    convertToLocalDateTimeObject: function(dateValue, unit) {
      var localDate;
      if (unit === "day") {
        localDate = moment(dateValue.format(constants.ISODateFormats.DATE_ONLY));
      } else {
        localDate = dateValue.local().format(constants.ISODateFormats.DATE_TIME);
      }
      return moment(localDate);
    },
    getTodayValue: function() {
      return this._getCurrentDate().format(constants.ISODateFormats.DATE_ONLY);
    },
    getNowValue: function() {
      return this._getCurrentDate().format(constants.ISODateFormats.DATE_TIME);
    },
    getDateCompareUnit: function(value) {
      return !!value._pf && value._pf.parsedDateParts.length > 3 ? "second" : "day";
    },
    compareDate: function(input, compareTo, operation, dateOnly) {
      var unit = dateOnly ? "day" : "second";
      if (compareTo === "$TODAY") {
        compareTo = this.getTodayValue();
        unit = "day";
      }
      input = moment.utc(input);
      compareTo = this.formatDate(compareTo);
      var LHSUnit = this.getDateCompareUnit(input), RHSUnit = this.getDateCompareUnit(compareTo);
      if (input && compareTo && (LHSUnit !== RHSUnit || dateOnly)) {
        input = this.convertToLocalDateTimeObject(input, LHSUnit);
        compareTo = this.convertToLocalDateTimeObject(compareTo, RHSUnit);
      }
      switch (operation) {
       case "=":
        return input.isSame(compareTo, unit);

       case ">":
        return input.isAfter(compareTo, unit);

       case ">=":
        return input.isSameOrAfter(compareTo, unit);

       case "<":
        return input.isBefore(compareTo, unit);

       case "<=":
        return input.isSameOrBefore(compareTo, unit);
      }
    },
    convertToClientFormat: function(input, includeTime) {
      if (input) {
        return _.map(input.split(","), function(val) {
          var deserializedDate = date.deserializeDate(val);
          return includeTime ? date.formatExactDateTime(deserializedDate) : date.formatExactDate(deserializedDate);
        }).join(", ");
      } else {
        return "";
      }
    },
    convertToServerFormat: function(input) {
      if (_.isEmpty(input)) {
        return input;
      }
      var format = "YYYY-MM-DDTHH:mm:ss.SSSZZ";
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
      var retVal;
      if (input instanceof Array) {
        retVal = [];
        for (var key in input) {
          if (Object.prototype.hasOwnProperty.call(input, key)) {
            var date = input[key];
            var fmtdate = includesTimeZone(date) ? formatValueForServer(date, format) : moment(date).locale("en").format(format);
            retVal.push(fmtdate);
          }
        }
      } else {
        retVal = includesTimeZone(input) ? formatValueForServer(input, format) : moment(input).locale("en").format(format);
      }
      return retVal;
    },
    getBrowserTimeZone: function() {
      if (RestResources.getD2Options().is_client_tz_aware) {
        return moment.tz.guess();
      } else {
        return RestResources.getProductInfo().get("preferred_tz");
      }
    },
    getTimezoneOffset: function() {
      return -1 * moment().utcOffset() / 60;
    },
    getPickerDefaultDateInISO: function(defaultTime) {
      if (defaultTime && _.isString(defaultTime)) {
        var timePair = defaultTime.split(":");
        if (timePair.length === 2 && !isNaN(timePair[0]) && !isNaN(timePair[1])) {
          var hour = parseInt(timePair[0]), minute = parseInt(timePair[1]);
          return moment().hour(hour).minute(minute).second(0).millisecond(0).toISOString();
        }
      }
    },
    _getCurrentDate: function() {
      return moment();
    },
    kFormatter: function(num) {
      return num > 9999 ? num % 1e3 === 0 ? Math.floor(num / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : Math.floor(num / 1e3).toFixed(1).replace(/\.0$/, "") + "K+" : num;
    },
    getCurrentDateFormat: function() {
      return date.exactDateFormat;
    },
    getDateValidated: function(value) {
      return date.validateDate(value);
    }
  };
});