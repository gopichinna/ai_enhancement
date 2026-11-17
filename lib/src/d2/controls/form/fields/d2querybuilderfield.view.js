/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/types/date", "nuc/utils/base", "csui/controls/form/pub.sub", "csui/controls/form/fields/textareafield.view", "nuc/lib/moment", "d2/lib/antlr4/antlr4", "d2/utils/advanced.search.utils", "dctmw/utils/utils", "d2/utils/types/inputdate", "css!d2/controls/form/impl/d2querybuilder/d2querybuilderfield" ], function(i18n, $, _, date, base, PubSub, TextAreaFieldView, moment, Antlr, AdvancedSearchUtils, utils, inputDate) {
  "use strict";
  var keyMap = {
    up: 38,
    38: "up",
    down: 40,
    40: "down",
    left: 37,
    37: "left",
    right: 39,
    39: "right",
    tab: 9,
    9: "tab",
    escape: 27,
    27: "escape",
    enter: 13,
    13: "enter",
    pageUp: 33,
    33: "pageUp",
    pageDown: 34,
    34: "pageDown",
    shift: 16,
    16: "shift",
    control: 17,
    17: "control",
    space: 32,
    32: "space",
    t: 84,
    84: "t",
    delete: 46,
    46: "delete"
  }, keyState = {}, stopPropogateKeyupEvent = false, keyBinds = {
    up: function(widget) {
      if (!widget) {
        return;
      }
      var d = this.date() || moment();
      if (widget.find(".datepicker").is(":visible")) {
        this.date(d.clone().subtract(7, "d"));
      } else {
        this.date(d.clone().add(1, "m"));
      }
    },
    down: function(widget) {
      if (!widget) {
        this.show();
        return;
      }
      var d = this.date() || moment();
      if (widget.find(".datepicker").is(":visible")) {
        this.date(d.clone().add(7, "d"));
      } else {
        this.date(d.clone().subtract(1, "m"));
      }
    },
    "control up": function(widget) {
      if (!widget) {
        return;
      }
      var d = this.date() || moment();
      if (widget.find(".datepicker").is(":visible")) {
        this.date(d.clone().subtract(1, "y"));
      } else {
        this.date(d.clone().add(1, "h"));
      }
    },
    "control down": function(widget) {
      if (!widget) {
        return;
      }
      var d = this.date() || moment();
      if (widget.find(".datepicker").is(":visible")) {
        this.date(d.clone().add(1, "y"));
      } else {
        this.date(d.clone().subtract(1, "h"));
      }
    },
    left: function(widget) {
      if (!widget) {
        return;
      }
      var d = this.date() || moment();
      if (widget.find(".datepicker").is(":visible")) {
        this.date(d.clone().subtract(1, "d"));
      }
    },
    right: function(widget) {
      if (!widget) {
        return;
      }
      var d = this.date() || moment();
      if (widget.find(".datepicker").is(":visible")) {
        this.date(d.clone().add(1, "d"));
      }
    },
    pageUp: function(widget) {
      if (!widget) {
        return;
      }
      var d = this.date() || moment();
      if (widget.find(".datepicker").is(":visible")) {
        this.date(d.clone().subtract(1, "M"));
      }
    },
    pageDown: function(widget) {
      if (!widget) {
        return;
      }
      var d = this.date() || moment();
      if (widget.find(".datepicker").is(":visible")) {
        this.date(d.clone().add(1, "M"));
      }
    },
    enter: function(widget) {
      if (widget) {
        this.hide();
      } else {
        return true;
      }
    },
    escape: function(widget) {
      if (widget) {
        this.hide();
      } else {
        return true;
      }
    },
    tab: function(widget) {
      if (widget) {
        this.hide();
      } else {
        return true;
      }
    },
    "shift tab": function(widget) {
      if (widget) {
        this.hide();
      } else {
        return true;
      }
    },
    "control space": function(widget) {
      if (widget.find(".timepicker").is(":visible")) {
        widget.find('.binf-btn[data-action="togglePeriod"]').click();
      }
    },
    t: function() {
      this.date(moment());
    },
    delete: function() {
      this.clear();
    }
  }, isTouchDevice = !!(base.isTouchBrowser() && (base.isMacintosh() || base.isAppleMobile()));
  return TextAreaFieldView.extend({
    className: function() {
      return TextAreaFieldView.prototype.className + " d2-querybuilderfield";
    },
    events: _.extend(TextAreaFieldView.prototype.events, {
      "focus textarea": "onCursorLocationChange",
      "mousedown textarea": "onCursorLocationChange",
      "keydown textarea": "onQueryKeyDown",
      "keyup textarea": "onQueryKeyUp",
      "input textarea": "onChangeQuery",
      "focusout textarea": "onFocusOut",
      "mouseup td.day": "onMouseUpAfterSelectDay"
    }),
    constructor: function QueryBuilderFieldView(options) {
      this.alpaca = options.alpaca;
      this.showSuggestions = this.alpaca.options.showSuggestions;
      this.startRule = this.alpaca.options.startRule;
      this.lexerClass = this.alpaca.options.lexerClass;
      this.parserClass = this.alpaca.options.parserClass;
      this.listenerClass = this.alpaca.options.listenerClass;
      this.visitorClass = this.alpaca.options.visitorClass;
      this.errorListener = new this.alpaca.options.errorListenerClass["default"]();
      this.replaceableTokens = [];
      this.cursor = 0;
      this.inputStack = [];
      this.stackPosition = 0;
      this.validateFocusOutWithinView = true;
      TextAreaFieldView.prototype.constructor.call(this, options);
      this.listenTo(PubSub, "d2:field:value:change", function(args) {
        if (_.contains(this.alpaca.options.dependingFields, args.name)) {
          this.visitor = null;
          this.ui.writeField.trigger("focusout");
        }
      }.bind(this));
      this.hideDatepicker = true;
    },
    getValue: function() {
      return _.extend(this._visitTree() || {}, {
        criteria: this.getEditValue()
      });
    },
    _createReplaceableTokens: function() {
      this.replaceableTokens = this.showSuggestions ? AdvancedSearchUtils.createTokens(AdvancedSearchUtils.replaceNbsps(this.ui.writeField.val()), this.alpaca.options.tokenDefinitions) : [];
    },
    _createTree: function() {
      var query = AdvancedSearchUtils.replaceNbsps(this.ui.writeField.val()), chars = new Antlr.InputStream(query), lexer = new this.lexerClass["default"](chars), tokens = new Antlr.CommonTokenStream(lexer), parser = new this.parserClass["default"](tokens);
      this.errorListener.clearSyntaxErrors();
      this.errorListener.clearInfoMap();
      parser.removeErrorListeners();
      lexer.removeErrorListeners();
      parser.addErrorListener(this.errorListener);
      lexer.addErrorListener(this.errorListener);
      this.tree = parser[this.startRule]();
    },
    _visitTree: function() {
      !this.tree && this._createTree();
      var context = this.alpacaField.connector.config.context;
      var connector = context && context.getObject("connector") || this.alpacaField.connector.config.formView.node.connector;
      this.visitor = this.visitor || new this.visitorClass["default"](_.extend({
        errorListener: this.errorListener,
        connector: connector
      }, this.alpaca.options.visitorOptions));
      this.errorListener.clearSemanticErrors();
      this.errorListener.clearInfoMap();
      var values = {};
      if (this.formView && this.formView.groupPanelView && this.formView.groupPanelView.children) {
        _.each(this.formView.groupPanelView.children._views, function(childView) {
          if (childView && childView.getContentView() && childView.getContentView().options && childView.getContentView().options.formType === "type") {
            _.extend(values, childView.getContentView().getValues());
          }
        });
      }
      if (this.visitor.getSuggestions().type === "date") {
        if (this.hideDatepicker) {
          this.visitor.hideDatepicker = true;
        } else {
          this.visitor.hideDatepicker = false;
        }
      }
      return this.visitor.visit(this.tree, this.cursor, values["types"]);
    },
    onQueryKeyUp: function(e) {
      if (isTouchDevice) {
        this.onCursorLocationChangeWithoutDelay(e);
      }
      if (this.showSuggestions) {
        var suggestions = this.visitor && this.visitor.getSuggestions();
        if (suggestions && suggestions.show && suggestions.type === "date") {
          if (stopPropogateKeyupEvent) {
            e.stopPropagation();
            e.preventDefault();
          }
          if (e.which === 27 || e.which === 9) {
            this.hideDatepicker = true;
          }
        }
      }
    },
    onQueryKeyDown: function(e) {
      var suggestions = this.visitor && this.visitor.getSuggestions();
      if (isTouchDevice) {
        if (!(suggestions.type === "date" && (e.which === 13 || e.which == 32))) {
          return;
        }
      }
      if (utils.isAndroid() && e.which === 229 && !this.hideDatepicker) {
        this.ui.writeField.parent().data("DateTimePicker").hide();
        this.hideDatepicker = true;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.onCursorLocationChange(e);
      if (e.which === 90 && e.originalEvent.ctrlKey) {
        this.stackPosition = this.stackPosition > 1 ? this.stackPosition - 1 : this.stackPosition;
        this.ui.writeField.val(this.inputStack[this.stackPosition - 1]);
        this._createTree();
        this._createReplaceableTokens();
        this._visitTree();
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.which === 89 && e.originalEvent.ctrlKey) {
        this.stackPosition = this.stackPosition < this.inputStack.length ? this.stackPosition + 1 : this.stackPosition;
        this.ui.writeField.val(this.inputStack[this.stackPosition - 1]);
        this._createTree();
        this._createReplaceableTokens();
        this._visitTree();
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (this.showSuggestions) {
        if (suggestions.type === "date" && this.hideDatepicker && e.which === 13) {
          this.hideDatepicker = false;
          this._visitTree();
          suggestions = this.visitor.getSuggestions();
          if (suggestions && suggestions.show && suggestions.type === "date") {
            var currentDate = this._getCurrentToken();
            this.ui.writeField.typeahead("hide");
            this.ui.writeField.parent().data("DateTimePicker").date(AdvancedSearchUtils.validateDate(currentDate) ? currentDate : moment());
            this.ui.writeField.parent().data("DateTimePicker").show();
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }
        if (suggestions && suggestions.show && suggestions.type === "date" && this.ui.writeField.parent().find(".datepicker").is(":visible")) {
          var handler = null, index, index2, pressedKeys = [], pressedModifiers = {}, currentKey = e.which, keyBindKeys, allModifiersPressed, pressed = "p";
          keyState[currentKey] = pressed;
          for (index in keyState) {
            if (Object.prototype.hasOwnProperty.call(keyState, index) && keyState[index] === pressed) {
              pressedKeys.push(index);
              if (parseInt(index, 10) !== currentKey) {
                pressedModifiers[index] = true;
              }
            }
          }
          for (index in keyBinds) {
            if (Object.prototype.hasOwnProperty.call(keyBinds, index) && typeof keyBinds[index] === "function") {
              keyBindKeys = index.split(" ");
              if (keyBindKeys.length === pressedKeys.length && keyMap[currentKey] === keyBindKeys[keyBindKeys.length - 1]) {
                allModifiersPressed = true;
                for (index2 = keyBindKeys.length - 2; index2 >= 0; index2--) {
                  if (!(keyMap[keyBindKeys[index2]] in pressedModifiers)) {
                    allModifiersPressed = false;
                    break;
                  }
                }
                if (allModifiersPressed) {
                  handler = keyBinds[index];
                  break;
                }
              }
            }
          }
          stopPropogateKeyupEvent = false;
          if (handler) {
            if (!handler.call(this.ui.writeField.parent().data("DateTimePicker"), this.ui.writeField.parent().find(".binf-datetimepicker-widget").length ? this.ui.writeField.parent().find(".binf-datetimepicker-widget") : false)) {
              e.stopPropagation();
              e.preventDefault();
              stopPropogateKeyupEvent = true;
            }
          }
          keyState[e.which] = "r";
          if (e.which === 32 || e.which === 13) {
            this.hideDatepicker = true;
          }
        }
      }
      this.updateValidation();
    },
    updateValidation: function() {
      this.alpacaField.validate();
      this.alpacaField.refreshValidationState(false);
    },
    onCursorLocationChange: _.debounce(function(event) {
      this.onCursorLocationChangeWithoutDelay(event);
    }, 0),
    onCursorLocationChangeWithoutDelay: function(event) {
      var validEvents = isTouchDevice ? [ "click", "focusin" ] : [ "focusin" ];
      if (this.cursor === this.ui.writeField[0].selectionStart && !_.contains(validEvents, event.type)) {
        return;
      }
      this.cursor = this.ui.writeField[0].selectionStart;
      this._visitTree();
      if (this.showSuggestions) {
        var suggestions = this.visitor.getSuggestions();
        if (suggestions && suggestions.show) {
          if (suggestions.type === "date") {
            var currentDate = this._getCurrentToken();
            this.ui.writeField.typeahead("hide");
            this.ui.writeField.parent().data("DateTimePicker").date(AdvancedSearchUtils.validateDate(currentDate) ? currentDate : moment());
            this.ui.writeField.parent().data("DateTimePicker").show();
          } else {
            if (!this.hideAfterSelection) {
              this.ui.writeField.typeahead("lookup", "");
              this.ui.writeField.parent().data("DateTimePicker").hide();
            } else {
              this.hideAfterSelection = false;
            }
          }
        } else {
          this.ui.writeField.typeahead("hide");
          this.ui.writeField.parent().data("DateTimePicker").hide();
        }
      }
      this.updateValidation();
    },
    _updateInputStack: _.debounce(function() {
      while (this.inputStack.length !== this.stackPosition) {
        this.inputStack.pop();
      }
      this.stackPosition++;
      this.inputStack.push(this.ui.writeField.val());
    }, 200),
    onChangeQuery: function(event) {
      event.stopPropagation();
      event.preventDefault();
      this._updateInputStack();
      this._createTree();
      this._createReplaceableTokens();
    },
    onFocusOut: function(event) {
      if (this.$el.has(event.relatedTarget).length === 0 && this.showSuggestions) {
        this.ui.writeField.typeahead("hide");
        this.ui.writeField.parent().data("DateTimePicker").hide();
        this.hideDatepicker = true;
      }
    },
    _addValidationMessageListener: function() {
      var me = this;
      this.alpacaField.getFieldEl().on("DOMSubtreeModified", function() {
        var helpBlock = $(this).find(".binf-help-block");
        if (helpBlock.length) {
          me._removeValidationMessageListener();
          setTimeout(function() {
            helpBlock = $(this).find(".binf-help-block");
            helpBlock.css({
              "white-space": "pre-line"
            });
            if (helpBlock && helpBlock.html()) {
              helpBlock.html(helpBlock.html().replace(/^\s+/g, ""));
            }
          }.bind(this), 50);
        }
      });
    },
    _removeValidationMessageListener: function() {
      this.alpacaField.getFieldEl().off("DOMSubtreeModified");
    },
    validateQuery: function() {
      var status = true, message = "", infoMessage = "";
      if (this.errorListener.getSyntaxErrors().length) {
        status = false;
        _.each(this.errorListener.getSyntaxErrors(), function(error, index) {
          message += error + (index !== this.errorListener.getSyntaxErrors().length - 1 ? "\n" : "");
        }.bind(this));
      }
      this._visitTree();
      if (this.errorListener.getSemanticErrors().length) {
        status = false;
        message = this.errorListener.getSyntaxErrors().length ? message + "\n" : message;
        _.each(this.errorListener.getSemanticErrors(), function(error, index) {
          message += error + (index !== this.errorListener.getSemanticErrors().length - 1 ? "\n" : "");
        }.bind(this));
      }
      this.$el.find(".d2-query-info-message").remove();
      if (this.errorListener.getInfoMap()) {
        var infoMap = this.errorListener.getInfoMap();
        Object.entries(infoMap).forEach((entry, index) => {
          const [ key, value ] = entry;
          var messageKey = key;
          messageKey = _.str.sformat(messageKey, value);
          infoMessage += messageKey + (index !== Object.keys(infoMap).length - 1 ? "\n" : "");
        });
        this._showInfoMessage({
          message: infoMessage
        });
      }
      !status ? this._addValidationMessageListener() : this._removeValidationMessageListener();
      return {
        status: status,
        message: message
      };
    },
    _showInfoMessage: function(info) {
      this.$el.find(".cs-field-write").append('<div class="d2-query-info-message" role="info" style="white-space: pre-line;">' + info.message + "</div>");
    },
    onRender: function() {
      TextAreaFieldView.prototype.onRender.apply(this, arguments);
      this.ui.writeField.attr("spellcheck", false);
      if (this.showSuggestions) {
        var me = this, typeaheadOptions = {
          items: "all",
          minLength: 0,
          autoSelect: false,
          displayText: this.displayText,
          matcher: _.bind(this.filter, this),
          sorter: _.bind(this.sort, this),
          select: function() {
            me._selectSuggestion(this);
            return this.hide();
          },
          source: _.bind(this._getSuggestions, this),
          highlighter: _.bind(this._renderSuggestionItem, this),
          prettyScrolling: true,
          beforeShow: _.bind(this._adjustScrollContainerHeight, this),
          afterShow: _.bind(this._afterShow, this),
          handleNoResults: false
        }, dateTimePickerOptions = {
          inline: true,
          format: inputDate.exactDateInputFormat,
          defaultDate: false
        };
        this.ui.writeField.typeahead(typeaheadOptions);
        if (isTouchDevice) {
          this.ui.writeField.off("keypress");
        }
        this.ui.writeField.data("typeahead").$scrollContainer.on("mousedown", function(e) {
          e.preventDefault();
        });
        this.ui.writeField.parent().datetimepicker(dateTimePickerOptions).on("dp.change", function() {
          me._selectDate();
        }).on("dp.show", function() {
          var dateTimePicker = me.ui.writeField.parent().find(".binf-datetimepicker-widget");
          dateTimePicker.addClass("binf-dropdown-menu");
          var elemBoundingRect = me.ui.writeField[0].getBoundingClientRect(), spaceOnBottom = Math.abs((window.innerHeight - (elemBoundingRect.top + elemBoundingRect.height)) * .9), showOnTop = spaceOnBottom < 255 && Math.abs(elemBoundingRect.top * .9) > 265;
          if (showOnTop) {
            dateTimePicker.css({
              top: "-256px"
            });
          }
        });
        this.ui.writeField.parent().data("DateTimePicker").clear();
        this.ui.writeField.parent().data("DateTimePicker").hide();
      }
    },
    displayText: function(item) {
      return item.displayValue || item.name || item.value;
    },
    _getSuggestions: function() {
      var suggestions = this.visitor && this.visitor.getSuggestions(), data = [];
      if (suggestions && suggestions.show) {
        if (suggestions.async) {
          data = suggestions.getDataSource();
        } else {
          data = suggestions["list"] || [];
        }
      }
      return data;
    },
    _renderSuggestionItem: function(text) {
      if (!_.isNull(this.searchRegex)) {
        text = text.replace(this.searchRegex, function(matchT) {
          var className = "d2-query-builder-suggesstion-item-highlight";
          return "<span class='" + className + "'>" + matchT + "</span>";
        });
      }
      var ele = $('<span class="d2-query-builder-suggestion-item">' + text + "</span>");
      return ele[0];
    },
    _replaceToken: function(currentToken, newToken, noQuotes) {
      var cursorPosition = this.cursor, suggestions = this.visitor && this.visitor.getSuggestions();
      noQuotes = noQuotes || (suggestions ? _.isFunction(suggestions.noQuotes) ? suggestions.noQuotes(newToken) : suggestions.noQuotes : false);
      currentToken = currentToken.replace(/[.+^${}()|[\]\\]/g, "\\$&");
      this.ui.writeField.val(AdvancedSearchUtils.replaceNbsps(this.ui.writeField.val()).replace(new RegExp(currentToken, "g"), function(match, index) {
        if (cursorPosition >= index && cursorPosition <= index + match.length) {
          newToken = noQuotes === true ? newToken : AdvancedSearchUtils.addQuotes(newToken, true);
          this.cursor = index + newToken.length;
          return newToken;
        } else {
          return match;
        }
      }.bind(this))).trigger("input").trigger("focusin");
      this.ui.writeField[0].selectionStart = this.ui.writeField[0].selectionEnd = this.cursor;
    },
    _selectSuggestion: function(typeaheadContext) {
      var item = typeaheadContext.$menu.find(".binf-active").data("value");
      typeaheadContext.$element.data("active", item);
      item = typeaheadContext.updater(item);
      if (item) {
        var currentToken = this._getCurrentToken(), newToken = item.name || item.value;
        this.hideAfterSelection = true;
        this._replaceToken(currentToken, newToken);
      }
    },
    _selectDate: function() {
      var date = this.ui.writeField.parent().data("date"), currentToken = this._getCurrentToken();
      this._replaceToken(currentToken, date, true);
    },
    _adjustScrollContainerHeight: function(typeaheadContext) {
      var elemBoundingRect = typeaheadContext.$element[0].getBoundingClientRect(), spaceOnBottom = window.innerHeight - (elemBoundingRect.top + elemBoundingRect.height);
      spaceOnBottom = Math.abs(spaceOnBottom * .9);
      if (spaceOnBottom < 162 && Math.abs(elemBoundingRect.top * .9) > 162) {
        typeaheadContext.scrollContainerHeight = typeaheadContext.options.scrollContainerHeight = 162;
        typeaheadContext.showOnTop = true;
      } else {
        typeaheadContext.scrollContainerHeight = typeaheadContext.options.scrollContainerHeight = Math.min(spaceOnBottom, 162);
        typeaheadContext.showOnTop = false;
      }
    },
    sort: function(items) {
      var sort = this.visitor.getSuggestions().sort;
      return sort === false ? items : _.sortBy(items, function(item) {
        var value = item.name || item.value;
        return value.toLowerCase();
      });
    },
    _getCurrentToken: function(partialToken) {
      return this._getTokenByPosition(partialToken, this.cursor);
    },
    _getTokenByPosition: function(partialToken, position) {
      var matchToken = "";
      for (var i = 0; i < this.replaceableTokens.length; i++) {
        if (position >= this.replaceableTokens[i].start && position <= this.replaceableTokens[i].stop + 1) {
          matchToken = this.replaceableTokens[i].text;
          if (partialToken) {
            matchToken = matchToken.slice(0, position - this.replaceableTokens[i].start);
          }
          break;
        }
      }
      return matchToken;
    },
    filter: function(item) {
      var label = item.name, value = item.value, searchText = this._getCurrentToken(true), status;
      this.searchRegex = null;
      if (searchText && searchText.length > 0) {
        searchText = searchText.replace(/[.+^${}()|[\]\\]/g, "\\$&");
        searchText = searchText.replace(/\?/g, ".");
        searchText = searchText.replace(/\*/g, ".*?");
        if (AdvancedSearchUtils.hasQuotes(searchText)) {
          searchText = AdvancedSearchUtils.removeQuotes(searchText);
        } else {
          searchText = searchText.replace(/^["']/, "");
        }
        searchText = searchText.replace(/\\"/g, '"').replace(/\\'/g, "'");
        this.searchRegex = new RegExp(searchText, "gi");
      }
      if (!_.isNull(this.searchRegex)) {
        status = !!(label && label.match(this.searchRegex) || value && value.match(this.searchRegex));
      } else {
        status = true;
      }
      return status;
    },
    _afterShow: function(typeaheadContext) {
      if (typeaheadContext.showOnTop) {
        typeaheadContext.$appendTo.css({
          top: typeaheadContext.$element.position().top - typeaheadContext.$scrollContainer.height()
        });
      } else {
        typeaheadContext.$appendTo.css({
          top: typeaheadContext.$element.position().top + typeaheadContext.$element.outerHeight()
        });
      }
    },
    onMouseUpAfterSelectDay: function() {
      this.hideDatepicker = true;
    }
  });
});