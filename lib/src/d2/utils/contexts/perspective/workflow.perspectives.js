/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/mixins/rules.matching/rules.matching.mixin", "csui-ext!d2/utils/contexts/perspective/workflow.perspectives" ], function(_, Backbone, RulesMatchingMixin, extraPerspectives) {
  var WorkflowPerspectiveModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      important: false,
      module: null
    },
    constructor: function WorkflowPerspectiveModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });
  RulesMatchingMixin.mixin(WorkflowPerspectiveModel.prototype);
  var WorkflowPerspectiveCollection = Backbone.Collection.extend({
    model: WorkflowPerspectiveModel,
    comparator: "sequence",
    constructor: function WorkflowPerspectiveCollection() {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },
    findByNode: function(node) {
      return this.find(function(item) {
        return item.matchRules(node, item.attributes);
      });
    }
  });
  var perspectives = new WorkflowPerspectiveCollection([ {
    module: "json!d2/utils/contexts/perspective/impl/perspectives/workflow.audit.json",
    sequence: 9998,
    equals: {
      showWorkflowAuditView: true
    }
  }, {
    module: "json!d2/utils/contexts/perspective/impl/perspectives/workflow.documents.json",
    sequence: 9999,
    equals: {
      showWorkflowDocumentsView: true
    }
  }, {
    module: "json!d2/utils/contexts/perspective/impl/perspectives/workflow.details.json",
    sequence: 1e4
  } ]);
  if (extraPerspectives) {
    perspectives.add(_.flatten(extraPerspectives, true));
  }
  return perspectives;
});