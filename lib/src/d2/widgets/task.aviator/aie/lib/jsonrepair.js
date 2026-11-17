/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "exports" ], function(exports) {
  "use strict";
  class JSONRepairError extends Error {
    constructor(message, position) {
      super(message + " at position " + position);
      this.position = position;
    }
  }
  const codeBackslash = 92;
  const codeSlash = 47;
  const codeAsterisk = 42;
  const codeOpeningBrace = 123;
  const codeClosingBrace = 125;
  const codeOpeningBracket = 91;
  const codeClosingBracket = 93;
  const codeOpenParenthesis = 40;
  const codeCloseParenthesis = 41;
  const codeSpace = 32;
  const codeNewline = 10;
  const codeTab = 9;
  const codeReturn = 13;
  const codeBackspace = 8;
  const codeFormFeed = 12;
  const codeDoubleQuote = 34;
  const codePlus = 43;
  const codeMinus = 45;
  const codeQuote = 39;
  const codeZero = 48;
  const codeNine = 57;
  const codeComma = 44;
  const codeDot = 46;
  const codeColon = 58;
  const codeSemicolon = 59;
  const codeUppercaseA = 65;
  const codeLowercaseA = 97;
  const codeUppercaseE = 69;
  const codeLowercaseE = 101;
  const codeUppercaseF = 70;
  const codeLowercaseF = 102;
  const codeNonBreakingSpace = 160;
  const codeEnQuad = 8192;
  const codeHairSpace = 8202;
  const codeNarrowNoBreakSpace = 8239;
  const codeMediumMathematicalSpace = 8287;
  const codeIdeographicSpace = 12288;
  const codeDoubleQuoteLeft = 8220;
  const codeDoubleQuoteRight = 8221;
  const codeQuoteLeft = 8216;
  const codeQuoteRight = 8217;
  const codeGraveAccent = 96;
  const codeAcuteAccent = 180;
  function isHex(code) {
    return code >= codeZero && code <= codeNine || code >= codeUppercaseA && code <= codeUppercaseF || code >= codeLowercaseA && code <= codeLowercaseF;
  }
  function isDigit(code) {
    return code >= codeZero && code <= codeNine;
  }
  function isValidStringCharacter(code) {
    return code >= 32 && code <= 1114111;
  }
  function isDelimiter(char) {
    return regexDelimiter.test(char);
  }
  const regexDelimiter = /^[,:[\]/{}()\n+]$/;
  function isDelimiterExceptSlash(char) {
    return isDelimiter(char) && char !== "/";
  }
  function isStartOfValue(char) {
    return regexStartOfValue.test(char) || char && isQuote(char.charCodeAt(0));
  }
  const regexStartOfValue = /^[[{\w-]$/;
  function isControlCharacter(code) {
    return code === codeNewline || code === codeReturn || code === codeTab || code === codeBackspace || code === codeFormFeed;
  }
  function isWhitespace(code) {
    return code === codeSpace || code === codeNewline || code === codeTab || code === codeReturn;
  }
  function isSpecialWhitespace(code) {
    return code === codeNonBreakingSpace || code >= codeEnQuad && code <= codeHairSpace || code === codeNarrowNoBreakSpace || code === codeMediumMathematicalSpace || code === codeIdeographicSpace;
  }
  function isQuote(code) {
    return isDoubleQuoteLike(code) || isSingleQuoteLike(code);
  }
  function isDoubleQuoteLike(code) {
    return code === codeDoubleQuote || code === codeDoubleQuoteLeft || code === codeDoubleQuoteRight;
  }
  function isDoubleQuote(code) {
    return code === codeDoubleQuote;
  }
  function isSingleQuoteLike(code) {
    return code === codeQuote || code === codeQuoteLeft || code === codeQuoteRight || code === codeGraveAccent || code === codeAcuteAccent;
  }
  function isSingleQuote(code) {
    return code === codeQuote;
  }
  function stripLastOccurrence(text, textToStrip) {
    let stripRemainingText = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    const index = text.lastIndexOf(textToStrip);
    return index !== -1 ? text.substring(0, index) + (stripRemainingText ? "" : text.substring(index + 1)) : text;
  }
  function insertBeforeLastWhitespace(text, textToInsert) {
    let index = text.length;
    if (!isWhitespace(text.charCodeAt(index - 1))) {
      return text + textToInsert;
    }
    while (isWhitespace(text.charCodeAt(index - 1))) {
      index--;
    }
    return text.substring(0, index) + textToInsert + text.substring(index);
  }
  function removeAtIndex(text, start, count) {
    return text.substring(0, start) + text.substring(start + count);
  }
  function endsWithCommaOrNewline(text) {
    return /[,\n][ \t\r]*$/.test(text);
  }
  function isFunctionName(text) {
    return /^\w+$/.test(text);
  }
  const controlCharacters = {
    "\b": "\\b",
    "\f": "\\f",
    "\n": "\\n",
    "\r": "\\r",
    "\t": "\\t"
  };
  const escapeCharacters = {
    '"': '"',
    "\\": "\\",
    "/": "/",
    b: "\b",
    f: "\f",
    n: "\n",
    r: "\r",
    t: "\t"
  };
  function jsonrepair(text) {
    let i = 0;
    let output = "";
    const processed = parseValue();
    if (!processed) {
      throwUnexpectedEnd();
    }
    const processedComma = parseCharacter(codeComma);
    if (processedComma) {
      parseWhitespaceAndSkipComments();
    }
    if (isStartOfValue(text[i]) && endsWithCommaOrNewline(output)) {
      if (!processedComma) {
        output = insertBeforeLastWhitespace(output, ",");
      }
      parseNewlineDelimitedJSON();
    } else if (processedComma) {
      output = stripLastOccurrence(output, ",");
    }
    while (text.charCodeAt(i) === codeClosingBrace || text.charCodeAt(i) === codeClosingBracket) {
      i++;
      parseWhitespaceAndSkipComments();
    }
    if (i >= text.length) {
      return output;
    }
    throwUnexpectedCharacter();
    function parseValue() {
      parseWhitespaceAndSkipComments();
      const processed = parseObject() || parseArray() || parseString() || parseNumber() || parseKeywords() || parseUnquotedString();
      parseWhitespaceAndSkipComments();
      return processed;
    }
    function parseWhitespaceAndSkipComments() {
      const start = i;
      let changed = parseWhitespace();
      do {
        changed = parseComment();
        if (changed) {
          changed = parseWhitespace();
        }
      } while (changed);
      return i > start;
    }
    function parseWhitespace() {
      let whitespace = "";
      let normal;
      while ((normal = isWhitespace(text.charCodeAt(i))) || isSpecialWhitespace(text.charCodeAt(i))) {
        if (normal) {
          whitespace += text[i];
        } else {
          whitespace += " ";
        }
        i++;
      }
      if (whitespace.length > 0) {
        output += whitespace;
        return true;
      }
      return false;
    }
    function parseComment() {
      if (text.charCodeAt(i) === codeSlash && text.charCodeAt(i + 1) === codeAsterisk) {
        while (i < text.length && !atEndOfBlockComment(text, i)) {
          i++;
        }
        i += 2;
        return true;
      }
      if (text.charCodeAt(i) === codeSlash && text.charCodeAt(i + 1) === codeSlash) {
        while (i < text.length && text.charCodeAt(i) !== codeNewline) {
          i++;
        }
        return true;
      }
      return false;
    }
    function parseCharacter(code) {
      if (text.charCodeAt(i) === code) {
        output += text[i];
        i++;
        return true;
      }
      return false;
    }
    function skipCharacter(code) {
      if (text.charCodeAt(i) === code) {
        i++;
        return true;
      }
      return false;
    }
    function skipEscapeCharacter() {
      return skipCharacter(codeBackslash);
    }
    function skipEllipsis() {
      parseWhitespaceAndSkipComments();
      if (text.charCodeAt(i) === codeDot && text.charCodeAt(i + 1) === codeDot && text.charCodeAt(i + 2) === codeDot) {
        i += 3;
        parseWhitespaceAndSkipComments();
        skipCharacter(codeComma);
        return true;
      }
      return false;
    }
    function parseObject() {
      if (text.charCodeAt(i) === codeOpeningBrace) {
        output += "{";
        i++;
        parseWhitespaceAndSkipComments();
        if (skipCharacter(codeComma)) {
          parseWhitespaceAndSkipComments();
        }
        let initial = true;
        while (i < text.length && text.charCodeAt(i) !== codeClosingBrace) {
          let processedComma;
          if (!initial) {
            processedComma = parseCharacter(codeComma);
            if (!processedComma) {
              output = insertBeforeLastWhitespace(output, ",");
            }
            parseWhitespaceAndSkipComments();
          } else {
            processedComma = true;
            initial = false;
          }
          skipEllipsis();
          const processedKey = parseString() || parseUnquotedString();
          if (!processedKey) {
            if (text.charCodeAt(i) === codeClosingBrace || text.charCodeAt(i) === codeOpeningBrace || text.charCodeAt(i) === codeClosingBracket || text.charCodeAt(i) === codeOpeningBracket || text[i] === undefined) {
              output = stripLastOccurrence(output, ",");
            } else {
              throwObjectKeyExpected();
            }
            break;
          }
          parseWhitespaceAndSkipComments();
          const processedColon = parseCharacter(codeColon);
          const truncatedText = i >= text.length;
          if (!processedColon) {
            if (isStartOfValue(text[i]) || truncatedText) {
              output = insertBeforeLastWhitespace(output, ":");
            } else {
              throwColonExpected();
            }
          }
          const processedValue = parseValue();
          if (!processedValue) {
            if (processedColon || truncatedText) {
              output += "null";
            } else {
              throwColonExpected();
            }
          }
        }
        if (text.charCodeAt(i) === codeClosingBrace) {
          output += "}";
          i++;
        } else {
          output = insertBeforeLastWhitespace(output, "}");
        }
        return true;
      }
      return false;
    }
    function parseArray() {
      if (text.charCodeAt(i) === codeOpeningBracket) {
        output += "[";
        i++;
        parseWhitespaceAndSkipComments();
        if (skipCharacter(codeComma)) {
          parseWhitespaceAndSkipComments();
        }
        let initial = true;
        while (i < text.length && text.charCodeAt(i) !== codeClosingBracket) {
          if (!initial) {
            const processedComma = parseCharacter(codeComma);
            if (!processedComma) {
              output = insertBeforeLastWhitespace(output, ",");
            }
          } else {
            initial = false;
          }
          skipEllipsis();
          const processedValue = parseValue();
          if (!processedValue) {
            output = stripLastOccurrence(output, ",");
            break;
          }
        }
        if (text.charCodeAt(i) === codeClosingBracket) {
          output += "]";
          i++;
        } else {
          output = insertBeforeLastWhitespace(output, "]");
        }
        return true;
      }
      return false;
    }
    function parseNewlineDelimitedJSON() {
      let initial = true;
      let processedValue = true;
      while (processedValue) {
        if (!initial) {
          const processedComma = parseCharacter(codeComma);
          if (!processedComma) {
            output = insertBeforeLastWhitespace(output, ",");
          }
        } else {
          initial = false;
        }
        processedValue = parseValue();
      }
      if (!processedValue) {
        output = stripLastOccurrence(output, ",");
      }
      output = "[\n".concat(output, "\n]");
    }
    function parseString() {
      let stopAtDelimiter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      let skipEscapeChars = text.charCodeAt(i) === codeBackslash;
      if (skipEscapeChars) {
        i++;
        skipEscapeChars = true;
      }
      if (isQuote(text.charCodeAt(i))) {
        const isEndQuote = isDoubleQuote(text.charCodeAt(i)) ? isDoubleQuote : isSingleQuote(text.charCodeAt(i)) ? isSingleQuote : isSingleQuoteLike(text.charCodeAt(i)) ? isSingleQuoteLike : isDoubleQuoteLike;
        const iBefore = i;
        const oBefore = output.length;
        let str = '"';
        i++;
        while (true) {
          if (i >= text.length) {
            const iPrev = prevNonWhitespaceIndex(i - 1);
            if (!stopAtDelimiter && isDelimiter(text.charAt(iPrev))) {
              i = iBefore;
              output = output.substring(0, oBefore);
              return parseString(true);
            }
            str = insertBeforeLastWhitespace(str, '"');
            output += str;
            return true;
          } else if (isEndQuote(text.charCodeAt(i))) {
            const iQuote = i;
            const oQuote = str.length;
            str += '"';
            i++;
            output += str;
            parseWhitespaceAndSkipComments();
            if (stopAtDelimiter || i >= text.length || isDelimiter(text.charAt(i)) || isQuote(text.charCodeAt(i)) || isDigit(text.charCodeAt(i))) {
              parseConcatenatedString();
              return true;
            }
            if (isDelimiter(text.charAt(prevNonWhitespaceIndex(iQuote - 1)))) {
              i = iBefore;
              output = output.substring(0, oBefore);
              return parseString(true);
            }
            output = output.substring(0, oBefore);
            i = iQuote + 1;
            str = str.substring(0, oQuote) + "\\" + str.substring(oQuote);
          } else if (stopAtDelimiter && isDelimiter(text[i])) {
            str = insertBeforeLastWhitespace(str, '"');
            output += str;
            parseConcatenatedString();
            return true;
          } else if (text.charCodeAt(i) === codeBackslash) {
            const char = text.charAt(i + 1);
            const escapeChar = escapeCharacters[char];
            if (escapeChar !== undefined) {
              str += text.slice(i, i + 2);
              i += 2;
            } else if (char === "u") {
              let j = 2;
              while (j < 6 && isHex(text.charCodeAt(i + j))) {
                j++;
              }
              if (j === 6) {
                str += text.slice(i, i + 6);
                i += 6;
              } else if (i + j >= text.length) {
                i = text.length;
              } else {
                throwInvalidUnicodeCharacter();
              }
            } else {
              str += char;
              i += 2;
            }
          } else {
            const char = text.charAt(i);
            const code = text.charCodeAt(i);
            if (code === codeDoubleQuote && text.charCodeAt(i - 1) !== codeBackslash) {
              str += "\\" + char;
              i++;
            } else if (isControlCharacter(code)) {
              str += controlCharacters[char];
              i++;
            } else {
              if (!isValidStringCharacter(code)) {
                throwInvalidCharacter(char);
              }
              str += char;
              i++;
            }
          }
          if (skipEscapeChars) {
            skipEscapeCharacter();
          }
        }
      }
      return false;
    }
    function parseConcatenatedString() {
      let processed = false;
      parseWhitespaceAndSkipComments();
      while (text.charCodeAt(i) === codePlus) {
        processed = true;
        i++;
        parseWhitespaceAndSkipComments();
        output = stripLastOccurrence(output, '"', true);
        const start = output.length;
        const parsedStr = parseString();
        if (parsedStr) {
          output = removeAtIndex(output, start, 1);
        } else {
          output = insertBeforeLastWhitespace(output, '"');
        }
      }
      return processed;
    }
    function parseNumber() {
      const start = i;
      if (text.charCodeAt(i) === codeMinus) {
        i++;
        if (atEndOfNumber()) {
          repairNumberEndingWithNumericSymbol(start);
          return true;
        }
        if (!isDigit(text.charCodeAt(i))) {
          i = start;
          return false;
        }
      }
      while (isDigit(text.charCodeAt(i))) {
        i++;
      }
      if (text.charCodeAt(i) === codeDot) {
        i++;
        if (atEndOfNumber()) {
          repairNumberEndingWithNumericSymbol(start);
          return true;
        }
        if (!isDigit(text.charCodeAt(i))) {
          i = start;
          return false;
        }
        while (isDigit(text.charCodeAt(i))) {
          i++;
        }
      }
      if (text.charCodeAt(i) === codeLowercaseE || text.charCodeAt(i) === codeUppercaseE) {
        i++;
        if (text.charCodeAt(i) === codeMinus || text.charCodeAt(i) === codePlus) {
          i++;
        }
        if (atEndOfNumber()) {
          repairNumberEndingWithNumericSymbol(start);
          return true;
        }
        if (!isDigit(text.charCodeAt(i))) {
          i = start;
          return false;
        }
        while (isDigit(text.charCodeAt(i))) {
          i++;
        }
      }
      if (!atEndOfNumber()) {
        i = start;
        return false;
      }
      if (i > start) {
        const num = text.slice(start, i);
        const hasInvalidLeadingZero = /^0\d/.test(num);
        output += hasInvalidLeadingZero ? '"'.concat(num, '"') : num;
        return true;
      }
      return false;
    }
    function parseKeywords() {
      return parseKeyword("true", "true") || parseKeyword("false", "false") || parseKeyword("null", "null") || parseKeyword("True", "true") || parseKeyword("False", "false") || parseKeyword("None", "null");
    }
    function parseKeyword(name, value) {
      if (text.slice(i, i + name.length) === name) {
        output += value;
        i += name.length;
        return true;
      }
      return false;
    }
    function parseUnquotedString() {
      const start = i;
      while (i < text.length && !isDelimiterExceptSlash(text[i]) && !isQuote(text.charCodeAt(i))) {
        i++;
      }
      if (i > start) {
        if (text.charCodeAt(i) === codeOpenParenthesis && isFunctionName(text.slice(start, i).trim())) {
          i++;
          parseValue();
          if (text.charCodeAt(i) === codeCloseParenthesis) {
            i++;
            if (text.charCodeAt(i) === codeSemicolon) {
              i++;
            }
          }
          return true;
        } else {
          while (isWhitespace(text.charCodeAt(i - 1)) && i > 0) {
            i--;
          }
          const symbol = text.slice(start, i);
          output += symbol === "undefined" ? "null" : JSON.stringify(symbol);
          if (text.charCodeAt(i) === codeDoubleQuote) {
            i++;
          }
          return true;
        }
      }
    }
    function prevNonWhitespaceIndex(start) {
      let prev = start;
      while (prev > 0 && isWhitespace(text.charCodeAt(prev))) {
        prev--;
      }
      return prev;
    }
    function atEndOfNumber() {
      return i >= text.length || isDelimiter(text[i]) || isWhitespace(text.charCodeAt(i));
    }
    function repairNumberEndingWithNumericSymbol(start) {
      output += text.slice(start, i) + "0";
    }
    function throwInvalidCharacter(char) {
      throw new JSONRepairError("Invalid character " + JSON.stringify(char), i);
    }
    function throwUnexpectedCharacter() {
      throw new JSONRepairError("Unexpected character " + JSON.stringify(text[i]), i);
    }
    function throwUnexpectedEnd() {
      throw new JSONRepairError("Unexpected end of json string", text.length);
    }
    function throwObjectKeyExpected() {
      throw new JSONRepairError("Object key expected", i);
    }
    function throwColonExpected() {
      throw new JSONRepairError("Colon expected", i);
    }
    function throwInvalidUnicodeCharacter() {
      const chars = text.slice(i, i + 6);
      throw new JSONRepairError('Invalid unicode character "'.concat(chars, '"'), i);
    }
  }
  function atEndOfBlockComment(text, i) {
    return text[i] === "*" && text[i + 1] === "/";
  }
  exports.JSONRepairError = JSONRepairError;
  exports.jsonrepair = jsonrepair;
});