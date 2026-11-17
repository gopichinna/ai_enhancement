/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'csui/utils/defaultactionitems',
  'csui-ext!d2/sdk/commands/default.actions.rules'
], function(_, defaultActionsRules, extRules){
  'use strict';

  /**
   * Default action rules collection. It is an association of command signatures with predicate conditions
   * such that when a condition is met, a command implementing the corresponding signature is identified as an action.
   * Collectively these set of rules define what happens when end user clicks on an item
   * in a list or tabular display of data. Usually an item indicates with a pointer cursor when a default
   * action is matched against the item.
   *
   * NOTE: Actual availability of a default action for an item depends on matching a rule from this default actions rules collection
   * as well as it depends on actual availability of the command in the item's own action collection.
   *
   * D2SV application runtime pre-defines a bunch of rules that opens a document preview, opens details of a task/workflow
   * etc.
   *
   * One or more rules, to define default action for an item type, could be added to this collection by means of extension
   *
   * @see {@link ../../nuc/models/mixins/rules.matching/rules.matching.mixin|RulesMatchingMixin} for a complete guide on how to write rules.
   *
   * @example <caption>to register an extension, add in extension.json</caption>
   *
   * {
   *   "d2/sdk/commands/default.actions.rules": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/commands/my.default.actions.rules"
   *         }
   *      }
   *    }
   * }
   *
   * @example <caption>whereas my.default.actions.rules.js is defined as</caption>
   *
   * define([], function(){
   *    'use strict';
   *
   *    return [
   *      {
   *        signature: 'D2-OpenTask', //`signature` from a CommandModel implementation
   *        type: constants.Types.TASK
   *      },
   *      {
   *        signature: 'D2-OpenVDocSnapshot',
   *        decides: function(node) {
   *          return node.get('r_object_type') === 'd2c_snapshot';
   *        }
   *      }
   *    ];
   * });
   *
   *
   * @module {d2/sdk/commands/default.actions.rules} d2/sdk/commands/"default.actions.rules"
   * @name DefaultActionsRules
   * @extends Array
   */

  if (extRules) {
    defaultActionsRules.add(_.flatten(extRules, true));
  }

  return defaultActionsRules;
});