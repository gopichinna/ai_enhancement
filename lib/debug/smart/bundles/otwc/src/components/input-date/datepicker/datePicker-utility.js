import { DateTime } from 'luxon';

/**
 * checks if two dates are equal
 * @param {Date} date1
 * @param {Date} date2
 * @returns {Boolean} true or false
 */
function isEqualDate(date1, date2) {
  if (!(date1 && date2)) return false;

  return (date1.getFullYear() === date2.getFullYear()
    && date1.getMonth() === date2.getMonth()
    && date1.getDate() === date2.getDate());
}

/**
 * @template X
 * @template Y
 * @param {X} obj
 * @param {Y} objDefaults
 * @returns {X|Y} merged object
 */
function mergeObjects(obj, objDefaults) {
  const keys = Object.keys(objDefaults);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      obj[key] = objDefaults[key];
    }
  }
  return obj;
}

/**
 * Parse and return a date object base on the input value string.
 * Return null if the input value string is a invalid date string (according to the date format).
 *
 * @param {string} dateString
 * @param {string} dateFormat
 * @param {string} locale
 * @returns {DateTime|null}
 */
function parseDateFromDateString(
  dateString,
  dateFormat,
  locale,
) {
  let date = DateTime.now();

  // Parse date from the value string, if it's available.
  if (dateString.length) {
    date = DateTime.fromFormat(dateString, dateFormat, { locale });

    if (!date.isValid) {
      return null;
    }
  }

  return date;
}

/**
 *
 * @param {string} locales: a string with BCP 47 language tag
 * @param {Object} option
 *
 * @returns {Intl.DateTimeFormat}
 */
function getDateTimeFormatter(locales, option) {
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat(locales, option);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.info(`Invalid language tag ${locales}. The language from the browser will be used: ${navigator.language}`);
    formatter = new Intl.DateTimeFormat(navigator.language, option);
  }

  return formatter;
}

function getDayLabelList(weekdayFormat, locales) {
  const formatter = getDateTimeFormatter(
    locales,
    { weekday: weekdayFormat, timeZone: 'UTC' },
  );
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date('2022-01-02'); // a sunday
    date.setUTCDate(date.getUTCDate() + i);
    const day = formatter.format(date);
    days.push(day);
  }
  return days;
}

function getMonthLabelList(short, locales) {
  const formatter = getDateTimeFormatter(
    locales,
    { month: short ? 'short' : 'long', timeZone: 'UTC' },
  );
  const months = [];
  for (let i = 0; i < 12; i += 1) {
    const date = new Date('2022-01-01');
    date.setUTCMonth(date.getUTCMonth() + i);
    const month = formatter.format(date);
    months.push(month);
  }
  return months;
}

/**
 * Get the value of start of the week from Locale, if the browser supports it.
 * Otherwise, return 1 for Monday.
 *
 * @returns {number}
 */
function getWeekStartDay(language = 'en') {
  const locale = new Intl.Locale(language);
  if (locale.weekInfo && locale.weekInfo.firstDay) {
    return locale.weekInfo.firstDay % 7;
  }
  return 1;
}

/**
 * Get the 12 hours time abbreviation base on language.
 *
 * @param {string} language
 * @returns {Object}
 */
function get12HoursTimeAbbreviation(language = 'en') {
  const options = { hour: 'numeric', hourCycle: 'h12' };

  const amDate = new Intl.DateTimeFormat(language, options).formatToParts(new Date('2023-07-23T07:00:00'));
  const pmDate = new Intl.DateTimeFormat(language, options).formatToParts(new Date('2023-07-23T17:00:00'));
  const amDayPeriod = amDate.find(element => element.type === 'dayPeriod');
  const pmDayPeriod = pmDate.find(element => element.type === 'dayPeriod');

  return {
    am: amDayPeriod && amDayPeriod.value ? amDayPeriod.value : 'AM',
    pm: pmDayPeriod && pmDayPeriod.value ? pmDayPeriod.value : 'PM',
  };
}

/**
 * Detect if the format is a time format.
 *
 * @param {string} format
 * @returns {boolean}
 */
function isTimeFormat(format) {
  return format.toLowerCase().indexOf('h') !== -1;
}

/**
 * Detect if the format is a 12-hour time format.
 *
 * @param {string} format
 * @returns {boolean}
 */
function isAmPMFormat(format) {
  return format.slice(-1) === 'a';
}

export { get12HoursTimeAbbreviation, getDateTimeFormatter, getDayLabelList, getMonthLabelList, getWeekStartDay, isAmPMFormat, isEqualDate, isTimeFormat, mergeObjects, parseDateFromDateString };
//# sourceMappingURL=datePicker-utility.js.map
