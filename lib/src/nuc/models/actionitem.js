/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/models/mixins/rules.matching/rules.matching.mixin'], function (
  _,
  Backbone,
  RulesMatchingMixin
) {
  'use strict';

  // {
  //   type:        node type to work at (for compatibility only; use operations)
  //   <operation>: selects the action, if it evaluates to true; operations are
  //                equals, differs, includes, excludes, startsWith, endsWith,
  //                decides, or, and, not
  //   signature:   unique identifier of the command to refer to
  //   name:        optional title if the action appears on a label
  //   sequence:    number controlling the priority of processing
  //                this item during the default action evaluation
  // }

  var ActionItemModel = Backbone.Model.extend({
    idAttribute: null,

    defaults: {
      sequence: 100,
      signature: null
    },

    constructor: function ActionItemModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    },

    enabled: function (node) {
      // Compatibility with the previous forms with just type property;
      // not with boolean operations working on node properties
      var type = this.get('type');
      if (type !== undefined) {
        return type == node.get('type');
      }
      return this.matchRules(node, this.attributes);
    }
  });

  RulesMatchingMixin.mixin(ActionItemModel.prototype);

  return ActionItemModel;
});
