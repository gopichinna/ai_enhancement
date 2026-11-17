/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/mixins/rules.matching/rules.matching.mixin", "csui-ext!d2/utils/contexts/perspective/virtual.document.perspectives" ], function(_, Backbone, RulesMatchingMixin, extraPerspectives) {
  var VDocPerspectiveModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      important: false,
      module: null
    },
    constructor: function VDocPerspectiveModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });
  RulesMatchingMixin.mixin(VDocPerspectiveModel.prototype);
  var VDocPerspectiveCollection = Backbone.Collection.extend({
    model: VDocPerspectiveModel,
    comparator: "sequence",
    constructor: function VDocPerspectiveCollection() {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },
    findByNode: function(node) {
      return this.find(function(item) {
        return item.matchRules(node, item.attributes);
      });
    }
  });
  var perspectives = new VDocPerspectiveCollection([ {
    module: "json!d2/utils/contexts/perspective/impl/perspectives/edit.virtual.document.json",
    sequence: 9999,
    equals: {
      editVirtualDocumentView: true
    }
  }, {
    module: "json!d2/utils/contexts/perspective/impl/perspectives/virtual.document.json",
    sequence: 1e4
  } ]);
  if (extraPerspectives) {
    perspectives.add(_.flatten(extraPerspectives, true));
  }
  return perspectives;
});