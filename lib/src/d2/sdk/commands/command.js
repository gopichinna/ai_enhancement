/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'csui/models/command',
  'd2/overrides/csui/models/command'
], function(_, $, CommandModelImpl){
  'use strict';

  /**
   * Interface for classes that implement a business action over one or more {@link ../models/node.model|NodeModel}.
   *
   * @see {@link ./progressive.nodes.command|ProgressiveNodesComamnd}
   *
   * An implementation should be registered with the {@link ../utils/commands|CommandCollection} by an extension configuration.
   * @example
   * <caption>module mybundle/commands/my.command.js can be defined as</caption>
   *
   * define([
   *    'nuc/lib/jquery',
   *    'd2/sdk/commands/command'
   * ], function($, CommandModel){
   *  var MyCommandModel = CommandModel.extend({
   *     defaults: {
   *        signature: 'MyCommand',
   *        name: 'Example name',
   *        scope: 'single' // Indicates that this action could be executed on a selection of atmost one node, other possible value is 'multiple'
   *     },
   *
   *     enabled: function(status, options) {
   *        return true; // enabled always
   *     },
   *
   *     execute: function(status, options) {
   *        var firstNode = status.nodes.get(0);
   *        console.log("The first node object is: " + firstNode.get('name');
   *        return $.Deferred().resolve().promise(); // Here this command execution will be considered complete as soon as execute() returns
   *     }
   *  });
   *
   *  return MyCommandModel;
   * });
   *
   * @example
   * <caption> to register the command with command collection, in extension.json </caption>
   * {
   *   "d2/sdk/utils/commands": {
   *      "extensions": {
   *        "mybundle": {
   *          "mybundle/commands/my.command"
   *        }
   *      }
   *    }
   * }
   *
   * @module {d2/sdk/commands/command} d2/sdk/commands/command
   * @name CommandModel
   * @extends {external:Backbone.Model}
   * 
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  /**
   * Type of data passed as first argument for any command execution.
   * @typedef {Object} CommandStatus
   * @property {boolean} [suppressSuccessMessage=false] - Setting it to `true` suppresses display of a success toast when this command execution completes successfully.
   * @property {boolean} [suppressFailMessage=false] - Setting it to `true` suppresses display of any error toast even if the command completes with error.
   * @property {NodeCollection} nodes - instance of {@link ../models/node.collection|NodeCollection}, on which node object(s) this command is being executed.
   * @property {Context} [context] - Active application context
   * @property {ToolitemModel} [toolitem] - The menu behind this action, if any.
   * @property {Marionette.View} [originatingView] - The associated UI component where this command is being executed.
   */

  /*
   * Create a new CommandModel. Does not usually require an instantiation though, it can be looked up from the [CommandCollection]{@link ../utils/commands}
   * @class
   * @extends Backbone.Model
   * @alias module:CommandModel
   */
  var CommandModel = CommandModelImpl.extend({
    constructor: function CommandModel(attributes, options) {
      CommandModel.__super__.constructor.call(this, attributes, options);
    },

    /**
     * Get key associated with this command instance.
     * @returns {string} The key/signature of this command.
     * @instance
     *
     */
    getCommandKey: function() {
      return CommandModel.__super__.getCommandKey.call(this);
    },

    /**
     * Whether this command is non-promoted.
     * @returns {boolean} `true` if non-promoted, `false` otherwise.
     * @instance
     *
     */
    isNonPromoted: function(status) {
      return CommandModel.__super__.isNonPromoted.call(this, status);
    },

    /**
     * Whether this command should be enabled for a particular toolbar.
     * @param {CommandStatus} status - Object hash containing the contextual data
     * @param {object} [options] - Additional options that are not part of contextual data like settings
     * @returns {boolean} `true` if the command should be considered as enabled, `false` otherwise
     * @instance
     *
     */
    enabled: function(status, options) {
      return CommandModel.__super__.enabled.call(this, status, options);
    },

    /**
     * Business logic that executes as part of user interacting with this command (usually through a toolbar action).
     *
     * A toast message is usually (unless suppressed) shown in the UI when execution completes and based on the state of the returned promise it can either be a success or an error toast.
     * @param {CommandStatus} status - Object hash containing the contextual data
     * @param {object} [options] - Additional options that are not part of contextual data like settings
     * @returns {jQuery.Promise} The return promise object should be resolved to mark completion of the command execution successfully, whereas a rejection would indicate otherwise
     * @abstract
     * @instance
     *
     * @example <caption>Sample implementation of `execute` could look like</caption>
     * var MyCommand = CommandModel.extend({
     *  ...
     *
     *  execute: function(status, options) {
     *    var promise = $.Deferred().promise();
     *    if(status.say === 'hello') {
     *      console.log('I completed successfully');
     *      promise.resolve();
     *    } else {
     *      console.log('I completed with failure');
     *      promise.reject();
     *    }
     *
     *    return promise;
     *  }
     * });
     */
    execute: function(/*status, options*/) {
      return $.Deferred().resolve().promise();
    }
  });

  /**
   * Attribute types.
   * @typedef {Object} AttributeType
   * @property {string} signature - A unique identifier.
   * @property {string} name - Display name. Usually gets overriden by menu item's label if this `CommandModel` is bound to a toolbar menu item.
   * @property {string} [scope=single] - How many `NodeModel`s this command can execute on simultaneously. Possible values `single` and `multi`.
   */

  /**
   * @name attributes
   * @type {AttributeType}
   * @description Required attributes. Can be defined using `defaults` hash, checkout the example.
   * @see {@link https://backbonejs.org/#Model-attributes|Backbone.Model#attributes} for more details.
   * @memberOf module:CommandModel
   * @instance
   */

  /**
   * @name extend
   * @function
   * @memberof module:CommandModel
   * @description To define a derived type from `CommandModel`.
   * @param {object} protoProperties - Properties attached to the prototype of derived type.
   * @param {function} protoProperties.constructor - The function to be used to construct instance of the derived type.
   * @param {object} staticProperties - Properties statically attached to the derived type.
   * @returns {function} The derived type.
   */

  return CommandModel;
});