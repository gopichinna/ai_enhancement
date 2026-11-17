/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/models/mixins/rules.matching/rules.matching.mixin',
  // Load and register external authenticator rules
  'csui-ext!nuc/utils/authenticators/authenticators'
], function (_, Backbone, RulesMatchingMixin, rules) {
  'use strict';

  var AuthenticatorModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      authenticator: null
    },

    constructor: function AuthenticatorModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });

  RulesMatchingMixin.mixin(AuthenticatorModel.prototype);

  var AuthenticatorCollection = Backbone.Collection.extend({
    model: AuthenticatorModel,
    comparator: 'sequence',

    constructor: function AuthenticatorCollection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    findByConnection: function (connection) {
      var rule = this.find(function (item) {
        return item.matchRules(connection, item.attributes);
      });
      return rule && rule.get('authenticator');
    }
  });

  var authenticators = new AuthenticatorCollection();

  if (rules) {
    authenticators.add(_.flatten(rules, true));
  }

  return authenticators;
});
