/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/utils/antlr/scripts/property.search/PropertySearchVisitor", "d2/utils/antlr/scripts/property.search/PropertySearchParser", "d2/utils/advanced.search.utils" ], function(_, $, PropertySearchVisitor, PropertySearchParser, AdvancedSearchUtils) {
  "use strict";
  var EXPRESSION_CONTEXT = Object.freeze({
    QUERY: "QueryContext",
    PARENTHESIS: "ParenthesisExpressionContext",
    AND: "AndExpressionContext",
    OR: "OrExpressionContext",
    RELATION: "RelationExpressionContext",
    BINOMIAL: "BinomialExpressionContext"
  });
  var PropertySearchTreeVisitor = function(options) {
    options = options || {};
    if (!options.typesField || !options.typesToPropertiesMap || !options.typesToPropertiesLabelMap || !options.errorListener) {
      throw new Error("typesField, typeToPropertiesMap, typesToPropertiesLabelMap and errorListener are mandatory in the constructor options");
    }
    this.lastVisitedProperty = null;
    this.lastVisitedPropertyLabel = null;
    this.validBinomialOperator = true;
    this.binomialSyntaxError = false;
    this.andOrVisited = false;
    this.suggestions = {};
    this.errorListener = options.errorListener;
    this.connector = options.connector;
    this.assistenceEnabledProperties = options.assistenceEnabledProperties;
    this.dqlDictUrl = AdvancedSearchUtils.getDQLDictionaryLinkRel(options.searchConfigs);
    this.suggestionList = options.suggestionList;
    this.propertyDisplayType = options.propertyDisplayType;
    this.selectedTypes = [];
    this.hideDatepicker = true;
    var typesField = _.isFunction(options.typesField) ? options.typesField() : options.typesField;
    this._createCommonProperties(typesField, options);
    this.propertySuggestionList = AdvancedSearchUtils.getPropertiesSuggestions(this.commonProperties, this.propertyDisplayType);
    PropertySearchVisitor["default"].call(this);
    return this;
  };
  PropertySearchTreeVisitor.prototype = Object.create(PropertySearchVisitor["default"].prototype);
  PropertySearchTreeVisitor.prototype.constructor = PropertySearchTreeVisitor;
  _.extend(PropertySearchTreeVisitor.prototype, {
    _createCommonProperties: function(typesField, options) {
      var typeValues = typesField.getEditValue(), opts = {
        parent_info_map: options.parentInfoMap,
        types_to_properties_map: options.typesToPropertiesMap,
        types_to_properties_label_map: options.typesToPropertiesLabelMap,
        types_to_all_properties_map: options.typesToAllPropertiesMap,
        types_to_all_properties_label_map: options.typesToAllPropertiesLabelMap
      }, properties = AdvancedSearchUtils.getCommonPropertiesForSuggestionList(typeValues, opts);
      this.commonProperties = properties.commonProperties;
      this.commonPropertiesLabel = properties.commonPropertiesLabel;
    },
    getSuggestions: function() {
      return this.suggestions;
    },
    _isEOF: function(ctx) {
      return ctx.getText() === "<EOF>";
    },
    _getValue: function(ctx) {
      return AdvancedSearchUtils.removeQuotes(ctx.getText());
    },
    _createPropertySuggestion: function() {
      this.suggestions = {
        show: !!_.size(this.commonProperties),
        type: "list",
        list: this.propertySuggestionList
      };
    },
    _createOperatorSuggestion: function(property) {
      if (!_.isObject(property)) {
        property = AdvancedSearchUtils.removeQuotes(property).toLowerCase();
        property = this.commonProperties[property] ? this.commonProperties[property] : this.commonPropertiesLabel[property] ? this.commonPropertiesLabel[property] : property;
      }
      this.suggestions = {
        show: !!_.size(this.commonProperties),
        noQuotes: true,
        sort: false,
        type: "list",
        list: AdvancedSearchUtils.getOperatorSuggestions(property["property_schema_type"])
      };
    },
    _createValueSuggestion: function(property, filter) {
      if (property["property_schema_type"] === "datetime") {
        this.suggestions = {
          show: !!_.size(this.commonProperties) && !this.hideDatepicker,
          type: "date"
        };
      } else {
        if (this.dqlDictUrl !== null && this.assistenceEnabledProperties[property["property_name"]] !== undefined) {
          var selectedTypes = this.selectedTypes ? this.selectedTypes : [];
          var types = _.intersection(this.assistenceEnabledProperties[property["property_name"]], selectedTypes);
          if (types.length > 0) {
            var options = {
              property: property,
              filter: filter,
              connector: this.connector,
              types: types,
              url: this.dqlDictUrl
            };
            var self = this;
            this.suggestions = {
              show: true,
              async: true,
              getDataSource: function() {
                var deferred = $.Deferred();
                AdvancedSearchUtils.getDQLOrDictionaryDataSource(options).done(function(data) {
                  self.suggestionList = {};
                  self.suggestionList[options.property["property_name"]] = data;
                  deferred.resolve(data);
                });
                return deferred.promise();
              },
              type: "list"
            };
          } else {
            this.suggestions = {
              show: false,
              type: "list",
              list: []
            };
          }
        } else {
          this.suggestions = {
            show: false,
            type: "list",
            list: []
          };
        }
      }
    },
    _createAndOrSuggestion: function() {
      this.suggestions = {
        show: !!_.size(this.commonProperties),
        noQuotes: true,
        type: "list",
        list: AdvancedSearchUtils.getAndOrSuggestions()
      };
    },
    visit: function(ctx, cursor, types) {
      this.cursor = _.isUndefined(cursor) ? this.cursor : cursor;
      if (types) {
        this.selectedTypes = types;
      }
      if (ctx) {
        if (_.isArray(ctx)) {
          var expression = {};
          _.each(ctx, function(child) {
            _.extend(expression, child.accept(this));
          }.bind(this));
          return expression;
        } else {
          return ctx.accept(this);
        }
      }
    },
    visitQuery: function(ctx) {
      this.andOrVisited = false;
      this.suggestions = {
        show: false
      };
      if (this.cursor <= ctx.start.start) {
        this._createPropertySuggestion();
      }
      var expression = ctx.children[0].accept(this);
      ctx.children[1] && ctx.children[1].accept(this);
      return {
        "expression-set": !_.isEmpty(expression) ? expression : null
      };
    },
    visitParenthesisExpression: function(ctx) {
      if (this.cursor >= ctx.children[0].getSymbol().stop + 1) {
        this._createPropertySuggestion();
      }
      var expression = ctx.children[1].accept(this);
      if (!(ctx.children[2].isErrorNode && ctx.children[2].isErrorNode()) && this.cursor >= (ctx.children[2].symbol ? ctx.children[2].symbol.stop : ctx.children[2].stop.stop) + 1) {
        this._createAndOrSuggestion();
      }
      return expression;
    },
    _visitAndOrExpression: function(ctx, isAnd) {
      this.andOrVisited = true;
      var left = ctx.children[0].accept(this);
      if (this.cursor >= ctx.children[1].getSymbol().start && this.cursor <= ctx.children[1].getSymbol().stop + 1) {
        this._createAndOrSuggestion();
      } else if (this.cursor >= ctx.children[1].getSymbol().stop + 2) {
        this._createPropertySuggestion();
      }
      var right = ctx.children[2].accept(this), expContextName = this.getExpressionContextName(ctx), leftExpContextName = this.getExpressionContextName(ctx.children[0]), rightExpContextName = this.getExpressionContextName(ctx.children[2]);
      if (expContextName === EXPRESSION_CONTEXT.AND || expContextName === EXPRESSION_CONTEXT.OR) {
        var prevExpressionSet, newExpressionSet, newExpressionContextName;
        if (expContextName === leftExpContextName) {
          prevExpressionSet = left;
          newExpressionSet = right;
          newExpressionContextName = rightExpContextName;
        } else if (expContextName === rightExpContextName) {
          prevExpressionSet = right;
          newExpressionSet = left;
          newExpressionContextName = leftExpContextName;
        }
        if (newExpressionSet && prevExpressionSet && prevExpressionSet.expressions && newExpressionContextName && (newExpressionContextName === EXPRESSION_CONTEXT.RELATION || newExpressionContextName === EXPRESSION_CONTEXT.BINOMIAL) || newExpressionContextName === EXPRESSION_CONTEXT.PARENTHESIS) {
          prevExpressionSet.expressions.push(newExpressionSet);
          return prevExpressionSet;
        }
      }
      return {
        "expression-type": "expression-set",
        operator: isAnd ? "AND" : "OR",
        expressions: [ left, right ]
      };
    },
    getExpressionContextName: function(ctx) {
      var contextType = "", expressionContexts = PropertySearchParser.default;
      if (ctx instanceof expressionContexts.QueryContext) {
        contextType = EXPRESSION_CONTEXT.QUERY;
      } else if (ctx instanceof expressionContexts.ParenthesisExpressionContext) {
        contextType = EXPRESSION_CONTEXT.PARENTHESIS;
      } else if (ctx instanceof expressionContexts.AndExpressionContext) {
        contextType = EXPRESSION_CONTEXT.AND;
      } else if (ctx instanceof expressionContexts.OrExpressionContext) {
        contextType = EXPRESSION_CONTEXT.OR;
      } else if (ctx instanceof expressionContexts.RelationExpressionContext) {
        contextType = EXPRESSION_CONTEXT.RELATION;
      } else if (ctx instanceof expressionContexts.BinomialExpressionContext) {
        contextType = EXPRESSION_CONTEXT.BINOMIAL;
      }
      return contextType;
    },
    visitOrExpression: function(ctx) {
      return this._visitAndOrExpression(ctx, false);
    },
    visitAndExpression: function(ctx) {
      return this._visitAndOrExpression(ctx, true);
    },
    visitRelationExpression: function(ctx) {
      this.cursor >= ctx.stop.stop + 2 && this._createAndOrSuggestion();
      var expression = {
        "expression-type": "property",
        name: ctx.children[0].accept(this),
        operator: ctx.children[1].accept(this),
        value: ctx.children[2].accept(this)
      };
      if (expression.value && _.isString(expression.value) && expression.value.trim().length === 0) {
        expression.value = "";
      }
      if (!this.andOrVisited) {
        expression = {
          "expression-type": "expression-set",
          operator: "AND",
          expressions: [ expression ]
        };
      }
      return expression;
    },
    visitBinomialExpression: function(ctx) {
      var value = this._getValue(ctx);
      var binomialExpression = {
        "expression-type": "property",
        name: ctx.children[0].accept(this),
        operator: ctx.children[1].accept(this)
      };
      if (!this.andOrVisited) {
        binomialExpression = {
          "expression-type": "expression-set",
          operator: "AND",
          expressions: [ binomialExpression ]
        };
      }
      var filter = ctx.children.length > 1 ? "" : value;
      if (this.validBinomialOperator) {
        this.cursor >= ctx.stop.stop + 2 && this._createAndOrSuggestion();
      } else {
        this.cursor >= ctx.stop.stop + 2 && this._createValueSuggestion(this.lastVisitedProperty, filter, ctx);
      }
      return binomialExpression;
    },
    visitProperty: function(ctx) {
      var property = this._getValue(ctx).toLowerCase();
      property = this.commonProperties[property] ? this.commonProperties[property] : this.commonPropertiesLabel[property] ? this.commonPropertiesLabel[property] : property;
      this.lastVisitedProperty = property;
      this.lastVisitedPropertyLabel = this._getValue(ctx);
      if (this.cursor >= ctx.ID().getSymbol().start && this.cursor <= ctx.ID().getSymbol().stop + 1 || ctx.ID().getSymbol().start === -1 && this.cursor >= ctx.stop.stop + 2) {
        this._createPropertySuggestion();
      }
      if (!_.isObject(property)) {
        _.size(this.commonProperties) ? this.errorListener.propertyError(ctx, property) : this.errorListener.propertyError(ctx, property, true);
      }
      return _.isObject(property) ? property["property_name"] : property;
    },
    visitOperator: function(ctx) {
      var operator = this._getValue(ctx);
      if (this.cursor >= ctx.start.start && this.cursor <= ctx.start.stop + 1 || ctx.start.start === -1 && this.cursor >= ctx.start.stop + 2) {
        this._createOperatorSuggestion(this.lastVisitedProperty);
      }
      this.binomialSyntaxError = false;
      if (ctx.parentCtx.getChildCount() === 3) {
        if (!AdvancedSearchUtils.validateOperator(operator, this.lastVisitedProperty["property_schema_type"])) {
          if (AdvancedSearchUtils.validateBinomialOperator(operator, this.lastVisitedProperty["property_schema_type"])) {
            this.binomialSyntaxError = true;
          } else {
            this.errorListener.operatorError(ctx, operator, this.lastVisitedPropertyLabel);
          }
        }
      } else {
        if (AdvancedSearchUtils.validateBinomialOperator(operator, this.lastVisitedProperty["property_schema_type"])) {
          this.validBinomialOperator = true;
        } else {
          this.validBinomialOperator = false;
          if (this.lastVisitedProperty["property_schema_type"] === "datetime" && !!_.size(this.commonProperties)) {
            this.errorListener.operatorSyntaxErrorForDate(ctx, operator, this.lastVisitedPropertyLabel);
          } else {
            this.errorListener.operatorSyntaxError(ctx, operator, this.lastVisitedPropertyLabel);
          }
          !AdvancedSearchUtils.validateOperator(operator, this.lastVisitedProperty["property_schema_type"]) && this.errorListener.operatorError(ctx, operator, this.lastVisitedPropertyLabel);
        }
      }
      return AdvancedSearchUtils.getOperatorServerValue(AdvancedSearchUtils.getOperatorValue(operator, this.lastVisitedProperty["property_schema_type"]));
    },
    visitValue: function(ctx) {
      var value = this._getValue(ctx);
      this.binomialSyntaxError && this.errorListener.binomialOperatorSyntaxError(ctx, value);
      var filter = ctx.children.length > 1 ? "" : value;
      if (ctx.ID()) {
        if (this.cursor >= ctx.ID().getSymbol().start && this.cursor <= ctx.ID().getSymbol().stop + 1 || ctx.ID().getSymbol().start === -1 && this.cursor >= ctx.stop.stop + 2) {
          this.binomialSyntaxError ? this._createAndOrSuggestion() : this._createValueSuggestion(this.lastVisitedProperty, filter, ctx);
        }
      } else if (this.cursor >= ctx.stop.stop + 2) {
        this.binomialSyntaxError ? this._createAndOrSuggestion() : this._createValueSuggestion(this.lastVisitedProperty, filter, ctx);
      }
      if (AdvancedSearchUtils.validateValue(value, this.lastVisitedProperty["property_schema_type"])) {
        value = AdvancedSearchUtils.convertValue(value, this.lastVisitedProperty["property_schema_type"]);
      } else {
        !this.binomialSyntaxError && this.errorListener.valueError(ctx, value, this.lastVisitedPropertyLabel, this.lastVisitedProperty["property_schema_type"]);
      }
      return this._evaluateValueSuggestion(value);
    },
    _evaluateValueSuggestion: function(value) {
      if (this.suggestionList && this.suggestionList[this.lastVisitedProperty["property_name"]]) {
        _.each(this.suggestionList[this.lastVisitedProperty["property_name"]], function(item) {
          if (item.name === value) {
            value = item.value;
          }
        });
      }
      return value;
    },
    visitErrorNode: function(node) {
      if (this.cursor >= node.getSymbol().start && this.cursor <= node.getSymbol().stop + 1) {
        if (node.getParent().ruleIndex === 1) {
          this._createPropertySuggestion();
        } else if (node.getParent().ruleIndex === 0) {
          this._createAndOrSuggestion();
        }
      } else if (this.cursor >= node.getSymbol().stop + 2) {
        if (node.getParent().ruleIndex === 1) {
          this._createOperatorSuggestion(node.getText());
        }
      }
      return null;
    },
    visitTerminal: function(node) {
      if (node.getSymbol().start === 0 || this._isEOF(node.getParent())) {
        this._createPropertySuggestion();
      }
      return null;
    }
  });
  return {
    default: PropertySearchTreeVisitor
  };
});