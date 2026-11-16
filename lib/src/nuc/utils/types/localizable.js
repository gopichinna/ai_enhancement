/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'i18n'], function (_, i18n) {
  'use strict';

  var locale = i18n.settings.locale,
    language = locale.replace(/[-_]\w+$/, ''),
    defaultLocale = i18n.settings.defaultLocale,
    defaultLanguage = defaultLocale.replace(/[-_]\w+$/, '');

  function getClosestLocalizedString(value, fallback) {
    if (value == undefined) {
      // undefined or null
      value = fallback == undefined ? null : fallback;
    } else if (_.isObject(value)) {
      // Normalize locale keys to 'll-cc' to be able to look up the right one;
      // the CS REST API uses non-standard 'll_CC' in multilingual metadata
      value = _.reduce(
        value,
        function (result, text, locale) {
          locale = locale.toLowerCase().replace('_', '-');
          result[locale] = text;
          return result;
        },
        {}
      );
      value = value[locale] || value[language] || value[defaultLocale] || value[defaultLanguage] || fallback;
    }
    return (value != null && value.toString()) || '';
  }

  function localeCompareString(left, right, options) {
    options || (options = {});
    // Default is the search usage - ignore case, recognize transliterations
    var usage = options.usage || 'search',
      // Do not accept everything; this method ensures a consistent
      // behaviour of the product - it should not be freely customizable
      filteredOptions = {
        // Passing an undefined usage would even ignore differences in
        // accents, improving the search usage to the Google behaviour.
        // However, it stops the transliteration support, at least in
        // Chrome, unfortunately.  Transliteration is more important,
        // because it is needed by grammar, while omitting accents is
        // a workaround only, if you cannot type the characters with
        // accents on the keyboard.
        usage: usage,
        // Default for the search usage should be always base sensitivity,
        // but it depends on locale, which would confuse the user
        sensitivity: usage === 'search' ? 'base' : 'variant',
        // Number digits should not be normalized in string excerpts, when
        // searching, but when sorting, they should be handled as numbers
        numeric: usage !== 'search'
      };

    if (!left || !right) {
      return !left ? (!right ? 0 : 1) : -1;
    }

    if (left.localeCompare) {
      try {
        return left.localeCompare(right, locale, filteredOptions);
      } catch {
        // just continue to the non-locale comparison below
      }
    }

    left = left.toLowerCase();
    right = right.toLowerCase();
    return left < right ? -1 : left > right ? 1 : 0;
  }

  function localeContainsString(hay, needle) {
    return localeIndexOfString(hay, needle) >= 0;
  }

  function localeEndsWithString(full, end) {
    // FIXME: How many maximum characters can the transliteration add?
    var fullLength = full.length,
      maxLength = Math.min(fullLength, end.length * 3),
      i;
    for (i = 1; i <= maxLength; ++i) {
      if (localeCompareString(full.substring(fullLength - i), end) === 0) {
        return true;
      }
    }
  }

  function localeIndexOfString(hay, needle) {
    var difference = hay.length - needle.length + 1,
      i;
    for (i = 0; i <= difference; ++i) {
      if (localeStartsWithString(hay.substring(i), needle)) {
        return i;
      }
    }
    return -1;
  }

  function localeStartsWithString(full, start) {
    // FIXME: How many maximum characters can the transliteration add?
    var maxLength = Math.min(full.length, start.length * 3),
      i;
    for (i = 1; i <= maxLength; ++i) {
      if (localeCompareString(full.substring(0, i), start) === 0) {
        return true;
      }
    }
  }

  // After the formats parameter there can be additionally parameters specified. They must be of type "string"!
  //
  // We need for each message type 3 or 4 sentences. In many languages for multiple items there is an additional sentence required,
  // that means we need a sentence for one item ("ForOne"), for up to four items ("ForTwo") and for more items ("ForFive"). In english and german
  // the "ForTwo" and "ForFive" sentences are normally the same. We need also a "ForNone" sentence, if nothing is processed.
  //
  // For example czech (item = soubor):
  //    žádný soubor        => none (s0, optional)
  //    ---
  //    1 soubor            => one  (s1)
  //    ---
  //    2 soubory           => some (s2)
  //    3 soubory
  //    4 soubory
  //    ---
  //    5 souborů           => many (s5)
  //    6 souborů
  //    ...
  //    n souborů
  //    ---
  //    0 souborů           => manu (s5, fallback)
  //
  // formats[success].none = žádný soubor ... succeeded.
  // formats[success].one = 1 soubor ... succeeded.
  // formats[success].two = 3 soubory ... succeeded.
  // formats[success].five = 8 souborů ... succeeded.
  //
  // formats[failure].one = 1 soubor ... failed.
  // formats[failure].two = 3 soubory ... failed.
  // formats[failure].five = 8 souborů ... failed.
  // formats[failure].five = 0 souborů ... failed.
  //
  // formats[partial].two = 1 soubor ze 3 souborů ... failed.
  // formats[partial].five = 2 soubory z 15 souborů ... failed.
  //
  // Returns formatted message string.

  function formatMessage(count, messagesObj) {
    // get all additional parameters, except promises, options and formats
    var params = Array.prototype.slice.call(arguments, 2);
    var formatStr;

    if (count > 4) {
      formatStr = messagesObj.formatForFive;
    } else if (count > 1) {
      formatStr = messagesObj.formatForTwo;
    } else if (count > 0) {
      formatStr = messagesObj.formatForOne;
    } else {
      formatStr = messagesObj.formatForNone || messagesObj.formatForFive;
    }

    params.splice(0, 0, count.toString()); // insert count into params at index 0
    params.splice(0, 0, formatStr); // insert formatStr into params at index 0
    var msg = _.str.sformat.apply(_.str, params);

    return msg;
  }

  return {
    getClosestLocalizedString: getClosestLocalizedString,

    localeCompareString: localeCompareString,
    localeContainsString: localeContainsString,
    localeEndsWithString: localeEndsWithString,
    localeIndexOfString: localeIndexOfString,
    localeStartsWithString: localeStartsWithString,

    formatMessage: formatMessage
  };
});
