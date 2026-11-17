/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/mixins/rules.matching/rules.matching.mixin", "csui-ext!d2/integration/folderbrowser/folder.browser.id.rules", "i18n!d2/integration/folderbrowser/impl/nls/lang" ], function($, _, Backbone, RulesMatchingMixin, extraRules, lang) {
  var IdRuleModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      className: null
    },
    constructor: function IdRuleModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });
  RulesMatchingMixin.mixin(IdRuleModel.prototype);
  var IdRuleCollection = Backbone.Collection.extend({
    model: IdRuleModel,
    comparator: "sequence",
    constructor: function IdRuleCollection() {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },
    fetchNodeId: function(options) {
      var rule = this.find(function(item) {
        return item.matchRules(options.params, item.attributes);
      });
      if (rule) {
        return rule.get("fetcher").call(rule, options);
      } else {
        return $.Deferred().reject(_.str.sformat(lang.InvalidIdSourceParam, options.params.id_source)).promise();
      }
    }
  });
  var rules = new IdRuleCollection([ {
    equals: {
      id_source: "static"
    },
    fetcher: function(options) {
      if (!options.params.folder_id) {
        return $.Deferred().reject(lang.MissingFolderIdParam);
      }
      var folderId = options.currentNodeId || options.params.folder_id;
      return $.Deferred().resolve(folderId);
    },
    sequence: 100
  } ]);
  if (extraRules) {
    rules.add(_.flatten(extraRules, true));
  }
  return rules;
});