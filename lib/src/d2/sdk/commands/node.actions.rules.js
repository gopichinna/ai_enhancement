/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'd2/commands/node.actions.rules',
  'csui-ext!d2/sdk/commands/node.actions.rules'
],function(_, nodeActionsRules, extRules){
  'use strict';

  var ckBlacklist = _.chain(nodeActionsRules)
    .reject(function(defaultRule){
      return (defaultRule.prioritisePluginImpl === true);
    })
    .map(function(defaultRule){
      return defaultRule.command_key;
    })
    .value();

  /**
   * Action rules collection. Each rule binds a D2SV menu action to a [CommandModel]{@link ./command} by mapping through it's signature.
   * So that when the menu action is selected by end user from a menu toolbar, business logic from the mapped `CommandModel` is executed.
   * If a `NodeModel` is found to have a menu action that is not mapped to any `CommandModel`'s signature, the menu action is ignored.
   *
   * D2SV application runtime pre-defines many such mappings for OOTB business actions.
   *
   * One or more rules, to map new actions, could be added to this collection by means of extension.
   *
   * @see {@link ../../nuc/models/mixins/rules.matching/rules.matching.mixin|RulesMatchingMixin} for a complete guide on how to write rules.
   *
   * @example <caption>to register an extension, add in extension.json</caption>
   *
   * {
   *   "d2/sdk/commands/node.actions.rules": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/commands/my.node.actions.rules"
   *         }
   *      }
   *    }
   * }
   *
   * @example <caption>whereas my.node.actions.rules.js is defined as</caption>
   *
   * define([], function(){
   *    'use strict';
   *
   *    return [
   *      {
   *        command_key: 'D2-OpenUrl', //`signature` from a CommandModel implementation
   *        equals: {action: 'D2_ACTION_OPEN_URL'},
   *        iconName: 'd2_action_open_url'
   *      },
   *      {
   *        command_key: 'Delete',
   *        decides: function(item) {
   *          return item.action === 'D2_ACTION_EXECUTE_MANAGER' &&
   *            item.actionParameters && item.actionParameters.MANAGER === 'DestroyManager';
   *        },
   *        iconName: 'd2_action_delete' // The icon to use when this action is shown in a toolbar with icon.
   *      }
   *    ];
   * });
   *
   * @module {d2/sdk/commands/node.actions.rules} d2/sdk/commands/"node.actions.rules"
   * @name NodeActionsRules
   * @extends Array
   *
   */

  if(extRules) {
    extRules = _.chain(_.flatten(extRules, true))
      .reject(function(rule){
        return _.includes(ckBlacklist, rule.command_key);
      })
      .sortBy('order')
      .value();

    Array.prototype.unshift.apply(nodeActionsRules, extRules);
  }

  return nodeActionsRules;
});