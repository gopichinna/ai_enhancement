/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "exports", "d2/lib/antlr4/antlr4" ], function(_exports, _antlr) {
  "use strict";
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports["default"] = void 0;
  _antlr = _interopRequireDefault(_antlr);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
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
  var serializedATN = [ "悋Ꜫ脳맭䅼㯧瞆", "奤\tv\b\t\t", "\t\t\t\t", "\b\t\b", "", "", "", "", "", "", "", "", "", "", "S\nV\n\r", "W", "^\n\fa\v", "h\n\f", "k\vn\n\b\b", "q\n\b\r\b\br\b\b_i\t", "\t\v\r\b\t", "QQqqTTttCCccPPpp", "FFffDDddGGggIIii", 'KKkkUUuu""YYyyVVv', "vJJjjEEeeWWwwNNnn", '\v\f""$$)+\v\f"', '"', "\t", "\v\r", "", "", "\t\vR", "\rmp", "*", "+", "\t\t", "\b\t", "\t\t\n", "\t\t\b", "\t\t \t\n !\t", '!"\t\v"#\t\f#$\t\r$', "%\t\n%&\t&S\t'(\t\b", "()\t)*\t*+\t\v", "+,\t\f,-\t\r-.\t\n./\t", "/S\t01\t12\t", "23\t\b34\t\v45\t\f56\t", "67\t78\t89\t\f", "9:\t:;\t;<\t", "<=\t=>\t>?\t\n", "?S\t@A\t\nAB\t\vBC\t\f", "CD\tDE\tEF\t", "FS\tGH\t\nHI\t\v", "IJ\t\fJK\tKL\tLM\t", "MN\t\fNO\tOP\t", "PQ\tQS\tR", "R'R0R@", "RGS\f", "TV\nUTVW", "WUWXXn", "Y_$Z[^[^", "$\\^\v]Z]", "\\^a_`", "_]`ba_", "bn$ci)de^", "eh)fh\vgd", "gfhkij", "igjl", "kiln)mU", "mYmcn", "oq\tpoq", "rrprs", "sttu\b\bu", "\vRW]_gimr\b" ].join("");
  var atn = new _antlr["default"].atn.ATNDeserializer().deserialize(serializedATN);
  var decisionsToDFA = atn.decisionToState.map(function(ds, index) {
    return new _antlr["default"].dfa.DFA(ds, index);
  });
  var PropertySearchLexer = function(_antlr4$Lexer) {
    _inherits(PropertySearchLexer, _antlr4$Lexer);
    var _super = _createSuper(PropertySearchLexer);
    function PropertySearchLexer(input) {
      var _this;
      _classCallCheck(this, PropertySearchLexer);
      _this = _super.call(this, input);
      _this._interp = new _antlr["default"].atn.LexerATNSimulator(_assertThisInitialized(_this), atn, decisionsToDFA, new _antlr["default"].PredictionContextCache());
      return _this;
    }
    _createClass(PropertySearchLexer, [ {
      key: "atn",
      get: function get() {
        return atn;
      }
    } ]);
    return PropertySearchLexer;
  }(_antlr["default"].Lexer);
  _exports["default"] = PropertySearchLexer;
  _defineProperty(PropertySearchLexer, "grammarFileName", "PropertySearch.g4");
  _defineProperty(PropertySearchLexer, "channelNames", [ "DEFAULT_TOKEN_CHANNEL", "HIDDEN" ]);
  _defineProperty(PropertySearchLexer, "modeNames", [ "DEFAULT_MODE" ]);
  _defineProperty(PropertySearchLexer, "literalNames", [ null, "'('", "')'" ]);
  _defineProperty(PropertySearchLexer, "symbolicNames", [ null, "OPEN_PRAN", "CLOSE_PRAN", "OR", "AND", "OP", "ID", "WHITESPACE" ]);
  _defineProperty(PropertySearchLexer, "ruleNames", [ "OPEN_PRAN", "CLOSE_PRAN", "OR", "AND", "OP", "ID", "WHITESPACE" ]);
  PropertySearchLexer.EOF = _antlr["default"].Token.EOF;
  PropertySearchLexer.OPEN_PRAN = 1;
  PropertySearchLexer.CLOSE_PRAN = 2;
  PropertySearchLexer.OR = 3;
  PropertySearchLexer.AND = 4;
  PropertySearchLexer.OP = 5;
  PropertySearchLexer.ID = 6;
  PropertySearchLexer.WHITESPACE = 7;
});