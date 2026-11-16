/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/utils/types/date", "d2/lib/antlr4/antlr4", "d2/utils/advanced.search.utils", "d2/utils/types/inputdate", "i18n!d2/dialogs/advanced.search/impl/nls/lang" ], function(_, date, Antlr, AdvancedSearchUtils, inputDate, lang) {
  "use strict";
  var PropertySearchErrorListener = function() {
    this.syntaxErrors = [];
    this.semanticErrors = [];
    this.infoMessageMap = {};
    Antlr.error.ErrorListener.call(this);
    return this;
  };
  PropertySearchErrorListener.prototype = Object.create(Antlr.error.ErrorListener.prototype);
  PropertySearchErrorListener.prototype.constructor = PropertySearchErrorListener;
  _.extend(PropertySearchErrorListener.prototype, {
    clearSyntaxErrors: function() {
      this.syntaxErrors = [];
    },
    getSyntaxErrors: function() {
      return this.syntaxErrors;
    },
    getInfoMap: function() {
      return this.infoMessageMap;
    },
    clearSemanticErrors: function() {
      this.semanticErrors = [];
    },
    clearInfoMap: function() {
      this.infoMessageMap = {};
    },
    getSemanticErrors: function() {
      return this.semanticErrors;
    },
    getErrors: function() {
      return this.syntaxErrors.concat(this.semanticErrors);
    },
    clearErrors: function() {
      this.syntaxErrors = [];
      this.semanticErrors = [];
    },
    propertyError: function(ctx, propertyName, isEmpty) {
      this.semanticErrors.push(_.str.sformat(isEmpty === true ? lang.emptyType : lang.invalidProperty, propertyName));
    },
    operatorError: function(ctx, operatorName, propertyName) {
      this.semanticErrors.push(_.str.sformat(lang.invalidOperator, operatorName, propertyName));
    },
    binomialOperatorSyntaxError: function(ctx, value) {
      this.semanticErrors.push(_.str.sformat(lang.expectingAndOr, value));
    },
    operatorSyntaxError: function(ctx, opertaorName, propertyName) {
      this.semanticErrors.push(_.str.sformat(lang.missingValue, propertyName));
    },
    operatorSyntaxErrorForDate: function(ctx, opertaorName, propertyName) {
      var openDatepickerKey = "Enter/ Return";
      var spanText = "<span>" + _.str.sformat(lang.missingValue, propertyName) + "</span>";
      this.semanticErrors.push(spanText);
      var infotext = "<span>" + _.str.sformat(lang.typeInDateFormatHelpText, inputDate.exactDateInputFormat, openDatepickerKey, "{0}") + "</span>";
      infotext = infotext.replace(inputDate.exactDateInputFormat, "<span class='d2-highlight-text'>" + inputDate.exactDateInputFormat + "</span>");
      infotext = infotext.replace(openDatepickerKey, "<span class='d2-highlight-text'>" + openDatepickerKey + "</span>");
      if (this.infoMessageMap[infotext]) {
        this.infoMessageMap[infotext].push(propertyName);
      } else {
        this.infoMessageMap[infotext] = [ propertyName ];
      }
    },
    valueError: function(ctx, value, propertyName, schema) {
      switch (schema) {
       case "boolean":
        this.semanticErrors.push(_.str.sformat(lang.invalidBooleanValue, propertyName));
        break;

       case "datetime":
        var openDatepickerKey = "Enter/ Return";
        var spanText = "<span>" + _.str.sformat(lang.invalidDateValue, propertyName, inputDate.exactDateInputFormat) + " " + _.str.sformat(lang.datePickerHelpText, openDatepickerKey) + "</span>";
        spanText = spanText.replace(inputDate.exactDateInputFormat, "<span class='d2-highlight-text'>" + inputDate.exactDateInputFormat + "</span>");
        spanText = spanText.replace(openDatepickerKey, "<span class='d2-highlight-text'>" + openDatepickerKey + "</span>");
        this.semanticErrors.push(spanText);
        break;

       case "double":
        this.semanticErrors.push(_.str.sformat(lang.invalidDoubleValue, propertyName));
        break;

       case "integer":
       case "small integer":
        this.semanticErrors.push(_.str.sformat(lang.invalidIntegerValue, propertyName));
        break;

       case "string":
       default:
        this.semanticErrors.push(_.str.sformat(lang.invalidStringValue, value, propertyName));
        break;
      }
    },
    syntaxError: function(recognizer, offendingSymbol, line, column, msg, e) {
      var expectedTokens;
      if (e && e.constructor.name) {
        switch (e.constructor.name) {
         case "LexerNoViableAltException":
          msg = msg.slice(msg.indexOf("'") + 2, -1).split(" ")[0];
          this.syntaxErrors.push(_.str.sformat(lang.missingQuote, msg));
          break;

         case "NoViableAltException":
          this.syntaxErrors.push(_.str.sformat(lang.missingOperatorAndValue, AdvancedSearchUtils.removeQuotes(msg.slice(msg.indexOf("'") + 1, -1))));
          break;

         case "InputMismatchException":
          expectedTokens = recognizer.getExpectedTokens().toTokenString(recognizer.literalNames, recognizer.symbolicNames);
          if (/^{.*}$/.test(expectedTokens)) {
            this.syntaxErrors.push(lang.missingRelationExpression);
          } else if (expectedTokens === "')'") {
            this.syntaxErrors.push(_.str.sformat(lang.expectingAndOr, offendingSymbol.text));
          } else {
            this.syntaxErrors.push(lang.invalidSyntax);
          }
          break;

         default:
          this.syntaxErrors.push(lang.invalidSyntax);
        }
      } else {
        if (msg.startsWith("missing")) {
          expectedTokens = recognizer.getExpectedTokens().toTokenString(recognizer.literalNames, recognizer.symbolicNames);
          if (expectedTokens === "')'") {
            this.syntaxErrors.push(lang.missingCloseBracket);
          } else if (expectedTokens === "ID") {
            this.syntaxErrors.push(lang.missingValue);
          } else {
            this.syntaxErrors.push(lang.invalidSyntax);
          }
        } else if (msg.startsWith("extraneous input")) {
          this.syntaxErrors.push(_.str.sformat(lang.expectingAndOr, offendingSymbol.text));
        } else {
          this.syntaxErrors.push(lang.invalidSyntax);
        }
      }
    }
  });
  return {
    default: PropertySearchErrorListener
  };
});