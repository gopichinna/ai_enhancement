/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/underscore", "csui/lib/backbone", "csui/models/mixins/rules.matching/rules.matching.mixin", "csui-ext!csui/utils/commands/versions/open.version/delegates/open.version.delegates" ], function(require, _, Backbone, RulesMatchingMixin, rules) {
  "use strict";
  var config = _.extend({
    fileActionSettings: []
  }, require.moduleConfig("csui/utils/commands/open.document/delegates/open.document.delegates"));
  var OpenVersionDelegateModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      command: null
    },
    constructor: function OpenVersionDelegateModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    },
    enabled: function(node, status, options) {
      var context = status.context || options && options.context;
      var matchOptions = {
        context: context
      };
      return this.matchRules(node, this.attributes, matchOptions) && this.get("command").enabled(status, options);
    }
  });
  RulesMatchingMixin.mixin(OpenVersionDelegateModel.prototype);
  var OpenVersionDelegateCollection = Backbone.Collection.extend({
    model: OpenVersionDelegateModel,
    comparator: "sequence",
    constructor: function OpenVersionDelegateCollection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },
    findByNode: function(node, status, options) {
      var rule = this.find(function(rule) {
        return rule.enabled(node, status, options);
      });
      return rule && rule.get("command");
    }
  });
  var openVersionDelegates = new OpenVersionDelegateCollection();
  if (rules) {
    openVersionDelegates.add(_.chain(rules).flatten(rules).map(function(rule) {
      return _.defaults({
        command: new rule.command()
      }, rule);
    }).value());
  }
  if (config.fileActionSettings && config.fileActionSettings.length > 0) {
    var defaultActionListArray = config.fileActionSettings;
    var nextSequence = 5;
    defaultActionListArray.forEach(function(action) {
      var rule = openVersionDelegates.find(function(rule) {
        var command = rule.get("command"), cmdSignature = command.get("signature"), commandKeys = command.get("command_key");
        return cmdSignature === action.Action || commandKeys.find(function(command) {
          return command === action.Action;
        });
      });
      if (rule) {
        rule.attributes.sequence = nextSequence;
        nextSequence = nextSequence + 5;
      }
    });
    openVersionDelegates.models.sort(function compareModels(model1, model2) {
      return model1.get("sequence") - model2.get("sequence");
    });
  }
  return openVersionDelegates;
});