/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/commands/node.progress.command'
], function(NodeProgressCommandImpl){
  'use strict';

  /**
   * Interface for classes that implements business actions over one or more {@link ../models/node.model|NodeModel} such that
   * progress of the action is collectively portrayed on a UI component called ProgressPanel.
   *
   * Normal behavior flow is as follows:
   * 1. The progress panel is displayed, and progress gets updated based on the completion of individual node processing.
   * 2. In case the processing for any node fails, or if user aborts the processing (either using *Stop* button for all pending items, or using Cancel icon against each item), or if `doneCommand` options are enabled and there are multiple nodes and at least one node is not within the `commandContainer`, then the progress panel will remain visible after all processing is complete. User can expand it to see individual item status.
   * 3. In case the processing is successful, then progress panel is removed, and toast message is displayed with success details. If it was a single node and `doneCommand` was applicable, then the toast message will also include done command link.
   *
   * An implementation should be registered with the command collection.
   *
   * @example <caption>A sample implementation delete.js could look like</caption>
   * define([
   *    'nuc/lib/jquery',
   *    'd2/sdk/commands/progressive.nodes.command',
   *    'i18n!mybundle/commands/commands.lang'
   * ], function($, ProgressiveNodesCommand, lang){
   *    var DeleteCommand = ProgressiveNodesCommand.extend({
   *      defaults: {
   *        signature: 'Delete',
   *        command_key: 'Delete',
   *        name: lang.CommandNameDelete,
   *        pageLeavingWarning: lang.DeletePageLeavingWarning,
   *        scope: 'multiple'
   *      },
   *
   *      preProcess: function (status, options) {
   *        options || (options = {});
   *        var me = this,
   *        deferred = $.Deferred();
   *
   *        // Do something...
   *
   *        me._confirmAction(status, options).done(function (deleteOptions) {
   *          options.deleteOptions = deleteOptions;
   *          deferred.resolve();
   *        }).fail(function () {
   *          deferred.reject();
   *        });
   *
   *        return deferred.promise();
   *     },
   *
   *     doAction: function (node, options) {
   *        var deferred = $.Deferred();
   *        node.destroy({
   *          wait: true,
   *          deleteOptions: options.deleteOptions,
   *          container: options.container
   *        }).done(function () {
   *          deferred.resolve(node);
   *        }).fail(deferred.reject);
   *
   *        return deferred.promise();
   *      },
   *
   *      handleResults: function (results, options) {
   *        var sourceCollection = options.originatingView && options.originatingView.collection,
   *        deletedIds = _.compact(_.map(results || [], function (result) {
   *          if (result instanceof Backbone.Model) {
   *            return result.get('id');
   *          }
   *        }));
   *
   *        if (deletedIds.length > 0) {
   *          options.context.trigger('d2:objects:deleted', deletedIds);
   *        }
   *
   *        return sourceCollection.fetch({reload: true});
   *      },
   *
   *      getMessageOptions: function () {
   *        return {
   *          oneFilePending: lang.DeletingOneItem,
   *          multiFilePending: lang.DeletingManyItems,
   *          oneFileSuccess: lang.DeleteOneItemSuccessMessage,
   *          multiFileSuccess: lang.DeleteManyItemsSuccessMessage,
   *          oneFileFailure: lang.DeleteOneItemFailMessage,
   *          multiFileOneFailure: lang.DeleteManyItemsOneFailMessage,
   *          multiFileFailure: lang.DeleteManyItemsFailMessage,
   *          someItemsStopped: lang.DeleteStopped,
   *          actionType: 'DELETE'
   *        };
   *      },
   *
   *      // Other methods...
   *    });
   * });
   *
   * @example
   * <caption> to register the command with command collection, in extension.json </caption>
   * {
   *   "d2/sdk/utils/commands": {
   *      "extensions": {
   *        "mybundle": {
   *          "mybundle/commands/delete"
   *        }
   *      }
   *    }
   * }
   *
   *
   * @module {d2/sdk/commands/progressive.nodes.command} d2/sdk/commands/"progressive.nodes.command"
   * @name ProgressiveNodesCommand
   * @extends {external:CommandModel}
   *
   */

  /**
   * @external CommandModel
   * @see ./command
   */

  /**
   * @typedef {Object} DoneCommandOption
   * @property {string} signature - Signature of command to execute on click
   * @property {string} label - Label to be shown for the link.
   * @property {string} tooltip - Tooltip for the link.
   */

  /**
   * Type of data passed as first argument for any command execution.
   * @typedef {Object} CommandStatus
   * @property {boolean} [hideSuccessMessage=false] - Setting it to `true` suppresses display of a success toast when this command execution completes successfully.
   * @property {boolean} [hideFailureMessage=false] - Setting it to `true` suppresses display of any error toast even if the command completes with error.
   * @property {boolean} [suppressProgress=false] - Setting it to `true` hides the progress panel UI.
   * @property {DoneCommandOption} [doneCommand] - To show additional link on the success toast message upon command completion.
   * @property {NodeModel} [commandContainer] - This must be provided if `doneCommand` link has to be shown. The link is displayed if given node is not within this container.
   * @property {NodeCollection} nodes - Instance of {@link ../models/node.collection|NodeCollection}, on which node object(s) this command is being executed.
   * @property {Context} [context] - Active application context
   * @property {ToolitemModel} [toolitem] - The menu behind this action, if any.
   * @property {Marionette.View} [originatingView] - The associated UI component where this command is being executed.
   */

  /**
   * Return type. Associated `jQuery.Promise` instance should be `resolve()`-ed or `reject()`-ed to mark either successful completion or failed completion respectively.
   * @typedef {jQuery.Promise} PromiseReturnType
   */

  /**
   * Formattable message to be used in progress panel.
   * @typedef {Object} MessageOptionsType
   * @property {string} oneFilePending - Message to be shown for `single` scoped command during processing, &#x7B;0&#x7D; is substituted with node name.
   * @property {string} actionType - To group several executions of the same command into a single progress panel UI wherever applicable. It is a future scoped option.
   */

  var ProgressiveNodesCommand = NodeProgressCommandImpl.extend({
    /**
     * Apply a preprocessing logic before starting off the actual business action to any node
     * @see {@link external:CommandModel#execute|CommandModel#execute}
     * @param {CommandStatus} status - Object hash containing the contextual data
     * @param {object} options - Additional options that are not part of contextual data like settings
     * @returns {PromiseReturnType}
     * @instance
     * @abstract
     */
    preProcess: function(status, options) {
      return ProgressiveNodesCommand.__super__.preProcess.call(this, status, options);
    },

    /**
     * Execute the business action on a single `node` from within the `status.nodes` of {@link module:ProgressiveNodesCommand#preProcess}
     * @param {NodeModel} node - The current NodeModel being processed
     * @param {object} options - Combined `status` and `options` from {@link module:ProgressiveNodesCommand#preProcess}
     * @returns {PromiseReturnType}
     * @instance
     * @abstract
     */
    doAction: function(node, options) {
      return ProgressiveNodesCommand.__super__.doAction.call(this, node, options);
    },

    /**
     * Apply post processing
     * @param {object[]} results - Elements of the argument correspond to each input node. The element is of type `NodeModel` if the command execution for this node was successful.
     * It is `undefined` if the command execution was aborted. In case of failure the type depends on whatever type was used to `reject()` the associated `jQuery.Promise` from {@link module:ProgressiveNodesCommand#doAction}
     * @param {object} options - Combined `status` and `options` from {@link module:ProgressiveNodesCommand#preProcess}
     * @returns {PromiseReturnType}
     * @instance
     * @abstract
     */
    handleResults: function(results, options) {
      return ProgressiveNodesCommand.__super__.handleResults.call(results, options);
    },

    /**
     * Customize different messages shown in the progress panel UI.
     * @param {object} options - Combined `status` and `options` from {@link module:ProgressiveNodesCommand#preProcess}
     * @returns {MessageOptionsType}
     * @instance
     * @abstract
     */
    getMessageOptions: function(options) {
      return ProgressiveNodesCommand.__super__.getMessageOptions.call(this, options);
    }
  });

  /**
   * @name extend
   * @function
   * @memberof module:ProgressiveNodesCommand
   * @description To define a derived type from `ProgressiveNodesCommand`.
   * @param {object} protoProperties - Properties attached to the prototype of derived type.
   * @param {function} protoProperties.constructor - The function to be used to construct instance of the derived type.
   * @param {object} staticProperties - Properties statically attached to the derived type.
   * @returns {function} The derived type.
   */

  return ProgressiveNodesCommand;
});