/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "exports", "d2/lib/antlr4/antlr4", "./PropertySearchListener", "./PropertySearchVisitor" ], function(_exports, _antlr, _PropertySearchListener, _PropertySearchVisitor) {
  "use strict";
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports["default"] = void 0;
  _antlr = _interopRequireDefault(_antlr);
  _PropertySearchListener = _interopRequireDefault(_PropertySearchListener);
  _PropertySearchVisitor = _interopRequireDefault(_PropertySearchVisitor);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }
  function _get() {
    if (typeof Reflect !== "undefined" && Reflect.get) {
      _get = Reflect.get.bind();
    } else {
      _get = function _get(target, property, receiver) {
        var base = _superPropBase(target, property);
        if (!base) return;
        var desc = Object.getOwnPropertyDescriptor(base, property);
        if (desc.get) {
          return desc.get.call(arguments.length < 3 ? target : receiver);
        }
        return desc.value;
      };
    }
    return _get.apply(this, arguments);
  }
  function _superPropBase(object, property) {
    while (!Object.prototype.hasOwnProperty.call(object, property)) {
      object = _getPrototypeOf(object);
      if (object === null) break;
    }
    return object;
  }
  function _typeof(obj) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
      return typeof obj;
    } : function(obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    Object.defineProperty(subClass, "prototype", {
      writable: false
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }
  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return _setPrototypeOf(o, p);
  }
  function _createSuper(Derived) {
    var hasNativeReflectConstruct = _isNativeReflectConstruct();
    return function _createSuperInternal() {
      var Super = _getPrototypeOf(Derived), result;
      if (hasNativeReflectConstruct) {
        var NewTarget = _getPrototypeOf(this).constructor;
        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }
      return _possibleConstructorReturn(this, result);
    };
  }
  function _possibleConstructorReturn(self, call) {
    if (call && (_typeof(call) === "object" || typeof call === "function")) {
      return call;
    } else if (call !== void 0) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }
    return _assertThisInitialized(self);
  }
  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
  }
  function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;
    try {
      Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
      return true;
    } catch (e) {
      return false;
    }
  }
  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }
  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key);
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return _typeof(key) === "symbol" ? key : String(key);
  }
  function _toPrimitive(input, hint) {
    if (_typeof(input) !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== undefined) {
      var res = prim.call(input, hint || "default");
      if (_typeof(res) !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  var serializedATN = [ "悋Ꜫ脳맭䅼㯧瞆", "奤\t1\t\t", "\t\t\t", "\n", "", "\n", "", "&\n\f)\v", "", "\b\n", "\b0\r", "*\b,\n.", "\f\r\f", "\r", "", "\b", "", "", "\b\n", "", "\b", "", "'", " \f !!&", '"#\f#$', '$&%%"', "&)'%'", "(()'", "*+\b+,-", "\t-\t./\b", "/\v\r%'" ].join("");
  var atn = new _antlr["default"].atn.ATNDeserializer().deserialize(serializedATN);
  var decisionsToDFA = atn.decisionToState.map(function(ds, index) {
    return new _antlr["default"].dfa.DFA(ds, index);
  });
  var sharedContextCache = new _antlr["default"].PredictionContextCache();
  var PropertySearchParser = function(_antlr4$Parser) {
    _inherits(PropertySearchParser, _antlr4$Parser);
    var _super = _createSuper(PropertySearchParser);
    function PropertySearchParser(input) {
      var _this;
      _classCallCheck(this, PropertySearchParser);
      _this = _super.call(this, input);
      _this._interp = new _antlr["default"].atn.ParserATNSimulator(_assertThisInitialized(_this), atn, decisionsToDFA, sharedContextCache);
      _this.ruleNames = PropertySearchParser.ruleNames;
      _this.literalNames = PropertySearchParser.literalNames;
      _this.symbolicNames = PropertySearchParser.symbolicNames;
      return _this;
    }
    _createClass(PropertySearchParser, [ {
      key: "atn",
      get: function get() {
        return atn;
      }
    }, {
      key: "sempred",
      value: function sempred(localctx, ruleIndex, predIndex) {
        switch (ruleIndex) {
         case 1:
          return this.statement_sempred(localctx, predIndex);

         default:
          throw "No predicate with index:" + ruleIndex;
        }
      }
    }, {
      key: "statement_sempred",
      value: function statement_sempred(localctx, predIndex) {
        switch (predIndex) {
         case 0:
          return this.precpred(this._ctx, 4);

         case 1:
          return this.precpred(this._ctx, 3);

         default:
          throw "No predicate with index:" + predIndex;
        }
      }
    }, {
      key: "query",
      value: function query() {
        var localctx = new QueryContext(this, this._ctx, this.state);
        this.enterRule(localctx, 0, PropertySearchParser.RULE_query);
        var _la = 0;
        try {
          this.enterOuterAlt(localctx, 1);
          this.state = 11;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === PropertySearchParser.OPEN_PRAN || _la === PropertySearchParser.ID) {
            this.state = 10;
            this.statement(0);
          }
          this.state = 13;
          this.match(PropertySearchParser.EOF);
        } catch (re) {
          if (re instanceof _antlr["default"].error.RecognitionException) {
            localctx.exception = re;
            this._errHandler.reportError(this, re);
            this._errHandler.recover(this, re);
          } else {
            throw re;
          }
        } finally {
          this.exitRule();
        }
        return localctx;
      }
    }, {
      key: "statement",
      value: function statement(_p) {
        if (_p === undefined) {
          _p = 0;
        }
        var _parentctx = this._ctx;
        var _parentState = this.state;
        var localctx = new StatementContext(this, this._ctx, _parentState);
        var _prevctx = localctx;
        var _startState = 2;
        this.enterRecursionRule(localctx, 2, PropertySearchParser.RULE_statement, _p);
        try {
          this.enterOuterAlt(localctx, 1);
          this.state = 27;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 1, this._ctx);
          switch (la_) {
           case 1:
            localctx = new ParenthesisExpressionContext(this, localctx);
            this._ctx = localctx;
            _prevctx = localctx;
            this.state = 16;
            this.match(PropertySearchParser.OPEN_PRAN);
            this.state = 17;
            this.statement(0);
            this.state = 18;
            this.match(PropertySearchParser.CLOSE_PRAN);
            break;

           case 2:
            localctx = new RelationExpressionContext(this, localctx);
            this._ctx = localctx;
            _prevctx = localctx;
            this.state = 20;
            this.property();
            this.state = 21;
            this.operator();
            this.state = 22;
            this.value();
            break;

           case 3:
            localctx = new BinomialExpressionContext(this, localctx);
            this._ctx = localctx;
            _prevctx = localctx;
            this.state = 24;
            this.property();
            this.state = 25;
            this.operator();
            break;
          }
          this._ctx.stop = this._input.LT(-1);
          this.state = 37;
          this._errHandler.sync(this);
          var _alt = this._interp.adaptivePredict(this._input, 3, this._ctx);
          while (_alt != 2 && _alt != _antlr["default"].atn.ATN.INVALID_ALT_NUMBER) {
            if (_alt === 1) {
              if (this._parseListeners !== null) {
                this.triggerExitRuleEvent();
              }
              _prevctx = localctx;
              this.state = 35;
              this._errHandler.sync(this);
              var la_ = this._interp.adaptivePredict(this._input, 2, this._ctx);
              switch (la_) {
               case 1:
                localctx = new AndExpressionContext(this, new StatementContext(this, _parentctx, _parentState));
                this.pushNewRecursionContext(localctx, _startState, PropertySearchParser.RULE_statement);
                this.state = 29;
                if (!this.precpred(this._ctx, 4)) {
                  throw new _antlr["default"].error.FailedPredicateException(this, "this.precpred(this._ctx, 4)");
                }
                this.state = 30;
                this.match(PropertySearchParser.AND);
                this.state = 31;
                this.statement(5);
                break;

               case 2:
                localctx = new OrExpressionContext(this, new StatementContext(this, _parentctx, _parentState));
                this.pushNewRecursionContext(localctx, _startState, PropertySearchParser.RULE_statement);
                this.state = 32;
                if (!this.precpred(this._ctx, 3)) {
                  throw new _antlr["default"].error.FailedPredicateException(this, "this.precpred(this._ctx, 3)");
                }
                this.state = 33;
                this.match(PropertySearchParser.OR);
                this.state = 34;
                this.statement(4);
                break;
              }
            }
            this.state = 39;
            this._errHandler.sync(this);
            _alt = this._interp.adaptivePredict(this._input, 3, this._ctx);
          }
        } catch (error) {
          if (error instanceof _antlr["default"].error.RecognitionException) {
            localctx.exception = error;
            this._errHandler.reportError(this, error);
            this._errHandler.recover(this, error);
          } else {
            throw error;
          }
        } finally {
          this.unrollRecursionContexts(_parentctx);
        }
        return localctx;
      }
    }, {
      key: "property",
      value: function property() {
        var localctx = new PropertyContext(this, this._ctx, this.state);
        this.enterRule(localctx, 4, PropertySearchParser.RULE_property);
        try {
          this.enterOuterAlt(localctx, 1);
          this.state = 40;
          this.match(PropertySearchParser.ID);
        } catch (re) {
          if (re instanceof _antlr["default"].error.RecognitionException) {
            localctx.exception = re;
            this._errHandler.reportError(this, re);
            this._errHandler.recover(this, re);
          } else {
            throw re;
          }
        } finally {
          this.exitRule();
        }
        return localctx;
      }
    }, {
      key: "operator",
      value: function operator() {
        var localctx = new OperatorContext(this, this._ctx, this.state);
        this.enterRule(localctx, 6, PropertySearchParser.RULE_operator);
        var _la = 0;
        try {
          this.enterOuterAlt(localctx, 1);
          this.state = 42;
          _la = this._input.LA(1);
          if (!(_la === PropertySearchParser.OP || _la === PropertySearchParser.ID)) {
            this._errHandler.recoverInline(this);
          } else {
            this._errHandler.reportMatch(this);
            this.consume();
          }
        } catch (re) {
          if (re instanceof _antlr["default"].error.RecognitionException) {
            localctx.exception = re;
            this._errHandler.reportError(this, re);
            this._errHandler.recover(this, re);
          } else {
            throw re;
          }
        } finally {
          this.exitRule();
        }
        return localctx;
      }
    }, {
      key: "value",
      value: function value() {
        var localctx = new ValueContext(this, this._ctx, this.state);
        this.enterRule(localctx, 8, PropertySearchParser.RULE_value);
        try {
          this.enterOuterAlt(localctx, 1);
          this.state = 44;
          this.match(PropertySearchParser.ID);
        } catch (re) {
          if (re instanceof _antlr["default"].error.RecognitionException) {
            localctx.exception = re;
            this._errHandler.reportError(this, re);
            this._errHandler.recover(this, re);
          } else {
            throw re;
          }
        } finally {
          this.exitRule();
        }
        return localctx;
      }
    } ]);
    return PropertySearchParser;
  }(_antlr["default"].Parser);
  _exports["default"] = PropertySearchParser;
  _defineProperty(PropertySearchParser, "grammarFileName", "PropertySearch.g4");
  _defineProperty(PropertySearchParser, "literalNames", [ null, "'('", "')'" ]);
  _defineProperty(PropertySearchParser, "symbolicNames", [ null, "OPEN_PRAN", "CLOSE_PRAN", "OR", "AND", "OP", "ID", "WHITESPACE" ]);
  _defineProperty(PropertySearchParser, "ruleNames", [ "query", "statement", "property", "operator", "value" ]);
  PropertySearchParser.EOF = _antlr["default"].Token.EOF;
  PropertySearchParser.OPEN_PRAN = 1;
  PropertySearchParser.CLOSE_PRAN = 2;
  PropertySearchParser.OR = 3;
  PropertySearchParser.AND = 4;
  PropertySearchParser.OP = 5;
  PropertySearchParser.ID = 6;
  PropertySearchParser.WHITESPACE = 7;
  PropertySearchParser.RULE_query = 0;
  PropertySearchParser.RULE_statement = 1;
  PropertySearchParser.RULE_property = 2;
  PropertySearchParser.RULE_operator = 3;
  PropertySearchParser.RULE_value = 4;
  var QueryContext = function(_antlr4$ParserRuleCon) {
    _inherits(QueryContext, _antlr4$ParserRuleCon);
    var _super2 = _createSuper(QueryContext);
    function QueryContext(parser, parent, invokingState) {
      var _this2;
      _classCallCheck(this, QueryContext);
      if (parent === undefined) {
        parent = null;
      }
      if (invokingState === undefined || invokingState === null) {
        invokingState = -1;
      }
      _this2 = _super2.call(this, parent, invokingState);
      _this2.parser = parser;
      _this2.ruleIndex = PropertySearchParser.RULE_query;
      return _this2;
    }
    _createClass(QueryContext, [ {
      key: "EOF",
      value: function EOF() {
        return this.getToken(PropertySearchParser.EOF, 0);
      }
    }, {
      key: "statement",
      value: function statement() {
        return this.getTypedRuleContext(StatementContext, 0);
      }
    }, {
      key: "enterRule",
      value: function enterRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.enterQuery(this);
        }
      }
    }, {
      key: "exitRule",
      value: function exitRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.exitQuery(this);
        }
      }
    }, {
      key: "accept",
      value: function accept(visitor) {
        if (visitor instanceof _PropertySearchVisitor["default"]) {
          return visitor.visitQuery(this);
        } else {
          return visitor.visitChildren(this);
        }
      }
    } ]);
    return QueryContext;
  }(_antlr["default"].ParserRuleContext);
  var StatementContext = function(_antlr4$ParserRuleCon2) {
    _inherits(StatementContext, _antlr4$ParserRuleCon2);
    var _super3 = _createSuper(StatementContext);
    function StatementContext(parser, parent, invokingState) {
      var _this3;
      _classCallCheck(this, StatementContext);
      if (parent === undefined) {
        parent = null;
      }
      if (invokingState === undefined || invokingState === null) {
        invokingState = -1;
      }
      _this3 = _super3.call(this, parent, invokingState);
      _this3.parser = parser;
      _this3.ruleIndex = PropertySearchParser.RULE_statement;
      return _this3;
    }
    _createClass(StatementContext, [ {
      key: "copyFrom",
      value: function copyFrom(ctx) {
        _get(_getPrototypeOf(StatementContext.prototype), "copyFrom", this).call(this, ctx);
      }
    } ]);
    return StatementContext;
  }(_antlr["default"].ParserRuleContext);
  var OrExpressionContext = function(_StatementContext) {
    _inherits(OrExpressionContext, _StatementContext);
    var _super4 = _createSuper(OrExpressionContext);
    function OrExpressionContext(parser, ctx) {
      var _thisSuper, _this4;
      _classCallCheck(this, OrExpressionContext);
      _this4 = _super4.call(this, parser);
      _defineProperty(_assertThisInitialized(_this4), "statement", function(i) {
        if (i === undefined) {
          i = null;
        }
        if (i === null) {
          return this.getTypedRuleContexts(StatementContext);
        } else {
          return this.getTypedRuleContext(StatementContext, i);
        }
      });
      _get((_thisSuper = _assertThisInitialized(_this4), _getPrototypeOf(OrExpressionContext.prototype)), "copyFrom", _thisSuper).call(_thisSuper, ctx);
      return _this4;
    }
    _createClass(OrExpressionContext, [ {
      key: "OR",
      value: function OR() {
        return this.getToken(PropertySearchParser.OR, 0);
      }
    }, {
      key: "enterRule",
      value: function enterRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.enterOrExpression(this);
        }
      }
    }, {
      key: "exitRule",
      value: function exitRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.exitOrExpression(this);
        }
      }
    }, {
      key: "accept",
      value: function accept(visitor) {
        if (visitor instanceof _PropertySearchVisitor["default"]) {
          return visitor.visitOrExpression(this);
        } else {
          return visitor.visitChildren(this);
        }
      }
    } ]);
    return OrExpressionContext;
  }(StatementContext);
  PropertySearchParser.OrExpressionContext = OrExpressionContext;
  var AndExpressionContext = function(_StatementContext2) {
    _inherits(AndExpressionContext, _StatementContext2);
    var _super5 = _createSuper(AndExpressionContext);
    function AndExpressionContext(parser, ctx) {
      var _thisSuper2, _this5;
      _classCallCheck(this, AndExpressionContext);
      _this5 = _super5.call(this, parser);
      _defineProperty(_assertThisInitialized(_this5), "statement", function(i) {
        if (i === undefined) {
          i = null;
        }
        if (i === null) {
          return this.getTypedRuleContexts(StatementContext);
        } else {
          return this.getTypedRuleContext(StatementContext, i);
        }
      });
      _get((_thisSuper2 = _assertThisInitialized(_this5), _getPrototypeOf(AndExpressionContext.prototype)), "copyFrom", _thisSuper2).call(_thisSuper2, ctx);
      return _this5;
    }
    _createClass(AndExpressionContext, [ {
      key: "AND",
      value: function AND() {
        return this.getToken(PropertySearchParser.AND, 0);
      }
    }, {
      key: "enterRule",
      value: function enterRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.enterAndExpression(this);
        }
      }
    }, {
      key: "exitRule",
      value: function exitRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.exitAndExpression(this);
        }
      }
    }, {
      key: "accept",
      value: function accept(visitor) {
        if (visitor instanceof _PropertySearchVisitor["default"]) {
          return visitor.visitAndExpression(this);
        } else {
          return visitor.visitChildren(this);
        }
      }
    } ]);
    return AndExpressionContext;
  }(StatementContext);
  PropertySearchParser.AndExpressionContext = AndExpressionContext;
  var ParenthesisExpressionContext = function(_StatementContext3) {
    _inherits(ParenthesisExpressionContext, _StatementContext3);
    var _super6 = _createSuper(ParenthesisExpressionContext);
    function ParenthesisExpressionContext(parser, ctx) {
      var _thisSuper3, _this6;
      _classCallCheck(this, ParenthesisExpressionContext);
      _this6 = _super6.call(this, parser);
      _get((_thisSuper3 = _assertThisInitialized(_this6), _getPrototypeOf(ParenthesisExpressionContext.prototype)), "copyFrom", _thisSuper3).call(_thisSuper3, ctx);
      return _this6;
    }
    _createClass(ParenthesisExpressionContext, [ {
      key: "OPEN_PRAN",
      value: function OPEN_PRAN() {
        return this.getToken(PropertySearchParser.OPEN_PRAN, 0);
      }
    }, {
      key: "statement",
      value: function statement() {
        return this.getTypedRuleContext(StatementContext, 0);
      }
    }, {
      key: "CLOSE_PRAN",
      value: function CLOSE_PRAN() {
        return this.getToken(PropertySearchParser.CLOSE_PRAN, 0);
      }
    }, {
      key: "enterRule",
      value: function enterRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.enterParenthesisExpression(this);
        }
      }
    }, {
      key: "exitRule",
      value: function exitRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.exitParenthesisExpression(this);
        }
      }
    }, {
      key: "accept",
      value: function accept(visitor) {
        if (visitor instanceof _PropertySearchVisitor["default"]) {
          return visitor.visitParenthesisExpression(this);
        } else {
          return visitor.visitChildren(this);
        }
      }
    } ]);
    return ParenthesisExpressionContext;
  }(StatementContext);
  PropertySearchParser.ParenthesisExpressionContext = ParenthesisExpressionContext;
  var RelationExpressionContext = function(_StatementContext4) {
    _inherits(RelationExpressionContext, _StatementContext4);
    var _super7 = _createSuper(RelationExpressionContext);
    function RelationExpressionContext(parser, ctx) {
      var _thisSuper4, _this7;
      _classCallCheck(this, RelationExpressionContext);
      _this7 = _super7.call(this, parser);
      _get((_thisSuper4 = _assertThisInitialized(_this7), _getPrototypeOf(RelationExpressionContext.prototype)), "copyFrom", _thisSuper4).call(_thisSuper4, ctx);
      return _this7;
    }
    _createClass(RelationExpressionContext, [ {
      key: "property",
      value: function property() {
        return this.getTypedRuleContext(PropertyContext, 0);
      }
    }, {
      key: "operator",
      value: function operator() {
        return this.getTypedRuleContext(OperatorContext, 0);
      }
    }, {
      key: "value",
      value: function value() {
        return this.getTypedRuleContext(ValueContext, 0);
      }
    }, {
      key: "enterRule",
      value: function enterRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.enterRelationExpression(this);
        }
      }
    }, {
      key: "exitRule",
      value: function exitRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.exitRelationExpression(this);
        }
      }
    }, {
      key: "accept",
      value: function accept(visitor) {
        if (visitor instanceof _PropertySearchVisitor["default"]) {
          return visitor.visitRelationExpression(this);
        } else {
          return visitor.visitChildren(this);
        }
      }
    } ]);
    return RelationExpressionContext;
  }(StatementContext);
  PropertySearchParser.RelationExpressionContext = RelationExpressionContext;
  var BinomialExpressionContext = function(_StatementContext5) {
    _inherits(BinomialExpressionContext, _StatementContext5);
    var _super8 = _createSuper(BinomialExpressionContext);
    function BinomialExpressionContext(parser, ctx) {
      var _thisSuper5, _this8;
      _classCallCheck(this, BinomialExpressionContext);
      _this8 = _super8.call(this, parser);
      _get((_thisSuper5 = _assertThisInitialized(_this8), _getPrototypeOf(BinomialExpressionContext.prototype)), "copyFrom", _thisSuper5).call(_thisSuper5, ctx);
      return _this8;
    }
    _createClass(BinomialExpressionContext, [ {
      key: "property",
      value: function property() {
        return this.getTypedRuleContext(PropertyContext, 0);
      }
    }, {
      key: "operator",
      value: function operator() {
        return this.getTypedRuleContext(OperatorContext, 0);
      }
    }, {
      key: "enterRule",
      value: function enterRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.enterBinomialExpression(this);
        }
      }
    }, {
      key: "exitRule",
      value: function exitRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.exitBinomialExpression(this);
        }
      }
    }, {
      key: "accept",
      value: function accept(visitor) {
        if (visitor instanceof _PropertySearchVisitor["default"]) {
          return visitor.visitBinomialExpression(this);
        } else {
          return visitor.visitChildren(this);
        }
      }
    } ]);
    return BinomialExpressionContext;
  }(StatementContext);
  PropertySearchParser.BinomialExpressionContext = BinomialExpressionContext;
  var PropertyContext = function(_antlr4$ParserRuleCon3) {
    _inherits(PropertyContext, _antlr4$ParserRuleCon3);
    var _super9 = _createSuper(PropertyContext);
    function PropertyContext(parser, parent, invokingState) {
      var _this9;
      _classCallCheck(this, PropertyContext);
      if (parent === undefined) {
        parent = null;
      }
      if (invokingState === undefined || invokingState === null) {
        invokingState = -1;
      }
      _this9 = _super9.call(this, parent, invokingState);
      _this9.parser = parser;
      _this9.ruleIndex = PropertySearchParser.RULE_property;
      return _this9;
    }
    _createClass(PropertyContext, [ {
      key: "ID",
      value: function ID() {
        return this.getToken(PropertySearchParser.ID, 0);
      }
    }, {
      key: "enterRule",
      value: function enterRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.enterProperty(this);
        }
      }
    }, {
      key: "exitRule",
      value: function exitRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.exitProperty(this);
        }
      }
    }, {
      key: "accept",
      value: function accept(visitor) {
        if (visitor instanceof _PropertySearchVisitor["default"]) {
          return visitor.visitProperty(this);
        } else {
          return visitor.visitChildren(this);
        }
      }
    } ]);
    return PropertyContext;
  }(_antlr["default"].ParserRuleContext);
  var OperatorContext = function(_antlr4$ParserRuleCon4) {
    _inherits(OperatorContext, _antlr4$ParserRuleCon4);
    var _super10 = _createSuper(OperatorContext);
    function OperatorContext(parser, parent, invokingState) {
      var _this10;
      _classCallCheck(this, OperatorContext);
      if (parent === undefined) {
        parent = null;
      }
      if (invokingState === undefined || invokingState === null) {
        invokingState = -1;
      }
      _this10 = _super10.call(this, parent, invokingState);
      _this10.parser = parser;
      _this10.ruleIndex = PropertySearchParser.RULE_operator;
      return _this10;
    }
    _createClass(OperatorContext, [ {
      key: "ID",
      value: function ID() {
        return this.getToken(PropertySearchParser.ID, 0);
      }
    }, {
      key: "OP",
      value: function OP() {
        return this.getToken(PropertySearchParser.OP, 0);
      }
    }, {
      key: "enterRule",
      value: function enterRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.enterOperator(this);
        }
      }
    }, {
      key: "exitRule",
      value: function exitRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.exitOperator(this);
        }
      }
    }, {
      key: "accept",
      value: function accept(visitor) {
        if (visitor instanceof _PropertySearchVisitor["default"]) {
          return visitor.visitOperator(this);
        } else {
          return visitor.visitChildren(this);
        }
      }
    } ]);
    return OperatorContext;
  }(_antlr["default"].ParserRuleContext);
  var ValueContext = function(_antlr4$ParserRuleCon5) {
    _inherits(ValueContext, _antlr4$ParserRuleCon5);
    var _super11 = _createSuper(ValueContext);
    function ValueContext(parser, parent, invokingState) {
      var _this11;
      _classCallCheck(this, ValueContext);
      if (parent === undefined) {
        parent = null;
      }
      if (invokingState === undefined || invokingState === null) {
        invokingState = -1;
      }
      _this11 = _super11.call(this, parent, invokingState);
      _this11.parser = parser;
      _this11.ruleIndex = PropertySearchParser.RULE_value;
      return _this11;
    }
    _createClass(ValueContext, [ {
      key: "ID",
      value: function ID() {
        return this.getToken(PropertySearchParser.ID, 0);
      }
    }, {
      key: "enterRule",
      value: function enterRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.enterValue(this);
        }
      }
    }, {
      key: "exitRule",
      value: function exitRule(listener) {
        if (listener instanceof _PropertySearchListener["default"]) {
          listener.exitValue(this);
        }
      }
    }, {
      key: "accept",
      value: function accept(visitor) {
        if (visitor instanceof _PropertySearchVisitor["default"]) {
          return visitor.visitValue(this);
        } else {
          return visitor.visitChildren(this);
        }
      }
    } ]);
    return ValueContext;
  }(_antlr["default"].ParserRuleContext);
  PropertySearchParser.QueryContext = QueryContext;
  PropertySearchParser.StatementContext = StatementContext;
  PropertySearchParser.PropertyContext = PropertyContext;
  PropertySearchParser.OperatorContext = OperatorContext;
  PropertySearchParser.ValueContext = ValueContext;
});