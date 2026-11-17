/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "nuc/models/mixins/rules.matching/rules.matching.mixin" ], function(Backbone, RulesMatchingMixin) {
  "use strict";
  var RuleMatcherModel = Backbone.Model.extend({
    defaults: {
      sequence: 1e3
    },
    constructor: function RuleMatcherModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });
  RulesMatchingMixin.mixin(RuleMatcherModel.prototype);
  var RuleMatcherCollection = Backbone.Collection.extend({
    model: RuleMatcherModel,
    comparator: "sequence",
    findAllByRule: function(query) {
      return this.filter(function(model) {
        return model.matchRules(model, query);
      });
    },
    findByRule: function(query) {
      return this.find(function(model) {
        return model.matchRules(model, query);
      });
    }
  });
  return RuleMatcherCollection;
});