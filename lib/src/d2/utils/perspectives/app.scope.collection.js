/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/landingpage/default.widget.types.map", "d2/utils/widget.constants", "dctmw/utils/rule.matcher.collection" ], function(_, defaultWidgetTypesMap, widgetConstants, RuleMatcherCollection) {
  "use strict";
  var RuleMatcherModel = RuleMatcherCollection.prototype.model;
  var D2ApplicationScopeModel = RuleMatcherModel.extend({
    defaults: {
      _srcNS: "d2",
      perspectiveJson: "",
      sequence: 1e3,
      validateConfig: function() {
        return {
          status: true
        };
      },
      beforeActivateScope: function() {},
      afterDeactivateScope: function() {}
    },
    constructor: function D2ApplicationScopeModel() {
      RuleMatcherModel.apply(this, arguments);
    },
    validateConfig: function() {
      var validator = this.get("validateConfig"), validationResult = {
        status: true
      };
      try {
        if (_.isFunction(validator)) {
          _.extend(validationResult, validator.apply(this, arguments));
        }
      } catch (e) {
        console.error(e);
        validationResult = {
          status: false,
          errorMessage: e.message
        };
      }
      return validationResult;
    },
    getPerspectiveJson: function() {
      var perspectiveJson = this.get("perspectiveJson") || this.get("applicationScope") || "Unknown";
      if (!perspectiveJson.endsWith(".json")) {
        perspectiveJson += ".json";
      }
      if (perspectiveJson.indexOf("/") === -1) {
        perspectiveJson = this.get("_srcNS") + "/utils/perspectives/" + perspectiveJson;
      }
      this.set("perspectiveJson", perspectiveJson, {
        silent: true
      });
      return perspectiveJson;
    },
    getTitle: function() {
      return this.get("defaultTitle");
    },
    getDefaultWidgetType: function() {
      return this.get("defaultWidgetType");
    },
    getWidgetType: function() {
      if (!this.get("widgetType") && this.getDefaultWidgetType()) {
        this.set("widgetType", defaultWidgetTypesMap.getMaps()[this.getDefaultWidgetType()].type, {
          silent: true
        });
      }
      return this.get("widgetType");
    },
    applyBeforeActivateHook: function() {
      var fnBeforeActivate = this.get("beforeActivateScope") || _.noop, isActive = this.get("isActive"), retVal;
      if (!isActive) {
        this.set("isActive", true);
        if (_.isFunction(fnBeforeActivate)) {
          try {
            retVal = fnBeforeActivate;
          } catch (e) {
            console.warn(e);
          }
        }
      }
      return retVal;
    },
    applyAfterDeactivateHook: function() {
      var fnAfterDeactivate = this.get("afterDeactivateScope") || _.noop, isActive = this.get("isActive");
      if (isActive) {
        this.set("isActive", false);
        if (_.isFunction(fnAfterDeactivate)) {
          try {
            fnAfterDeactivate();
          } catch (e) {
            console.warn(e);
          }
        }
      }
    }
  });
  var D2ApplicationScopeCollection = RuleMatcherCollection.extend({
    model: D2ApplicationScopeModel,
    comparator: "sequence",
    getModelForScope: function(applicationScope) {
      return _.chain(this.findAllByRule({
        equals: {
          applicationScope: applicationScope
        }
      })).groupBy(function(m) {
        return m.get("applicationScope");
      }).map(_.first).first().value();
    },
    getActiveApplicationScopeModels: function() {
      return _.chain(this.findAllByRule({
        not: {
          equals: {
            applicationScope: ""
          }
        }
      })).groupBy(function(m) {
        return m.get("applicationScope");
      }).map(_.first).value();
    },
    getActiveApplicationScopes: function() {
      return _.chain(this.getActiveApplicationScopeModels()).map(function(m) {
        return m.get("applicationScope");
      }).compact().value();
    }
  });
  return D2ApplicationScopeCollection;
});