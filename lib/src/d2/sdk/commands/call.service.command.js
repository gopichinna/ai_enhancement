/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/commands/call.service'
], function(CallServiceImpl){
  'use strict';

  /**
   * Base class for implementing command/menu that invokes a D2FS service method. D2 Smartview runtime already provides an OOTB binding
   * for such a command implementation. However, to suit particular business needs where an OOTB binding does not suffice, a new implementation
   * extending from this module can be used to define such custom bindings.
   *
   * @see {@link ./command|CommandModel}
   * @see {@link ./node.actions.rules|NodeActionsRules}
   *
   * @example <caption>to register binding for a custom implementation, add in extension.json</caption>
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
   * @example <caption>whereas my.node.actions.rules.js is defined similar to</caption>
   *
   * define([], function(){
   *    'use strict';
   *
   *    return [
   *      {
   *        command_key: 'D2-CustomCallService',
   *        decides: function(item) {
   *          return item.action === 'D2_ACTION_EXECUTE' &&
   *            item.actionParameters && item.actionParameters.eService === 'PermissionActionService';
   *        }
   *        iconName: 'some_icon'
   *      }
   *    ];
   * });
   *
   * @example
   * <caption> to register an implementation with command collection, in extension.json </caption>
   * {
   *   "d2/sdk/utils/commands": {
   *      "extensions": {
   *        "mybundle": {
   *          "mybundle/commands/my.custom.call.service"
   *        }
   *      }
   *    }
   * }
   *
   * @example
   * <caption>module mybundle/commands/my.custom.call.service can be defined as</caption>
   *
   * define([
   *    'nuc/lib/jquery',
   *    'd2/sdk/commands/call.service.command'
   * ], function($, CallServiceCommandImpl){
   *  var MyCustomCallService = CallServiceCommandImpl.extend({
   *     defaults: {
   *        command_key: 'D2-CustomCallService',
   *        signature: 'D2-CustomCallService',
   *        name: 'Custom call service'
   *     },
   *
   *     constructor: function MyCustomCallService(attr, options) {
   *        MyCustomCallService.__super__.constructor.call(this, attr, options);
   *     }
   *
   *     beforeServiceCall: function(nodes, commandData) {
   *        var requestProperties = {};
   *        //Custom logic to populate
   *        return requestProperties; //It will be mixed with other default properties as part of request body while sending d2-generic-action-service
   *     },
   *
   *     afterServiceCall: function(nodes, commandData, responseProperties) {
   *        //Custom logic to modify responseProperties
   *        //Later this modified responseProperties becomes input for final JS action invocation.
   *     }
   *  });
   *
   *  return MyCustomCallService;
   * });
   *
   * @module {d2/sdk/commands/call.service.command} d2/sdk/commands/"call.service.command"
   * @name CallServiceCommand
   * @extends {CommandModel}
   */

  var CallServiceCommand = CallServiceImpl.extend({
    constructor: function CallServiceCommand(attr, options) {
      CallServiceCommand.__super__.constructor.call(this, attr, options);
    },

    /**
     * Make changes to the request properties sent out for underlying D2-REST API call.
     * @param {NodeModel[]} nodes - Selected NodeModel objects upon which the command is being run.
     * @param {Object} commandData - Object hash containing the default invocation properties
     * @return {Object} Returns the final properties set to be used as part of request body. Will also be mixed with the default properties.
     */
    beforeServiceCall: function(nodes, commandData) {
      return CallServiceCommand.__super__.beforeServiceCall.call(this, nodes, commandData);
    },

    /**
     * Change invocation data for final JS action
     * @param {NodeModel[]} nodes - Selected NodeModel objects upon which the command is being run.
     * @param {Object} commandData - Object hash containing the default invocation properties
     * @param {Object} responseProperties - Raw response from underlying D2-REST API call. The same object is also used to invoke final JS action.
     * @return void
     */
    afterServiceCall: function(nodes, commandData, responseProperties) {
      CallServiceCommand.__super__.afterServiceCall.call(this, nodes, commandData, responseProperties);
    }
  });

  return CallServiceCommand;
});