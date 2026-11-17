/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/mixins/rules.matching/rules.matching.mixin", "csui-ext!d2/utils/contexts/perspective/task.perspectives" ], function(_, Backbone, RulesMatchingMixin, extraPerspectives) {
  var TaskPerspectiveModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      important: false,
      module: null
    },
    constructor: function TaskPerspectiveModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });
  RulesMatchingMixin.mixin(TaskPerspectiveModel.prototype);
  var TaskPerspectiveCollection = Backbone.Collection.extend({
    model: TaskPerspectiveModel,
    comparator: "sequence",
    constructor: function TaskPerspectiveCollection() {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },
    findByNode: function(node) {
      return this.find(function(item) {
        return item.matchRules(node, item.attributes);
      });
    }
  });
  var perspectives = new TaskPerspectiveCollection([ {
    module: "json!d2/utils/contexts/perspective/impl/perspectives/task.documents.json",
    sequence: 9999,
    equals: {
      showTaskDocumentsView: true
    }
  }, {
    module: "json!d2/utils/contexts/perspective/impl/perspectives/task.details.json",
    sequence: 1e4
  } ]);
  if (extraPerspectives) {
    perspectives.add(_.flatten(extraPerspectives, true));
  }
  return perspectives;
});