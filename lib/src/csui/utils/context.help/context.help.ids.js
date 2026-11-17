/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/models/mixins/rules.matching/rules.matching.mixin", "csui-ext!csui/utils/context.help/context.help.ids" ], function(_, Backbone, RulesMatchingMixin, extraHelpIds) {
  var ContextHelpIdModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      important: false,
      module: null
    },
    constructor: function ContextHelpIdModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });
  RulesMatchingMixin.mixin(ContextHelpIdModel.prototype);
  var ContextHelpIdCollection = Backbone.Collection.extend({
    model: ContextHelpIdModel,
    comparator: "sequence",
    constructor: function ContextHelpIdCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },
    findByApplicationScope: function(options) {
      return this.find(function(item) {
        return item.matchRules(options, item.attributes);
      });
    }
  });
  var helpIds = new ContextHelpIdCollection([ {
    sequence: 50,
    decides: function(options) {
      return options.context.getModel("applicationScope").id === "properties" && options.context.viewStateModel && options.context.viewStateModel.get("state").dropdown === "versions";
    },
    contextHelpId: "qs-versionpg-bg"
  }, {
    sequence: 50,
    decides: function(options) {
      return options.context.getModel("applicationScope").id === "properties" && options.context.viewStateModel && options.context.viewStateModel.get("state").dropdown === "audit";
    },
    contextHelpId: "qs-audithistory-bg"
  }, {
    sequence: 50,
    decides: function(options) {
      return options.context.getModel("applicationScope").id === "node" && options.context.getModel("node").get("type") === 298;
    },
    contextHelpId: "qs-addtocollection-bg"
  }, {
    sequence: 50,
    decides: function(options) {
      return options.context.getModel("applicationScope").id === "node" && options.context.getModel("node").get("type") === 136;
    },
    contextHelpId: "compound-documents-so"
  }, {
    sequence: 50,
    decides: function(options) {
      return options.context.getModel("applicationScope").id === "node" && options.context.getModel("node").get("type") === 751;
    },
    contextHelpId: "qs-itemtypes-bg"
  }, {
    sequence: 50,
    decides: function(options) {
      return options.context.viewStateModel.get("session_state") && options.context.viewStateModel.get("session_state").permissions;
    },
    contextHelpId: "qs-permissions-bg"
  } ]);
  helpIds.map(model => model.helpDocId = "cssui250400-h-ugd");
  if (extraHelpIds) {
    helpIds.add(_.flatten(extraHelpIds, true));
  }
  return helpIds;
});