/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/models/mixins/rules.matching/rules.matching.mixin", "csui-ext!csui/utils/commands/open.document/delegates/open.document.delegates" ], function(module, _, Backbone, RulesMatchingMixin, rules) {
  "use strict";
  var config = _.extend({
    fileActionSettings: []
  }, module.config());
  var OpenDocumentDelegateModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      command: null
    },
    constructor: function OpenDocumentDelegateModel(attributes, options) {
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
  var DocPreviewRule;
  RulesMatchingMixin.mixin(OpenDocumentDelegateModel.prototype);
  var OpenDocumentDelegateCollection = Backbone.Collection.extend({
    model: OpenDocumentDelegateModel,
    comparator: "sequence",
    constructor: function OpenDocumentDelegateCollection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },
    findByNode: function(node, status, options) {
      var rule = this.find(function(rule) {
        return rule.enabled(node, status, options);
      });
      if (DocPreviewRule && options?.originatingView?.ensureSidePanel && DocPreviewRule?.get("command")?.enabled(status, options)) {
        return DocPreviewRule.get("command");
      }
      return rule && rule.get("command");
    }
  });
  var openDocumentDelegates = new OpenDocumentDelegateCollection();
  if (rules) {
    openDocumentDelegates.add(_.chain(rules).flatten(rules).map(function(rule) {
      return _.defaults({
        command: new rule.command()
      }, rule);
    }).value());
  }
  if (config.fileActionSettings && config.fileActionSettings.length > 0) {
    var defaultActionListArray = config.fileActionSettings;
    var nextSequence = 10;
    defaultActionListArray.forEach(function(action) {
      var rule = openDocumentDelegates.find(function(rule) {
        var command = rule.get("command"), cmdSignature = command.get("signature");
        if (cmdSignature === "DocPreview") {
          DocPreviewRule = rule;
        }
        return cmdSignature === action.Action;
      });
      if (rule) {
        rule.attributes.sequence = nextSequence;
        nextSequence = nextSequence + 5;
      }
    });
    openDocumentDelegates.models.sort(function compareModels(model1, model2) {
      return model1.get("sequence") - model2.get("sequence");
    });
  }
  return openDocumentDelegates;
});