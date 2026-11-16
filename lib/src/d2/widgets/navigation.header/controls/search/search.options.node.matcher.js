/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/models/mixins/rules.matching/rules.matching.mixin", "d2/utils/constants" ], function(_, RulesMatchingMixin, constants) {
  "use strict";
  var rule_NodeEligileForNodeScope = {
    and: {
      not: {
        equals: {
          id: null
        }
      },
      or: [ {
        equals: {
          type: constants.Types.CABINET
        }
      }, {
        equals: {
          type: constants.Types.FOLDER
        }
      } ]
    }
  };
  var nodeMatcher = {
    isEligibleForNodeScope: function(nodeModel) {
      return this.matchRules(nodeModel, rule_NodeEligileForNodeScope);
    }
  };
  RulesMatchingMixin.mixin(nodeMatcher);
  return nodeMatcher;
});